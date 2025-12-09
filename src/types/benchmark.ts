/**
 * Shared benchmark types.
 *
 * These types define benchmark workout attributes used across the application.
 */

/**
 * Benchmark workout type.
 * - 'fortime': Complete prescribed rounds/reps as fast as possible
 * - 'rounds': Complete as many rounds as possible in a fixed time
 */
export type BenchmarkType = 'fortime' | 'rounds'
