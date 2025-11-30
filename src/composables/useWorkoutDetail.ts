import { onMounted, ref } from 'vue'
import { workoutsRepository } from '@/db/repositories/workouts'
import type { DbCompletedWorkout } from '@/db/schema'

type WorkoutDetailState =
  | { status: 'loading' }
  | { status: 'success'; workout: DbCompletedWorkout }
  | { status: 'not-found' }
  | { status: 'error'; error: Error }

export function useWorkoutDetail(workoutId: string) {
  // Primary State
  const state = ref<WorkoutDetailState>({ status: 'loading' })

  // Methods
  async function loadWorkout() {
    state.value = { status: 'loading' }
    try {
      const workout = await workoutsRepository.getById(workoutId)
      if (!workout) {
        state.value = { status: 'not-found' }
        return
      }
      state.value = { status: 'success', workout }
    } catch (error) {
      state.value = {
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadWorkout()
  })

  return { state, loadWorkout }
}
