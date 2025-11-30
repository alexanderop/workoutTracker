/**
 * Timer composable for For Time blocks.
 *
 * Counts up until completion or time cap is reached.
 */

import { useIntervalFn } from '@vueuse/core'
import { computed, ref, shallowRef } from 'vue'
import type { ForTimeBlock, ForTimeResult, TimerStatus } from '@/types/blocks'
import { formatTime } from '@/lib/workout-utils'

type ForTimeTimerConfig = Readonly<{
  onComplete?: () => void
}>

export function useForTimeTimer(config: ForTimeTimerConfig = {}) {
  // State
  const block = shallowRef<ForTimeBlock | null>(null)
  const status = ref<TimerStatus>('idle')
  const elapsedMs = ref(0)
  const startedAt = ref<number | null>(null)
  const pausedDuration = ref(0)
  const completedExercises = ref<Array<string>>([])
  const finishedBeforeCap = ref(false)

  // Interval timer
  const { pause: stopInterval, resume: startInterval } = useIntervalFn(
    () => {
      if (status.value !== 'running' || !startedAt.value) return

      const now = Date.now()
      elapsedMs.value = now - startedAt.value - pausedDuration.value

      // Check for time cap
      if (block.value?.config.timeCapSeconds) {
        if (elapsedSeconds.value >= block.value.config.timeCapSeconds) {
          complete()
        }
      }
    },
    100,
    { immediate: false },
  )

  // Computed
  const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))

  const remainingSeconds = computed(() => {
    if (!block.value?.config.timeCapSeconds) return 0
    return Math.max(0, block.value.config.timeCapSeconds - elapsedSeconds.value)
  })

  const progress = computed(() => {
    if (!block.value?.config.timeCapSeconds) return 0
    return Math.min(100, (elapsedSeconds.value / block.value.config.timeCapSeconds) * 100)
  })

  const formattedElapsed = computed(() => formatTime(elapsedSeconds.value))
  const formattedRemaining = computed(() => formatTime(remainingSeconds.value))

  const isRunning = computed(() => status.value === 'running')
  const isPaused = computed(() => status.value === 'paused')
  const isCompleted = computed(() => status.value === 'completed')
  const isIdle = computed(() => status.value === 'idle')

  // Methods
  function initialize(forTimeBlock: ForTimeBlock) {
    block.value = forTimeBlock
    status.value = 'idle'
    elapsedMs.value = 0
    startedAt.value = null
    pausedDuration.value = 0
    completedExercises.value = []
    finishedBeforeCap.value = false
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

  function complete(): ForTimeResult {
    // Guard against double-completion to prevent infinite loops
    const wasAlreadyCompleted = status.value === 'completed'

    status.value = 'completed'
    stopInterval()

    // Only call onComplete when transitioning to completed state
    if (!wasAlreadyCompleted) {
      config.onComplete?.()
    }

    return {
      completionTime: elapsedSeconds.value,
      completed: finishedBeforeCap.value,
    }
  }

  function markExerciseComplete(exerciseId: string) {
    if (completedExercises.value.includes(exerciseId)) return
    completedExercises.value = [...completedExercises.value, exerciseId]
  }

  function finishWorkout() {
    finishedBeforeCap.value = true
    complete()
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

    // ForTime-specific
    completedExercises,
    finishedBeforeCap,

    // Methods
    initialize,
    start,
    pause,
    toggle,
    reset,
    complete,
    markExerciseComplete,
    finishWorkout,
  }
}
