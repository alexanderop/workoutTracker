/**
 * Timer composable for For Time blocks.
 *
 * Counts up until completion or time cap is reached.
 */

import { computed, ref, shallowRef } from 'vue'
import type { ForTimeBlock, ForTimeResult } from '@/types/blocks'
import { formatTime } from '@/lib/workout-utils'
import { useBaseTimer } from './useBaseTimer'

type ForTimeTimerConfig = Readonly<{
  onComplete?: () => void
}>

export function useForTimeTimer(config: ForTimeTimerConfig = {}) {
  // ForTime-specific state
  const block = shallowRef<ForTimeBlock | null>(null)
  const completedExercises = ref<Array<string>>([])
  const finishedBeforeCap = ref(false)

  // Base timer with tick handler for time cap checking
  const baseTimer = useBaseTimer({
    onTick: () => {
      // Check for time cap
      if (block.value?.config.timeCapSeconds) {
        if (baseTimer.elapsedSeconds.value >= block.value.config.timeCapSeconds) {
          complete()
        }
      }
    },
    onComplete: config.onComplete,
  })

  // ForTime-specific computed
  const remainingSeconds = computed(() => {
    if (!block.value?.config.timeCapSeconds) return 0
    return Math.max(0, block.value.config.timeCapSeconds - baseTimer.elapsedSeconds.value)
  })

  const progress = computed(() => {
    if (!block.value?.config.timeCapSeconds) return 0
    return Math.min(100, (baseTimer.elapsedSeconds.value / block.value.config.timeCapSeconds) * 100)
  })

  const formattedElapsed = computed(() => formatTime(baseTimer.elapsedSeconds.value))
  const formattedRemaining = computed(() => formatTime(remainingSeconds.value))

  // Methods
  function initialize(forTimeBlock: ForTimeBlock) {
    block.value = forTimeBlock
    completedExercises.value = []
    finishedBeforeCap.value = false
    baseTimer.resetState()
  }

  function reset() {
    if (!block.value) return
    initialize(block.value)
  }

  function complete(): ForTimeResult {
    baseTimer.complete()
    return {
      completionTime: baseTimer.elapsedSeconds.value,
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
    // State from base timer
    elapsedMs: baseTimer.elapsedMs,
    elapsedSeconds: baseTimer.elapsedSeconds,
    isRunning: baseTimer.isRunning,
    isPaused: baseTimer.isPaused,
    isCompleted: baseTimer.isCompleted,
    isIdle: baseTimer.isIdle,

    // ForTime-specific state
    block,
    remainingSeconds,
    progress,
    formattedElapsed,
    formattedRemaining,
    completedExercises,
    finishedBeforeCap,

    // Methods
    initialize,
    start: baseTimer.start,
    pause: baseTimer.pause,
    toggle: baseTimer.toggle,
    reset,
    complete,
    markExerciseComplete,
    finishWorkout,
  }
}
