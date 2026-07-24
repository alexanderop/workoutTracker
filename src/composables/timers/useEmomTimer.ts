/**
 * Timer composable for EMOM (Every Minute On the Minute) blocks.
 *
 * Tracks minute transitions and exercise rotation throughout the EMOM duration.
 */

import type { ComputedRef, ShallowRef } from 'vue'
import { computed, shallowReadonly, shallowRef } from 'vue'
import type { EmomBlock, EmomResult } from '@/blocks'
import type { BlockTimerReturn } from './useBaseTimer'
import { blockTimerBase, createFormattedTimeComputeds, useBaseTimer } from './useBaseTimer'
import * as emomMath from '@/composables/timers/emomMath'

export type UseEmomTimerOptions = Readonly<{
  /** Called when a new minute begins (with the 1-based minute number). */
  onMinuteChange?: (minute: number) => void
  /** Called once when the timer completes (all minutes elapsed or completed manually). */
  onComplete?: () => void
}>

export type UseEmomTimerReturn = BlockTimerReturn<EmomBlock, EmomResult> & {
  currentMinute: Readonly<ShallowRef<number>>
  secondsRemainingInMinute: ComputedRef<number>
  currentExerciseIndex: Readonly<ShallowRef<number>>
  missedMinutes: Readonly<ShallowRef<Array<number>>>
  markMinuteMissed: (minute: number) => void
}

/**
 * Count-up timer for an EMOM block that fires minute transitions, rotates
 * exercises when configured, and completes when all minutes have elapsed.
 *
 * @param options
 */
export function useEmomTimer(options: UseEmomTimerOptions = {}): UseEmomTimerReturn {
  // EMOM-specific state
  const block = shallowRef<EmomBlock | null>(null)
  const currentMinute = shallowRef(1)
  const currentExerciseIndex = shallowRef(0)
  const missedMinutes = shallowRef<Array<number>>([])

  // Base timer with tick handler for minute transitions
  const baseTimer = useBaseTimer({
    onTick: handleTick,
    onComplete: options.onComplete,
  })

  function handleTick() {
    if (!block.value) return

    const seconds = baseTimer.elapsedSeconds.value

    // Check for completion
    if (emomMath.emomRemainingSeconds(block.value.config.minutes, seconds) === 0) {
      complete()
      return
    }

    // Check for minute transition
    const newMinute = emomMath.minuteForElapsed(seconds)
    if (newMinute > currentMinute.value && newMinute <= block.value.config.minutes) {
      currentMinute.value = newMinute

      // Rotate exercise if configured
      if (block.value.config.exerciseRotation === 'each-minute') {
        currentExerciseIndex.value = (currentExerciseIndex.value + 1) % block.value.exercises.length
      }

      options.onMinuteChange?.(newMinute)
    }
  }

  // EMOM-specific computed
  const remainingSeconds = computed(() => {
    if (!block.value) return 0
    return emomMath.emomRemainingSeconds(block.value.config.minutes, baseTimer.elapsedSeconds.value)
  })

  const secondsRemainingInMinute = computed(() => {
    return emomMath.secondsRemainingInMinute(baseTimer.elapsedSeconds.value)
  })

  const progress = computed(() => {
    if (!block.value) return 0
    return emomMath.emomProgress(block.value.config.minutes, baseTimer.elapsedSeconds.value)
  })

  const { formattedElapsed, formattedRemaining } = createFormattedTimeComputeds(
    baseTimer.elapsedSeconds,
    remainingSeconds,
  )

  // Methods
  function initialize(emomBlock: EmomBlock) {
    block.value = emomBlock
    currentMinute.value = 1
    currentExerciseIndex.value = 0
    missedMinutes.value = []
    baseTimer.resetState()
  }

  function reset() {
    if (!block.value) return
    initialize(block.value)
  }

  function complete(): EmomResult {
    baseTimer.complete()
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
    ...blockTimerBase(baseTimer),

    // EMOM-specific state
    block: shallowReadonly(block),
    remainingSeconds,
    progress,
    formattedElapsed,
    formattedRemaining,
    currentMinute: shallowReadonly(currentMinute),
    secondsRemainingInMinute,
    currentExerciseIndex: shallowReadonly(currentExerciseIndex),
    missedMinutes: shallowReadonly(missedMinutes),

    // Methods
    initialize,
    reset,
    complete,
    markMinuteMissed,
  }
}
