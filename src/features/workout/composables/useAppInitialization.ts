import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import { getActiveWorkoutRepository } from '@/db'
import { seedPopularExercises } from '@/db/seedExercises'
import { seedPopularTemplates } from '@/db/seedTemplates'
import { useExercisesStore } from '@/stores/exercises'
import { useSettingsStore } from '@/stores/settings'
import { useWorkoutSession } from '@/features/workout/session'
import { tryCatch } from '@/lib/tryCatch'

/**
 * App initialization state using discriminated union.
 */
type InitState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'prompt-resume'; workoutName: string; blockCount: number }
  | { status: 'error'; error: Error }

const initState = ref<InitState>({ status: 'loading' })
const isInitialized = computed(() => initState.value.status === 'ready')

/**
 * Reset initialization state for testing.
 */
export function resetInitState(): void {
  initState.value = { status: 'loading' }
}

/**
 * Composable for app-level initialization.
 * Handles loading data from IndexedDB and prompting to resume workouts.
 */
export function useAppInitialization() {
  const router = useRouter()
  const exercisesStore = useExercisesStore()
  const settingsStore = useSettingsStore()
  const session = useWorkoutSession()

  /**
   * Initialize the app: load exercises and check for active workout.
   */
  async function initialize(): Promise<void> {
    // Only allow initialization from loading state (prevents re-entry)
    if (initState.value.status !== 'loading') return

    const [error] = await tryCatch(
      (async () => {
        // Seed popular exercises and templates first (idempotent)
        await seedPopularExercises()
        await seedPopularTemplates()

        // Load settings and custom exercises from DB in parallel
        await Promise.all([settingsStore.loadFromDb(), exercisesStore.loadFromDb()])

        // Check for active workout
        const activeWorkout = await getActiveWorkoutRepository().get()

        if (activeWorkout && activeWorkout.blocks.length > 0) {
          // Prompt user to resume
          initState.value = {
            status: 'prompt-resume',
            workoutName: activeWorkout.name,
            blockCount: activeWorkout.blocks.length,
          }
          return
        }

        initState.value = { status: 'ready' }
      })(),
    )

    if (error) {
      initState.value = { status: 'error', error }
    }
  }

  /**
   * Resume the active workout from the database.
   */
  async function resumeWorkout(): Promise<void> {
    const savedWorkout = await session.loadActiveWorkout()
    if (savedWorkout) {
      session.markInitialized()
    }
    initState.value = { status: 'ready' }

    // Navigate to active workout - failures are typically user-initiated (e.g., back button)
    await tryCatch(router.push({ name: RouteNames.ActiveWorkout }))
  }

  /**
   * Discard the saved workout and start fresh.
   */
  async function discardWorkout(): Promise<void> {
    await session.discardActiveWorkout()
    initState.value = { status: 'ready' }
  }

  return {
    initState,
    isInitialized,
    initialize,
    resumeWorkout,
    discardWorkout,
  }
}
