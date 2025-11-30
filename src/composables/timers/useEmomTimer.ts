/**
 * Timer composable for EMOM (Every Minute On the Minute) blocks.
 *
 * Tracks minute transitions and exercise rotation throughout the EMOM duration.
 */

import { useIntervalFn } from '@vueuse/core'
import { computed, ref, shallowRef } from 'vue'
import type { EmomBlock, EmomResult, TimerStatus } from '@/types/blocks'
import { formatTime } from '@/lib/workout-utils'

type EmomTimerConfig = Readonly<{
  onMinuteChange?: (minute: number) => void
  onComplete?: () => void
}>

export function useEmomTimer(config: EmomTimerConfig = {}) {
  // State
  const block = shallowRef<EmomBlock | null>(null)
  const status = ref<TimerStatus>('idle')
  const elapsedMs = ref(0)
  const startedAt = ref<number | null>(null)
  const pausedDuration = ref(0)
  const currentMinute = ref(1)
  const currentExerciseIndex = ref(0)
  const missedMinutes = ref<Array<number>>([])

  // Interval timer
  const { pause: stopInterval, resume: startInterval } = useIntervalFn(
    () => {
      if (status.value !== 'running' || !startedAt.value) return

      const now = Date.now()
      elapsedMs.value = now - startedAt.value - pausedDuration.value

      handleTick()
    },
    100,
    { immediate: false },
  )

  function handleTick() {
    if (!block.value) return

    const seconds = elapsedSeconds.value
    const totalSeconds = block.value.config.minutes * 60

    // Check for completion
    if (seconds >= totalSeconds) {
      complete()
      return
    }

    // Check for minute transition
    const newMinute = Math.floor(seconds / 60) + 1
    if (newMinute > currentMinute.value && newMinute <= block.value.config.minutes) {
      currentMinute.value = newMinute

      // Rotate exercise if configured
      if (block.value.config.exerciseRotation === 'each-minute') {
        currentExerciseIndex.value = (currentExerciseIndex.value + 1) % block.value.exercises.length
      }

      config.onMinuteChange?.(newMinute)
    }
  }

  // Computed
  const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))

  const remainingSeconds = computed(() => {
    if (!block.value) return 0
    return Math.max(0, block.value.config.minutes * 60 - elapsedSeconds.value)
  })

  const secondsRemainingInMinute = computed(() => {
    return 60 - (elapsedSeconds.value % 60)
  })

  const progress = computed(() => {
    if (!block.value) return 0
    const totalSeconds = block.value.config.minutes * 60
    return Math.min(100, (elapsedSeconds.value / totalSeconds) * 100)
  })

  const formattedElapsed = computed(() => formatTime(elapsedSeconds.value))
  const formattedRemaining = computed(() => formatTime(remainingSeconds.value))

  const isRunning = computed(() => status.value === 'running')
  const isPaused = computed(() => status.value === 'paused')
  const isCompleted = computed(() => status.value === 'completed')
  const isIdle = computed(() => status.value === 'idle')

  // Methods
  function initialize(emomBlock: EmomBlock) {
    block.value = emomBlock
    status.value = 'idle'
    elapsedMs.value = 0
    startedAt.value = null
    pausedDuration.value = 0
    currentMinute.value = 1
    currentExerciseIndex.value = 0
    missedMinutes.value = []
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

  function complete(): EmomResult {
    status.value = 'completed'
    stopInterval()
    config.onComplete?.()

    return {
      completedMinutes: currentMinute.value - 1,
      missedMinutes: missedMinutes.value,
    }
  }

  function markMinuteMissed(minute: number) {
    if (missedMinutes.value.includes(minute)) return
    missedMinutes.value = [...missedMinutes.value, minute]
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

    // EMOM-specific
    currentMinute,
    secondsRemainingInMinute,
    currentExerciseIndex,
    missedMinutes,

    // Methods
    initialize,
    start,
    pause,
    toggle,
    reset,
    complete,
    markMinuteMissed,
  }
}
