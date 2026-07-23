import { computed } from 'vue'
import { useWorkout } from './useWorkout'
import {
  advanceToNextIncompleteBlock,
  enterWorkoutCompletion,
  goToPreviousWorkoutBlock,
  hasWorkoutStarted,
  returnToWorkoutBuilder,
  selectActiveWorkoutSet,
  startWorkout as startWorkoutTransition,
} from '../lib/workoutModeTransitions'
import { isWorkoutBlockComplete } from '@/lib/workoutBlockStatus'
import { isStrengthBlock } from '@/types/blocks'

/**
 * Composable for managing workout mode transitions.
 * Handles switching between builder and active modes.
 */
export function useWorkoutMode() {
  const { workout } = useWorkout()

  const mode = computed(() => workout.value.mode)
  const isBuilderMode = computed(() => mode.value === 'builder')
  const isActiveMode = computed(() => mode.value === 'active')
  const isCompletedMode = computed(() => mode.value === 'completed')

  const currentBlockIndex = computed(() => workout.value.selectedBlockIndex)
  const totalBlocks = computed(() => workout.value.blocks.length)
  const hasBlocks = computed(() => totalBlocks.value > 0)

  const currentBlock = computed(() => {
    const index = workout.value.selectedBlockIndex
    if (index < 0 || index >= workout.value.blocks.length) return null
    return workout.value.blocks[index]
  })

  /**
   * True if no incomplete blocks remain after current position.
   * Used to disable "Next" button and determine workout completion.
   */
  const isLastBlock = computed(() => {
    for (let index = currentBlockIndex.value + 1; index < workout.value.blocks.length; index++) {
      const block = workout.value.blocks[index]
      if (block && !isWorkoutBlockComplete(block)) return false
    }
    return true
  })

  /**
   * Check if workout has any progress (sets completed or timed blocks done).
   * Used to determine whether to show "Continue Workout" vs "Start Workout".
   */
  const hasStarted = computed(() => {
    return hasWorkoutStarted(workout.value)
  })

  /**
   * Start the workout - transition from builder to active mode.
   * Selects the first block and activates its first set if strength.
   */
  function startWorkout() {
    workout.value = startWorkoutTransition(workout.value, Date.now())
  }

  /**
   * Return to builder mode from active mode.
   * Preserves workout progress but exits the immersive view.
   */
  function returnToBuilder() {
    workout.value = returnToWorkoutBuilder(workout.value)
  }

  /**
   * Enter completion mode - marks the workout as completed.
   * Used when the user finishes all blocks before persisting to database.
   */
  function enterCompletionMode() {
    workout.value = enterWorkoutCompletion(workout.value)
  }

  /**
   * Advance to the next incomplete block in active mode.
   * Skips completed blocks to find the next one that needs work.
   * Returns true if advanced, false if no incomplete blocks remain.
   */
  function advanceToNextBlock(): boolean {
    const transition = advanceToNextIncompleteBlock(workout.value)
    workout.value = transition.workout
    return transition.moved
  }

  /**
   * Go to the previous block in active mode.
   * Returns true if moved back, false if already at first block.
   */
  function goToPreviousBlock(): boolean {
    const transition = goToPreviousWorkoutBlock(workout.value)
    workout.value = transition.workout
    return transition.moved
  }

  /**
   * Set the active set index for strength blocks.
   */
  function setActiveSet(setIndex: number) {
    workout.value = selectActiveWorkoutSet(workout.value, setIndex)
  }

  /**
   * Get the active set for the current strength block.
   */
  const activeSet = computed(() => {
    const block = currentBlock.value
    if (!block || !isStrengthBlock(block)) return null
    if (workout.value.activeSetIndex === null) return null
    return block.sets[workout.value.activeSetIndex] ?? null
  })

  return {
    // Mode state
    mode,
    isBuilderMode,
    isActiveMode,
    isCompletedMode,
    hasStarted,

    // Block navigation
    currentBlockIndex,
    totalBlocks,
    hasBlocks,
    currentBlock,
    isLastBlock,

    // Set navigation (for strength blocks)
    activeSet,
    setActiveSet,

    // Mode transitions
    startWorkout,
    returnToBuilder,
    enterCompletionMode,
    advanceToNextBlock,
    goToPreviousBlock,
  }
}
