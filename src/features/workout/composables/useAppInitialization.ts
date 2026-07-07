import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import { getActiveWorkoutRepository, type LiveQuery } from '@/db'
import type { DbActiveWorkout } from '@/db/schema'
import { seedPopularExercises } from '@/db/seedExercises'
import { seedPopularTemplates } from '@/db/seedTemplates'
import { useExercisesStore } from '@/stores/exercises'
import { useSettingsStore } from '@/stores/settings'
import { getWorkoutRef, restoreWorkout } from '@/features/workout/composables/useWorkout'
import { useWorkoutPersistence } from '@/features/workout/composables/useWorkoutPersistence'
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

// Lazily-created, module-lifetime live query over the active workout. Created
// on first use (not at module import time) so it never races repository
// provider setup. Its `subscribe()` only reacts while `initState` is parked in
// `prompt-resume` -- once the user resumes, the in-memory working copy in
// `useWorkout` plus `createPersistenceCore`'s own debounced auto-save become
// the source of truth, and this subscription intentionally stops touching
// `initState` so a stale snapshot can never clobber in-progress edits. This
// gives cross-tab awareness for the one window where it's safe: another tab
// discarding/completing the workout while this tab is still asking "resume?".
let activeWorkoutQuery: LiveQuery<DbActiveWorkout | undefined> | undefined

function getActiveWorkoutQuery(): LiveQuery<DbActiveWorkout | undefined> {
  if (!activeWorkoutQuery) {
    activeWorkoutQuery = getActiveWorkoutRepository().observe()
    activeWorkoutQuery.subscribe((activeWorkout) => {
      if (initState.value.status !== 'prompt-resume') return

      const isResumable =
        activeWorkout && activeWorkout.blocks.length > 0 && activeWorkout.mode !== 'completed'
      if (!isResumable) {
        initState.value = { status: 'ready' }
        return
      }

      initState.value = {
        status: 'prompt-resume',
        workoutName: activeWorkout.name,
        blockCount: activeWorkout.blocks.length,
      }
    })
  }

  return activeWorkoutQuery
}

/**
 * Composable for app-level initialization.
 * Handles loading data from IndexedDB and prompting to resume workouts.
 */
export function useAppInitialization() {
  const router = useRouter()
  const exercisesStore = useExercisesStore()
  const settingsStore = useSettingsStore()
  const workoutReference = getWorkoutRef()
  const persistence = useWorkoutPersistence(workoutReference)

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
        const activeWorkout = await getActiveWorkoutQuery().get()

        // A draft in 'completed' mode is a finished workout that already
        // lives in history (older builds' debounced auto-save resurrected the
        // draft after completion deleted it). Drop it instead of offering to
        // resume -- resuming would duplicate the workout.
        if (activeWorkout && activeWorkout.mode === 'completed') {
          await getActiveWorkoutRepository().clear()
          initState.value = { status: 'ready' }
          return
        }

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
    const savedWorkout = await persistence.loadActiveWorkout()
    if (savedWorkout) {
      restoreWorkout(savedWorkout)
      persistence.markInitialized()
    }
    initState.value = { status: 'ready' }

    // Navigate to active workout - failures are typically user-initiated (e.g., back button)
    await tryCatch(router.push({ name: RouteNames.ActiveWorkout }))
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
