/**
 * Global timer for benchmark workouts.
 * Tracks total elapsed time across all blocks.
 * Continues counting even when app closes by using timestamp-based calculation.
 */
import { useIntervalFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { formatTime } from '@/lib/workout-utils'

export function useBenchmarkGlobalTimer() {
  const startedAt = ref<number | null>(null)
  const isRunning = ref(false)
  const currentTime = ref(Date.now())

  // Update current time every second to trigger reactivity
  const { pause: stopInterval, resume: startInterval } = useIntervalFn(
    () => {
      if (isRunning.value) {
        currentTime.value = Date.now()
      }
    },
    1000,
    { immediate: false },
  )

  const elapsedSeconds = computed(() => {
    if (!startedAt.value) return 0
    return Math.floor((currentTime.value - startedAt.value) / 1000)
  })

  const formattedElapsed = computed(() => formatTime(elapsedSeconds.value))

  /**
   * Initialize timer from saved workout state.
   * Calculates elapsed time from stored timestamp and resumes timer.
   */
  function initializeFromWorkout(globalTimerStartedAt: number | null) {
    if (!globalTimerStartedAt) return

    startedAt.value = globalTimerStartedAt
    isRunning.value = true
    currentTime.value = Date.now()
    startInterval()
  }

  /**
   * Start the timer from 00:00.
   */
  function start() {
    if (!startedAt.value) {
      startedAt.value = Date.now()
    }
    isRunning.value = true
    currentTime.value = Date.now()
    startInterval()
  }

  /**
   * Pause the timer (stops interval but preserves elapsed time).
   */
  function pause() {
    isRunning.value = false
    stopInterval()
  }

  /**
   * Toggle between running and paused.
   */
  function toggle() {
    if (isRunning.value) {
      pause()
      return
    }
    start()
  }

  /**
   * Reset the timer to 00:00.
   */
  function reset() {
    isRunning.value = false
    startedAt.value = null
    currentTime.value = Date.now()
    stopInterval()
  }

  /**
   * Get the timestamp when timer started.
   * Used for persistence to database.
   */
  function getStartedAt(): number | null {
    return startedAt.value
  }

  return {
    isRunning,
    elapsedSeconds,
    formattedElapsed,
    start,
    pause,
    toggle,
    reset,
    initializeFromWorkout,
    getStartedAt,
  }
}
