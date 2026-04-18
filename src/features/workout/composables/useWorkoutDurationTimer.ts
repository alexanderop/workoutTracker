import { useIntervalFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { formatDuration } from '@/lib/workout-utils'
import { useWorkoutSession } from '../session'

/**
 * Composable for tracking total workout duration.
 * Provides a live timer that updates every second during active mode.
 */
export function useWorkoutDurationTimer() {
  const { workout, isActiveMode } = useWorkoutSession()

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
