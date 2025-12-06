/**
 * Timer composable for AMRAP (As Many Rounds As Possible) blocks.
 *
 * Counts down from a set duration while tracking completed rounds.
 */

import { computed, ref, shallowRef } from 'vue'
import type { AmrapBlock, AmrapResult } from '@/types/blocks'
import { formatTime } from '@/lib/workout-utils'
import { useBaseTimer } from './useBaseTimer'

type AmrapTimerConfig = Readonly<{
  onComplete?: () => void
}>

export function useAmrapTimer(config: AmrapTimerConfig = {}) {
  // AMRAP-specific state
  const block = shallowRef<AmrapBlock | null>(null)
  const rounds = ref(0)
  const currentExerciseIndex = ref(0)

  // Base timer with tick handler for completion check
  const baseTimer = useBaseTimer({
    onTick: () => {
      if (block.value && baseTimer.elapsedSeconds.value >= block.value.config.durationSeconds) {
        complete()
      }
    },
    onComplete: config.onComplete,
  })

  // AMRAP-specific computed
  const remainingSeconds = computed(() => {
    if (!block.value) return 0
    return Math.max(0, block.value.config.durationSeconds - baseTimer.elapsedSeconds.value)
  })

  const progress = computed(() => {
    if (!block.value) return 0
    return Math.min(100, (baseTimer.elapsedSeconds.value / block.value.config.durationSeconds) * 100)
  })

  const formattedElapsed = computed(() => formatTime(baseTimer.elapsedSeconds.value))
  const formattedRemaining = computed(() => formatTime(remainingSeconds.value))

  // Methods
  function initialize(amrapBlock: AmrapBlock) {
    block.value = amrapBlock
    rounds.value = 0
    currentExerciseIndex.value = 0
    baseTimer.resetState()
  }

  function reset() {
    if (!block.value) return
    initialize(block.value)
  }

  function complete(): AmrapResult {
    baseTimer.complete()
    return {
      rounds: rounds.value,
      partialReps: currentExerciseIndex.value,
      actualDuration: baseTimer.elapsedSeconds.value,
    }
  }

  function incrementRound() {
    rounds.value++
    currentExerciseIndex.value = 0
  }

  return {
    // State from base timer
    elapsedMs: baseTimer.elapsedMs,
    elapsedSeconds: baseTimer.elapsedSeconds,
    isRunning: baseTimer.isRunning,
    isPaused: baseTimer.isPaused,
    isCompleted: baseTimer.isCompleted,
    isIdle: baseTimer.isIdle,

    // AMRAP-specific state
    block,
    remainingSeconds,
    progress,
    formattedElapsed,
    formattedRemaining,
    rounds,
    currentExerciseIndex,

    // Methods
    initialize,
    start: baseTimer.start,
    pause: baseTimer.pause,
    toggle: baseTimer.toggle,
    reset,
    complete,
    incrementRound,
  }
}
