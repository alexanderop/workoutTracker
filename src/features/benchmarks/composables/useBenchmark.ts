import { computed } from 'vue'
import { getBenchmarkWorkoutRef as getBenchmarkWorkoutReference } from '../state/benchmarkState'
import type { BenchmarkWorkout } from '@/types/benchmark'
import type { ForTimeBlock, BlockExercise } from '@/blocks'
import { getBlockExerciseList } from '@/blocks'

// Get reference to shared benchmark workout singleton
const benchmarkWorkout = getBenchmarkWorkoutReference()

/**
 * Immutably update the benchmark workout object properties.
 */
function updateBenchmarkWorkout(updates: Partial<BenchmarkWorkout>): void {
  benchmarkWorkout.value = { ...benchmarkWorkout.value, ...updates }
}

/**
 * Get the current benchmark workout value.
 */
function getBenchmarkWorkout(): BenchmarkWorkout {
  return benchmarkWorkout.value
}

/**
 * Core composable for benchmark workout state management.
 * Provides state operations, current block/exercise tracking, and progress tracking.
 */
export function useBenchmark() {
  /**
   * Currently selected block.
   */
  const currentBlock = computed<ForTimeBlock | null>(() => {
    const index = benchmarkWorkout.value.selectedBlockIndex
    const block = benchmarkWorkout.value.blocks[index]
    return block ?? null
  })

  /**
   * Currently active exercise in the selected block.
   */
  const currentExercise = computed<BlockExercise | null>(() => {
    const block = currentBlock.value
    if (!block) return null

    const exerciseIndex = benchmarkWorkout.value.activeExerciseIndex
    const exercises = getBlockExerciseList(block)
    return exercises[exerciseIndex] ?? null
  })

  /**
   * All exercises in the current block.
   */
  const currentBlockExercises = computed<ReadonlyArray<BlockExercise>>(() => {
    const block = currentBlock.value
    if (!block) return []
    return getBlockExerciseList(block)
  })

  /**
   * Check if current block is the first block.
   */
  const isFirstBlock = computed(() => {
    return benchmarkWorkout.value.selectedBlockIndex === 0
  })

  /**
   * Check if current block is the last block.
   */
  const isLastBlock = computed(() => {
    const totalBlocks = benchmarkWorkout.value.blocks.length
    return benchmarkWorkout.value.selectedBlockIndex === totalBlocks - 1
  })

  /**
   * Number of completed blocks.
   */
  const blocksCompleted = computed(() => {
    return benchmarkWorkout.value.selectedBlockIndex
  })

  return {
    // Reactive state
    benchmarkWorkout,

    // State operations
    updateBenchmarkWorkout,
    getBenchmarkWorkout,

    // Current block/exercise
    currentBlock,
    currentExercise,
    currentBlockExercises,

    // Progress tracking
    isFirstBlock,
    isLastBlock,
    blocksCompleted,
  }
}
