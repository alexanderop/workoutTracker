/**
 * Global timer for benchmark workouts.
 * Tracks total elapsed time across all blocks.
 * Continues counting even when app closes by using timestamp-based calculation.
 *
 * This is a SINGLETON composable - all components share the same timer instance.
 */
import { useTimestamp } from '@vueuse/core'
import { computed, ref } from 'vue'
import { formatTime } from '@/lib/workout-utils'

// Singleton state - shared across all components
const startedAt = ref<number | null>(null)
const isRunning = ref(false)

// Use useTimestamp for reactive updates (updates every second for display)
const { timestamp, pause: stopInterval, resume: startInterval } = useTimestamp({
  controls: true,
  interval: 1000,
  immediate: false,
})

export function useBenchmarkGlobalTimer() {

  // Display value (updates every second)
  const elapsedSeconds = computed(() => {
    if (!startedAt.value) return 0
    return Math.floor((timestamp.value - startedAt.value) / 1000)
  })

  const formattedElapsed = computed(() => formatTime(elapsedSeconds.value))

  /**
   * Get precise elapsed seconds at the exact moment this is called.
   * Use this when recording split times to avoid stale interval values.
   */
  function getPreciseElapsedSeconds(): number {
    if (!startedAt.value) return 0
    return Math.floor((Date.now() - startedAt.value) / 1000)
  }

  /**
   * Initialize timer from saved workout state.
   * Calculates elapsed time from stored timestamp and resumes timer.
   */
  function initializeFromWorkout(globalTimerStartedAt: number | null) {
    if (!globalTimerStartedAt) return

    // Validate timestamp is reasonable (not in future, not before 2020)
    const now = Date.now()
    const MIN_TIMESTAMP = 1_577_836_800_000 // 2020-01-01

    if (globalTimerStartedAt > now) {
      console.warn('[Timer] Timestamp is in future, using current time')
      startedAt.value = now
      isRunning.value = true
      startInterval()
      return
    }

    if (globalTimerStartedAt < MIN_TIMESTAMP) {
      console.warn('[Timer] Invalid timestamp, resetting timer')
      return
    }

    startedAt.value = globalTimerStartedAt
    isRunning.value = true
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
    getPreciseElapsedSeconds,
    start,
    pause,
    toggle,
    reset,
    initializeFromWorkout,
    getStartedAt,
  }
}
