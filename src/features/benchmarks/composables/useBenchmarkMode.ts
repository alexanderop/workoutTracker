import { computed } from 'vue'
import { useBenchmark } from './useBenchmark'

/**
 * Composable for managing benchmark workout mode transitions.
 * Handles mode switching and block navigation during benchmark execution.
 */
export function useBenchmarkMode() {
  const { benchmarkWorkout, updateBenchmarkWorkout, currentBlock } = useBenchmark()

  const mode = computed(() => benchmarkWorkout.value.mode)
  const isPreparation = computed(() => mode.value === 'builder') // Builder mode = preparation for benchmarks
  const isActive = computed(() => mode.value === 'active')
  const isCompleted = computed(() => mode.value === 'completed')

  const currentBlockIndex = computed(() => benchmarkWorkout.value.selectedBlockIndex)
  const totalBlocks = computed(() => benchmarkWorkout.value.blocks.length)
  const hasBlocks = computed(() => totalBlocks.value > 0)

  const isFirstBlock = computed(() => {
    return currentBlockIndex.value === 0
  })

  const isLastBlock = computed(() => {
    return currentBlockIndex.value === totalBlocks.value - 1
  })

  /**
   * Initialize benchmark timestamps when entering active mode.
   * Sets both startedAt and globalTimerStartedAt.
   */
  function initializeTimestamps() {
    const now = Date.now()
    updateBenchmarkWorkout({
      startedAt: now,
      globalTimerStartedAt: now,
    })
  }

  /**
   * Initialize the first block for execution.
   * Sets activeExerciseIndex to 0.
   */
  function initializeFirstBlock() {
    updateBenchmarkWorkout({
      selectedBlockIndex: 0,
      activeExerciseIndex: 0,
    })
  }

  /**
   * Enter active mode - start the benchmark execution.
   * Initializes timestamps and selects the first block.
   */
  function enterActiveMode() {
    if (!hasBlocks.value) return

    initializeTimestamps()
    initializeFirstBlock()

    updateBenchmarkWorkout({ mode: 'active' })
  }

  /**
   * Enter completion mode - mark benchmark as completed.
   * Used when athlete finishes the benchmark before saving.
   */
  function enterCompletionMode() {
    updateBenchmarkWorkout({ mode: 'completed' })
  }

  /**
   * Advance to the next block (next round for rounds-type benchmarks).
   * Returns true if advanced, false if already at last block.
   */
  function advanceToNextBlock(): boolean {
    const nextIndex = currentBlockIndex.value + 1
    if (nextIndex >= totalBlocks.value) {
      return false
    }

    updateBenchmarkWorkout({
      selectedBlockIndex: nextIndex,
      activeExerciseIndex: 0, // Reset to first exercise of new block
    })

    return true
  }

  /**
   * Go to the previous block (previous round for rounds-type benchmarks).
   * Returns true if moved back, false if already at first block.
   */
  function goToPreviousBlock(): boolean {
    const previousIndex = currentBlockIndex.value - 1
    if (previousIndex < 0) {
      return false
    }

    // Go to the last exercise of the previous block
    const previousBlock = benchmarkWorkout.value.blocks[previousIndex]
    if (previousBlock) {
      const exercises = previousBlock.exercises
      const lastExerciseIndex = exercises.length > 0 ? exercises.length - 1 : 0
      updateBenchmarkWorkout({
        selectedBlockIndex: previousIndex,
        activeExerciseIndex: lastExerciseIndex,
      })
    }

    return true
  }

  return {
    // Mode state
    mode,
    isPreparation,
    isActive,
    isCompleted,

    // Block navigation
    currentBlockIndex,
    totalBlocks,
    hasBlocks,
    currentBlock,
    isFirstBlock,
    isLastBlock,

    // Mode transitions
    enterActiveMode,
    enterCompletionMode,

    // Block navigation
    advanceToNextBlock,
    goToPreviousBlock,

    // Initialization
    initializeTimestamps,
    initializeFirstBlock,
  }
}
