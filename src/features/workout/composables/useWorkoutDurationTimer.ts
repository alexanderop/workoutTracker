import { computed, shallowRef, watch } from 'vue'
import { createSharedComposable, useIntervalFn } from '@vueuse/core'
import { formatDuration } from '@/lib/workout-utils'
import { useWorkout } from './useWorkout'
import { useWorkoutMode } from './useWorkoutMode'

/**
 * Composable for tracking total workout duration.
 * Provides a live timer that updates every second during active mode.
 */
const useSharedWorkoutDurationTimer = createSharedComposable(() => {
  const { workout } = useWorkout()
  const { isActiveMode } = useWorkoutMode()

  // Tick counter to force reactivity updates
  const tick = shallowRef(0)

  const { pause, resume } = useIntervalFn(
    () => {
      tick.value++
    },
    1000,
    { immediate: false },
  )

  // The app-level FAB owns this composable for the app lifetime. Keep its
  // shared interval cold until a workout is actually running.
  watch(isActiveMode, (active) => (active ? resume() : pause()), { immediate: true })

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
})

export function useWorkoutDurationTimer() {
  return useSharedWorkoutDurationTimer()
}
