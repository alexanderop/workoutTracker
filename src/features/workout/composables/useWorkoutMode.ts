import { computed } from 'vue'
import { useWorkout } from './useWorkout'
import { hasWorkoutBlockProgress, isWorkoutBlockComplete } from '@/lib/workoutBlockStatus'
import { isStrengthBlock } from '@/types/blocks'

/**
 * Composable for managing workout mode transitions.
 * Handles switching between builder and active modes.
 */
export function useWorkoutMode() {
  const { workout, selectBlock, activateSet } = useWorkout()

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
    return workout.value.blocks.some(hasWorkoutBlockProgress)
  })

  function initializeTimestamps() {
    if (hasStarted.value) return

    workout.value.startedAt = Date.now()
  }

  function activateFirstSet(blockIndex: number) {
    activateSet(blockIndex, 0)
  }

  function initializeFirstBlock() {
    const firstBlock = workout.value.blocks[0]
    if (!firstBlock || !isStrengthBlock(firstBlock)) return

    activateFirstSet(0)
  }

  /**
   * Start the workout - transition from builder to active mode.
   * Selects the first block and activates its first set if strength.
   */
  function startWorkout() {
    if (!hasBlocks.value) return

    initializeTimestamps()

    workout.value.mode = 'active'
    workout.value.selectedBlockIndex = 0
    workout.value.activeSetIndex = null

    initializeFirstBlock()
  }

  /**
   * Return to builder mode from active mode.
   * Preserves workout progress but exits the immersive view.
   */
  function returnToBuilder() {
    workout.value.mode = 'builder'
    workout.value.activeSetIndex = null
  }

  /**
   * Enter completion mode - marks the workout as completed.
   * Used when the user finishes all blocks before persisting to database.
   */
  function enterCompletionMode() {
    workout.value.mode = 'completed'
  }

  /**
   * Advance to the next incomplete block in active mode.
   * Skips completed blocks to find the next one that needs work.
   * Returns true if advanced, false if no incomplete blocks remain.
   */
  function advanceToNextBlock(): boolean {
    // Find next incomplete block (skip completed ones)
    let nextIndex: number | null = null
    for (let index = workout.value.selectedBlockIndex + 1; index < workout.value.blocks.length; index++) {
      const block = workout.value.blocks[index]
      if (block && !isWorkoutBlockComplete(block)) {
        nextIndex = index
        break
      }
    }

    if (nextIndex === null) {
      return false // All remaining blocks complete
    }

    selectBlock(nextIndex)
    workout.value.activeSetIndex = null

    // Initialize next block if it's a strength block
    const nextBlock = workout.value.blocks[nextIndex]
    if (nextBlock && isStrengthBlock(nextBlock)) {
      activateFirstSet(nextIndex)
    }

    return true
  }

  /**
   * Go to the previous block in active mode.
   * Returns true if moved back, false if already at first block.
   */
  function goToPreviousBlock(): boolean {
    const previousIndex = workout.value.selectedBlockIndex - 1
    if (previousIndex < 0) {
      return false
    }

    selectBlock(previousIndex)
    workout.value.activeSetIndex = null

    // Initialize block if it's a strength block
    const previousBlock = workout.value.blocks[previousIndex]
    if (previousBlock && isStrengthBlock(previousBlock)) {
      // Find the last incomplete set or default to first
      const incompleteSetIndex = previousBlock.sets.findIndex(
        (s) => s.status === 'planned' || s.status === 'active',
      )
      workout.value.activeSetIndex = Math.max(incompleteSetIndex, 0)
    }

    return true
  }

  /**
   * Set the active set index for strength blocks.
   */
  function setActiveSet(setIndex: number) {
    const block = currentBlock.value
    if (!block || !isStrengthBlock(block)) return
    if (setIndex < 0 || setIndex >= block.sets.length) return

    workout.value.activeSetIndex = setIndex
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
