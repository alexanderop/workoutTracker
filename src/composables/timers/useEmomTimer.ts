/**
 * Timer composable for EMOM (Every Minute On the Minute) blocks.
 *
 * Tracks minute transitions and exercise rotation throughout the EMOM duration.
 */

import type { ComputedRef, ShallowRef } from 'vue'
import { computed, shallowReadonly, shallowRef } from 'vue'
import type { EmomBlock, EmomResult } from '@/types/blocks'
import type { BlockTimerReturn } from './useBaseTimer'
import { createFormattedTimeComputeds, useBaseTimer } from './useBaseTimer'

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

      options.onMinuteChange?.(newMinute)
    }
  }

  // EMOM-specific computed
  const remainingSeconds = computed(() => {
    if (!block.value) return 0
    return Math.max(0, block.value.config.minutes * 60 - baseTimer.elapsedSeconds.value)
  })

  const secondsRemainingInMinute = computed(() => {
    return 60 - (baseTimer.elapsedSeconds.value % 60)
  })

  const progress = computed(() => {
    if (!block.value) return 0
    const totalSeconds = block.value.config.minutes * 60
    return Math.min(100, (baseTimer.elapsedSeconds.value / totalSeconds) * 100)
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
    // State from base timer
    elapsedMs: baseTimer.elapsedMs,
    elapsedSeconds: baseTimer.elapsedSeconds,
    isRunning: baseTimer.isRunning,
    isPaused: baseTimer.isPaused,
    isCompleted: baseTimer.isCompleted,
    isIdle: baseTimer.isIdle,
    isActive: baseTimer.isActive,

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
    start: baseTimer.start,
    pause: baseTimer.pause,
    resume: baseTimer.resume,
    toggle: baseTimer.toggle,
    reset,
    complete,
    markMinuteMissed,
  }
}
