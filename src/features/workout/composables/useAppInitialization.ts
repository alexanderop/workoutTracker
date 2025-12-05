import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { activeWorkoutRepository } from '@/db/repositories/activeWorkout'
import { seedPopularExercises } from '@/db/seedExercises'
import { useExercisesStore } from '@/stores/exercises'
import { useSettingsStore } from '@/stores/settings'
import { getWorkoutRef, restoreWorkout } from '@/features/workout/composables/useWorkout'
import { useWorkoutPersistence } from '@/features/workout/composables/useWorkoutPersistence'

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
  const workoutRef = getWorkoutRef()
  const persistence = useWorkoutPersistence(workoutRef)

  /**
   * Initialize the app: load exercises and check for active workout.
   */
  async function initialize(): Promise<void> {
    // Only allow initialization from loading state (prevents re-entry)
    if (initState.value.status !== 'loading') return

    try {
      // Seed popular exercises first (idempotent)
      await seedPopularExercises()

      // Load settings and custom exercises from DB in parallel
      await Promise.all([settingsStore.loadFromDb(), exercisesStore.loadFromDb()])

      // Check for active workout
      const activeWorkout = await activeWorkoutRepository.get()

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
    } catch (error) {
      initState.value = {
        status: 'error',
        error: error instanceof Error ? error : new Error('Initialization failed'),
      }
    }
  }

  /**
   * Resume the active workout from the database.
   */
  async function resumeWorkout(): Promise<void> {
    const savedWorkout = await persistence.loadActiveWorkout()
    if (savedWorkout) {
      restoreWorkout(savedWorkout)
      persistence.markInitialized()
    }
    initState.value = { status: 'ready' }

    // Navigate to active workout with error handling
    try {
      await router.push('/workout/active')
    } catch (error) {
      // Navigation failures are typically user-initiated (e.g., back button)
      console.warn('Navigation to active workout failed:', error)
    }
  }

  /**
   * Discard the saved workout and start fresh.
   */
  async function discardWorkout(): Promise<void> {
    await persistence.discardActiveWorkout()
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
