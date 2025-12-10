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
   * Example: Round 2, Exercise 3 of 4 exercises per round = index 7 (4 + 3)
   */
  const globalExerciseIndex = computed(() => {
    const blockIndex = benchmarkWorkout.value.selectedBlockIndex
    const exerciseIndex = benchmarkWorkout.value.activeExerciseIndex
    const firstBlock = benchmarkWorkout.value.blocks[0]

    if (!firstBlock) return 0

    const exercisesPerRound = getBlockExerciseList(firstBlock).length
    return blockIndex * exercisesPerRound + exerciseIndex
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

    // Block boundary detection
    isFirstExerciseInBlock,
    isLastExerciseInBlock,
  }
}
