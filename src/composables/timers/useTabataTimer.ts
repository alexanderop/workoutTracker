/**
 * Timer composable for Tabata blocks.
 *
 * Manages work/rest phase transitions and round counting for Tabata intervals.
 */

import type { ComputedRef, ShallowRef } from 'vue'
import { computed, shallowReadonly, shallowRef } from 'vue'
import type { TabataBlock, TabataResult } from '@/types/blocks'
import type { BlockTimerReturn } from './useBaseTimer'
import { blockTimerBase, createFormattedTimeComputeds, useBaseTimer } from './useBaseTimer'

type TabataPhase = 'work' | 'rest'

export type UseTabataTimerOptions = Readonly<{
  /** Called when the phase flips between work and rest. */
  onPhaseChange?: (phase: TabataPhase) => void
  /** Called when a new round begins (with the 1-based round number). */
  onRoundChange?: (round: number) => void
  /** Called once when the timer completes (all rounds elapsed or completed manually). */
  onComplete?: () => void
}>

export type UseTabataTimerReturn = BlockTimerReturn<TabataBlock, TabataResult> & {
  currentRound: Readonly<ShallowRef<number>>
  currentPhase: Readonly<ShallowRef<TabataPhase>>
  secondsInCurrentPhase: ComputedRef<number>
  repsPerRound: Readonly<ShallowRef<Array<number>>>
  recordReps: (reps: number) => void
}

/**
 * Interval timer for a Tabata block that alternates work/rest phases, counts
 * rounds, records reps per round, and completes when all rounds have elapsed.
 *
 * @param options
 */
export function useTabataTimer(options: UseTabataTimerOptions = {}): UseTabataTimerReturn {
  // Tabata-specific state
  const block = shallowRef<TabataBlock | null>(null)
  const currentRound = shallowRef(1)
  const currentPhase = shallowRef<TabataPhase>('work')
  const repsPerRound = shallowRef<Array<number>>([])

  // Base timer with tick handler for phase/round transitions
  const baseTimer = useBaseTimer({
    onTick: handleTick,
    onComplete: options.onComplete,
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
    const newPhase: TabataPhase = secondsInInterval < workSeconds ? 'work' : 'rest'

    // Update round
    if (currentInterval !== currentRound.value && currentInterval <= rounds) {
      currentRound.value = currentInterval
      options.onRoundChange?.(currentInterval)
    }

    // Update phase
    if (newPhase !== currentPhase.value) {
      currentPhase.value = newPhase
      options.onPhaseChange?.(newPhase)
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

  const { formattedElapsed, formattedRemaining } = createFormattedTimeComputeds(
    baseTimer.elapsedSeconds,
    remainingSeconds,
  )

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
    ...blockTimerBase(baseTimer),

    // Tabata-specific state
    block: shallowReadonly(block),
    remainingSeconds,
    progress,
    formattedElapsed,
    formattedRemaining,
    currentRound: shallowReadonly(currentRound),
    currentPhase: shallowReadonly(currentPhase),
    secondsInCurrentPhase,
    repsPerRound: shallowReadonly(repsPerRound),

    // Methods
    initialize,
    reset,
    complete,
    recordReps,
  }
}
