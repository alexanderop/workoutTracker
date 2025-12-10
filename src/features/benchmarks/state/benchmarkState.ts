import { ref } from 'vue'
import type { BenchmarkWorkout } from '@/types/benchmark'

function createInitialBenchmarkWorkout(): BenchmarkWorkout {
  return {
    id: 1,
    name: 'New Benchmark',
    benchmarkId: '',
    blocks: [],
    selectedBlockIndex: -1,
    activeExerciseIndex: 0,
    startedAt: Date.now(),
    globalTimerStartedAt: 0,
    mode: 'builder',
  }
}

// Singleton state - shared across all components
const benchmarkWorkout = ref<BenchmarkWorkout>(createInitialBenchmarkWorkout())

/**
 * Reset the benchmark workout to initial empty state.
 */
export function resetBenchmarkWorkout(): void {
  benchmarkWorkout.value = createInitialBenchmarkWorkout()
}

/**
 * Restore a benchmark workout from saved state (used for resuming from DB).
 */
export function restoreBenchmarkWorkout(savedWorkout: BenchmarkWorkout): void {
  benchmarkWorkout.value = savedWorkout
}

/**
 * Get the raw benchmark workout ref for direct state access.
 */
export function getBenchmarkWorkoutRef() {
  return benchmarkWorkout
}
