/**
 * Timer composable for Tabata blocks.
 *
 * Manages work/rest phase transitions and round counting for Tabata intervals.
 */

import { useIntervalFn } from '@vueuse/core'
import { computed, ref, shallowRef } from 'vue'
import type { TabataBlock, TabataResult, TimerStatus } from '@/types/blocks'
import { formatTime } from '@/lib/workout-utils'

type TabataTimerConfig = Readonly<{
  onPhaseChange?: (phase: 'work' | 'rest') => void
  onRoundChange?: (round: number) => void
  onComplete?: () => void
}>

export function useTabataTimer(config: TabataTimerConfig = {}) {
  // State
  const block = shallowRef<TabataBlock | null>(null)
  const status = ref<TimerStatus>('idle')
  const elapsedMs = ref(0)
  const startedAt = ref<number | null>(null)
  const pausedDuration = ref(0)
  const currentRound = ref(1)
  const currentPhase = ref<'work' | 'rest'>('work')
  const repsPerRound = ref<Array<number>>([])

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

    const { workSeconds, restSeconds, rounds } = block.value.config
    const intervalLength = workSeconds + restSeconds
    const totalSeconds = rounds * intervalLength
    const seconds = elapsedSeconds.value

    // Check for completion
    if (seconds >= totalSeconds) {
      complete()
      return
    }

    // Calculate current round and phase
    const currentInterval = Math.floor(seconds / intervalLength) + 1
    const secondsInInterval = seconds % intervalLength
    const newPhase: 'work' | 'rest' = secondsInInterval < workSeconds ? 'work' : 'rest'

    // Update round
    if (currentInterval !== currentRound.value && currentInterval <= rounds) {
      currentRound.value = currentInterval
      config.onRoundChange?.(currentInterval)
    }

    // Update phase
    if (newPhase !== currentPhase.value) {
      currentPhase.value = newPhase
      config.onPhaseChange?.(newPhase)
    }
  }

  // Computed
  const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))

  const remainingSeconds = computed(() => {
    if (!block.value) return 0
    const { rounds, workSeconds, restSeconds } = block.value.config
    const totalSeconds = rounds * (workSeconds + restSeconds)
    return Math.max(0, totalSeconds - elapsedSeconds.value)
  })

  const secondsInCurrentPhase = computed(() => {
    if (!block.value) return 0
    const { workSeconds, restSeconds } = block.value.config
    const intervalLength = workSeconds + restSeconds
    const secondsInInterval = elapsedSeconds.value % intervalLength

    if (currentPhase.value === 'work') {
      return Math.max(0, workSeconds - secondsInInterval)
    }
    return Math.max(0, restSeconds - (secondsInInterval - workSeconds))
  })

  const progress = computed(() => {
    if (!block.value) return 0
    const { rounds, workSeconds, restSeconds } = block.value.config
    const totalSeconds = rounds * (workSeconds + restSeconds)
    return Math.min(100, (elapsedSeconds.value / totalSeconds) * 100)
  })

  const formattedElapsed = computed(() => formatTime(elapsedSeconds.value))
  const formattedRemaining = computed(() => formatTime(remainingSeconds.value))

  const isRunning = computed(() => status.value === 'running')
  const isPaused = computed(() => status.value === 'paused')
  const isCompleted = computed(() => status.value === 'completed')
  const isIdle = computed(() => status.value === 'idle')

  // Methods
  function initialize(tabataBlock: TabataBlock) {
    block.value = tabataBlock
    status.value = 'idle'
    elapsedMs.value = 0
    startedAt.value = null
    pausedDuration.value = 0
    currentRound.value = 1
    currentPhase.value = 'work'
    repsPerRound.value = []
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

  function complete(): TabataResult {
    // Guard against double-completion to prevent infinite loops
    const wasAlreadyCompleted = status.value === 'completed'

    status.value = 'completed'
    stopInterval()

    // Only call onComplete when transitioning to completed state
    if (!wasAlreadyCompleted) {
      config.onComplete?.()
    }

    return {
      repsPerRound: repsPerRound.value,
    }
  }

  function recordReps(reps: number) {
    const roundIndex = currentRound.value - 1
    const updated = [...repsPerRound.value]
    updated[roundIndex] = reps
    repsPerRound.value = updated
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

    // Tabata-specific
    currentRound,
    currentPhase,
    secondsInCurrentPhase,
    repsPerRound,

    // Methods
    initialize,
    start,
    pause,
    toggle,
    reset,
    complete,
    recordReps,
  }
}
