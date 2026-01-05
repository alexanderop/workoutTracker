/**
 * Shared benchmark types.
 *
 * These types define benchmark workout attributes used across the application.
 */

import type { ForTimeBlock } from './blocks'
import type { WorkoutMode } from './blocks'

/**
 * Benchmark workout type.
 * Only 'fortime' is supported - complete prescribed rounds/reps as fast as possible.
 */
export type BenchmarkType = 'fortime'

/**
 * Active benchmark workout state.
 * Represents an in-progress benchmark workout with all necessary tracking data.
 * Benchmarks only use ForTime blocks, even for rounds-type benchmarks.
 */
export type BenchmarkWorkout = {
  id: 'current-benchmark'
  name: string
  benchmarkId: string // Reference to benchmark definition
  blocks: Array<ForTimeBlock> // Only ForTime blocks (can be multiple for rounds-type benchmarks)
  selectedBlockIndex: number
  activeExerciseIndex: number // Exercise position across all blocks
  startedAt: number
  globalTimerStartedAt: number // For overall benchmark timer
  mode: WorkoutMode // Benchmarks use: 'builder' (preparation) | 'active' | 'completed'
}
