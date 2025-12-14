import { computed } from 'vue'
import { useBenchmark } from './useBenchmark'
import { getBlockExerciseList } from '@/types/blocks'

/**
 * Composable for benchmark exercise navigation.
 * Handles movement between exercises within and across blocks (rounds).
 */
export function useBenchmarkExerciseNavigation() {
  const { benchmarkWorkout, updateBenchmarkWorkout, currentBlockExercises } = useBenchmark()

  /**
   * Current exercise position within the current block (1-based for UI display).
   */
  const currentExercisePosition = computed(() => {
    return benchmarkWorkout.value.activeExerciseIndex + 1
  })

  /**
   * Total number of exercises in the current block.
   */
  const totalExerciseCount = computed(() => {
    return currentBlockExercises.value.length
  })

  /**
   * Global exercise index (0-based) across all blocks.
   * Sums actual exercise counts from preceding blocks.
   */
  const globalExerciseIndex = computed(() => {
    const blockIndex = benchmarkWorkout.value.selectedBlockIndex
    const exerciseIndex = benchmarkWorkout.value.activeExerciseIndex
    const blocks = benchmarkWorkout.value.blocks

    // Edge case: invalid block index
    if (blockIndex < 0 || blockIndex >= blocks.length) return 0

    // Sum exercises in all preceding blocks
    let sum = 0
    for (let i = 0; i < blockIndex; i++) {
      const block = blocks[i]
      if (block) {
        sum += getBlockExerciseList(block).length
      }
    }

    // Edge case: invalid exercise index - clamp to 0
    if (exerciseIndex < 0) return sum

    return sum + exerciseIndex
  })

  /**
   * Total exercise count across ALL blocks (rounds).
   * Used for global progress display.
   */
  const totalGlobalExerciseCount = computed(() => {
    const blocks = benchmarkWorkout.value.blocks
    let total = 0
    for (const block of blocks) {
      if (block) {
        total += getBlockExerciseList(block).length
      }
    }
    return total
  })

  /**
   * Check if currently on the first exercise in the block.
   */
  const isFirstExerciseInBlock = computed(() => {
    return benchmarkWorkout.value.activeExerciseIndex === 0
  })

  /**
   * Check if currently on the last exercise in the block.
   */
  const isLastExerciseInBlock = computed(() => {
    const exercises = currentBlockExercises.value
    return benchmarkWorkout.value.activeExerciseIndex === exercises.length - 1
  })

  /**
   * Advance to the next exercise.
   * Handles crossing block boundaries for rounds-type benchmarks.
   * Returns:
   * - 'next-exercise': Moved to next exercise in current block
   * - 'next-block': Moved to first exercise of next block
   * - 'completed': Reached the end of all blocks
   */
  function advanceToNextExercise(): 'next-exercise' | 'next-block' | 'completed' {
    const blockIndex = benchmarkWorkout.value.selectedBlockIndex
    const exerciseIndex = benchmarkWorkout.value.activeExerciseIndex
    const exercises = currentBlockExercises.value

    // Try: Move to next exercise in current block
    if (exerciseIndex < exercises.length - 1) {
      updateBenchmarkWorkout({ activeExerciseIndex: exerciseIndex + 1 })
      return 'next-exercise'
    }

    // Try: Advance to next block (next round)
    const nextBlockIndex = blockIndex + 1
    if (nextBlockIndex < benchmarkWorkout.value.blocks.length) {
      updateBenchmarkWorkout({
        selectedBlockIndex: nextBlockIndex,
        activeExerciseIndex: 0,
      })
      return 'next-block'
    }

    // Reached the end
    return 'completed'
  }

  /**
   * Go back to the previous exercise.
   * Handles crossing block boundaries for rounds-type benchmarks.
   * Returns:
   * - 'previous-exercise': Moved to previous exercise in current block
   * - 'previous-block': Moved to last exercise of previous block
   * - 'at-start': Already at first exercise of first block
   */
  function goToPreviousExercise(): 'previous-exercise' | 'previous-block' | 'at-start' {
    const blockIndex = benchmarkWorkout.value.selectedBlockIndex
    const exerciseIndex = benchmarkWorkout.value.activeExerciseIndex

    // Try: Move to previous exercise in current block
    if (exerciseIndex > 0) {
      updateBenchmarkWorkout({ activeExerciseIndex: exerciseIndex - 1 })
      return 'previous-exercise'
    }

    // Try: Go to previous block (previous round)
    const prevBlockIndex = blockIndex - 1
    if (prevBlockIndex >= 0) {
      const prevBlock = benchmarkWorkout.value.blocks[prevBlockIndex]
      if (prevBlock) {
        const exercises = getBlockExerciseList(prevBlock)
        updateBenchmarkWorkout({
          selectedBlockIndex: prevBlockIndex,
          activeExerciseIndex: exercises.length - 1,
        })
        return 'previous-block'
      }
    }

    // Already at start
    return 'at-start'
  }

  return {
    // Navigation functions
    advanceToNextExercise,
    goToPreviousExercise,

    // Position tracking
    currentExercisePosition,
    totalExerciseCount,
    globalExerciseIndex,
    totalGlobalExerciseCount,

    // Block boundary detection
    isFirstExerciseInBlock,
    isLastExerciseInBlock,
  }
}
