/**
 * Timer composable for AMRAP (As Many Rounds As Possible) blocks.
 *
 * Counts down from a set duration while tracking completed rounds.
 */

import { useIntervalFn } from '@vueuse/core'
import { computed, ref, shallowRef } from 'vue'
import type { AmrapBlock, AmrapResult, TimerStatus } from '@/types/blocks'
import { formatTime } from '@/lib/workout-utils'

type AmrapTimerConfig = Readonly<{
  onComplete?: () => void
}>

export function useAmrapTimer(config: AmrapTimerConfig = {}) {
  // State
  const block = shallowRef<AmrapBlock | null>(null)
  const status = ref<TimerStatus>('idle')
  const elapsedMs = ref(0)
  const startedAt = ref<number | null>(null)
  const pausedDuration = ref(0)
  const rounds = ref(0)
  const currentExerciseIndex = ref(0)

  // Interval timer
  const { pause: stopInterval, resume: startInterval } = useIntervalFn(
    () => {
      if (status.value !== 'running' || !startedAt.value) return

      const now = Date.now()
      elapsedMs.value = now - startedAt.value - pausedDuration.value

      // Check for completion
      if (block.value && elapsedSeconds.value >= block.value.config.durationSeconds) {
        complete()
      }
    },
    100,
    { immediate: false },
  )

  // Computed
  const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))

  const remainingSeconds = computed(() => {
    if (!block.value) return 0
    return Math.max(0, block.value.config.durationSeconds - elapsedSeconds.value)
  })

  const progress = computed(() => {
    if (!block.value) return 0
    return Math.min(100, (elapsedSeconds.value / block.value.config.durationSeconds) * 100)
  })

  const formattedElapsed = computed(() => formatTime(elapsedSeconds.value))
  const formattedRemaining = computed(() => formatTime(remainingSeconds.value))

  const isRunning = computed(() => status.value === 'running')
  const isPaused = computed(() => status.value === 'paused')
  const isCompleted = computed(() => status.value === 'completed')
  const isIdle = computed(() => status.value === 'idle')

  // Methods
  function initialize(amrapBlock: AmrapBlock) {
    block.value = amrapBlock
    status.value = 'idle'
    elapsedMs.value = 0
    startedAt.value = null
    pausedDuration.value = 0
    rounds.value = 0
    currentExerciseIndex.value = 0
    stopInterval()
  }

  function start() {
    if (status.value === 'completed') return

    if (status.value === 'paused' && startedAt.value) {
      // Resume from pause
      const now = Date.now()
      const pauseStart = startedAt.value + elapsedMs.value + pausedDuration.value
      pausedDuration.value += now - pauseStart
      status.value = 'running'
      startInterval()
      return
    }

    // Fresh start
    startedAt.value = Date.now()
    status.value = 'running'
    startInterval()
  }

  function pause() {
    if (status.value !== 'running') return
    status.value = 'paused'
    stopInterval()
  }

  function toggle() {
    if (status.value === 'running') {
      pause()
      return
    }

    if (status.value === 'idle' || status.value === 'paused') {
      start()
    }
  }

  function reset() {
    if (!block.value) return
    initialize(block.value)
  }

  function complete(): AmrapResult {
    // Guard against double-completion to prevent infinite loops
    const wasAlreadyCompleted = status.value === 'completed'

    status.value = 'completed'
    stopInterval()

    // Only call onComplete when transitioning to completed state
    if (!wasAlreadyCompleted) {
      config.onComplete?.()
    }

    return {
      rounds: rounds.value,
      partialReps: currentExerciseIndex.value,
      actualDuration: elapsedSeconds.value,
    }
  }

  function incrementRound() {
    rounds.value++
    currentExerciseIndex.value = 0
  }

  return {
    // State
    block,
    elapsedMs,
    elapsedSeconds,
    remainingSeconds,
    progress,
    formattedElapsed,
    formattedRemaining,
    isRunning,
    isPaused,
    isCompleted,
    isIdle,

    // AMRAP-specific
    rounds,
    currentExerciseIndex,

    // Methods
    initialize,
    start,
    pause,
    toggle,
    reset,
    complete,
    incrementRound,
  }
}
