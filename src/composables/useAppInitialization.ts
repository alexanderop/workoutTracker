import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { activeWorkoutRepository } from '@/db/repositories/activeWorkout'
import { useExercisesStore } from '@/stores/exercises'
import { getWorkoutRef, restoreWorkout } from './useWorkout'
import { useWorkoutPersistence } from './useWorkoutPersistence'

/**
 * App initialization state using discriminated union.
 */
export type InitState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'prompt-resume'; workoutName: string; exerciseCount: number }
  | { status: 'error'; error: Error }

const initState = ref<InitState>({ status: 'loading' })
const isInitialized = computed(() => initState.value.status === 'ready')

/**
 * Composable for app-level initialization.
 * Handles loading data from IndexedDB and prompting to resume workouts.
 */
export function useAppInitialization() {
  const router = useRouter()
  const exercisesStore = useExercisesStore()
  const workoutRef = getWorkoutRef()
  const persistence = useWorkoutPersistence(workoutRef)

  /**
   * Initialize the app: load exercises and check for active workout.
   */
  async function initialize(): Promise<void> {
    // Only allow initialization from loading state (prevents re-entry)
    if (initState.value.status !== 'loading') return

    try {
      // Load custom exercises from DB
      await exercisesStore.loadFromDb()

      // Check for active workout
      const activeWorkout = await activeWorkoutRepository.get()

      if (activeWorkout && activeWorkout.exercises.length > 0) {
        // Prompt user to resume
        initState.value = {
          status: 'prompt-resume',
          workoutName: activeWorkout.name,
          exerciseCount: activeWorkout.exercises.length,
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

    // Navigate to active workout
    router.push('/workout/active')
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
