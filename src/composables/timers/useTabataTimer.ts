/**
 * Timer composable for Tabata blocks.
 *
 * Manages work/rest phase transitions and round counting for Tabata intervals.
 */

import { computed, ref, shallowRef } from 'vue'
import type { TabataBlock, TabataResult } from '@/types/blocks'
import { formatTime } from '@/lib/workout-utils'
import { useBaseTimer } from './useBaseTimer'

type TabataTimerConfig = Readonly<{
  onPhaseChange?: (phase: 'work' | 'rest') => void
  onRoundChange?: (round: number) => void
  onComplete?: () => void
}>

export function useTabataTimer(config: TabataTimerConfig = {}) {
  // Tabata-specific state
  const block = shallowRef<TabataBlock | null>(null)
  const currentRound = ref(1)
  const currentPhase = ref<'work' | 'rest'>('work')
  const repsPerRound = ref<Array<number>>([])

  // Base timer with tick handler for phase/round transitions
  const baseTimer = useBaseTimer({
    onTick: handleTick,
    onComplete: config.onComplete,
  })

  function handleTick() {
    if (!block.value) return

    const { workSeconds, restSeconds, rounds } = block.value.config
    const intervalLength = workSeconds + restSeconds
    const totalSeconds = rounds * intervalLength
    const seconds = baseTimer.elapsedSeconds.value

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

  // Tabata-specific computed
  const remainingSeconds = computed(() => {
    if (!block.value) return 0
    const { rounds, workSeconds, restSeconds } = block.value.config
    const totalSeconds = rounds * (workSeconds + restSeconds)
    return Math.max(0, totalSeconds - baseTimer.elapsedSeconds.value)
  })

  const secondsInCurrentPhase = computed(() => {
    if (!block.value) return 0
    const { workSeconds, restSeconds } = block.value.config
    const intervalLength = workSeconds + restSeconds
    const secondsInInterval = baseTimer.elapsedSeconds.value % intervalLength

    if (currentPhase.value === 'work') {
      return Math.max(0, workSeconds - secondsInInterval)
    }
    return Math.max(0, restSeconds - (secondsInInterval - workSeconds))
  })

  const progress = computed(() => {
    if (!block.value) return 0
    const { rounds, workSeconds, restSeconds } = block.value.config
    const totalSeconds = rounds * (workSeconds + restSeconds)
    return Math.min(100, (baseTimer.elapsedSeconds.value / totalSeconds) * 100)
  })

  const formattedElapsed = computed(() => formatTime(baseTimer.elapsedSeconds.value))
  const formattedRemaining = computed(() => formatTime(remainingSeconds.value))

  // Methods
  function initialize(tabataBlock: TabataBlock) {
    block.value = tabataBlock
    currentRound.value = 1
    currentPhase.value = 'work'
    repsPerRound.value = []
    baseTimer.resetState()
  }

  function reset() {
    if (!block.value) return
    initialize(block.value)
  }

  function complete(): TabataResult {
    baseTimer.complete()
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
    // State from base timer
    elapsedMs: baseTimer.elapsedMs,
    elapsedSeconds: baseTimer.elapsedSeconds,
    isRunning: baseTimer.isRunning,
    isPaused: baseTimer.isPaused,
    isCompleted: baseTimer.isCompleted,
    isIdle: baseTimer.isIdle,

    // Tabata-specific state
    block,
    remainingSeconds,
    progress,
    formattedElapsed,
    formattedRemaining,
    currentRound,
    currentPhase,
    secondsInCurrentPhase,
    repsPerRound,

    // Methods
    initialize,
    start: baseTimer.start,
    pause: baseTimer.pause,
    toggle: baseTimer.toggle,
    reset,
    complete,
    recordReps,
  }
}
