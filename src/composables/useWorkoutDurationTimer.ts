import { useIntervalFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { formatDuration } from '@/lib/workout-utils'
import { useWorkout } from './useWorkout'
import { useWorkoutMode } from './useWorkoutMode'

/**
 * Composable for tracking total workout duration.
 * Provides a live timer that updates every second during active mode.
 */
export function useWorkoutDurationTimer() {
  const { workout } = useWorkout()
  const { isActiveMode } = useWorkoutMode()

  // Tick counter to force reactivity updates
  const tick = ref(0)

  // Update every second to trigger reactivity
  useIntervalFn(() => {
    tick.value++
  }, 1000)

  const elapsedSeconds = computed(() => {
    // Include tick to ensure reactivity
    void tick.value
    if (!isActiveMode.value) return 0
    return Math.floor((Date.now() - workout.value.startedAt) / 1000)
  })

  const formattedDuration = computed(() => formatDuration(elapsedSeconds.value))

  return {
    elapsedSeconds,
    formattedDuration,
  }
}
