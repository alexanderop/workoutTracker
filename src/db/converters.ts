import type { Workout } from '@/types/workout'
import type { CustomExercise } from '@/exercises/types'
import type { BenchmarkWorkout } from '@/types/benchmark'
import {
  DEFAULT_HABIT_ACCENT,
  DEFAULT_HABIT_DESCRIPTION,
  HABIT_ACCENTS,
  type DbActiveBenchmarkWorkout,
  type DbActiveWorkout,
  type DbCustomExercise,
  type DbHabit,
  type HabitAccent,
  type StoredDbHabit,
} from './schema'
import { BLOCK_CODECS, blockToDatabase, databaseToBlock } from '@/blocks'
import { generateId } from './generateId'

// Per-kind block conversion lives in the Block Codecs under src/blocks/<kind>/
// and is dispatched through the Codec Registry (ADR 002). This module owns the
// workout-level conversion: assembling blocks, ordering, and repairing
// corrupted persisted state.

// ============================================
// Habit Converters
// ============================================

const HABIT_ACCENT_VALUES: ReadonlySet<unknown> = new Set(HABIT_ACCENTS)

function isHabitAccent(value: unknown): value is HabitAccent {
  return HABIT_ACCENT_VALUES.has(value)
}

/** Normalize legacy or malformed appearance fields at the repository boundary. */
export function normalizeDbHabit(habit: Readonly<StoredDbHabit>): DbHabit {
  return {
    ...habit,
    description:
      typeof habit.description === 'string' ? habit.description : DEFAULT_HABIT_DESCRIPTION,
    accent: isHabitAccent(habit.accent) ? habit.accent : DEFAULT_HABIT_ACCENT,
  }
}

// ============================================
// Workout Converters
// ============================================

/**
 * Convert in-memory Workout to database ActiveWorkout format.
 */
export function workoutToDb(
  workout: Readonly<Workout>,
  existingStartedAt?: number,
): DbActiveWorkout {
  return {
    id: 'current',
    name: workout.name,
    blocks: workout.blocks.map((block, index) => blockToDatabase(block, index)),
    selectedBlockIndex: workout.selectedBlockIndex,
    startedAt: existingStartedAt ?? workout.startedAt,
    lastModifiedAt: Date.now(),
    mode: workout.mode,
    activeSetIndex: workout.activeSetIndex,
    // Legacy benchmark fields kept for backward compatibility with existing DB entries
    activeExerciseIndex: null,
    benchmarkId: null,
    globalTimerStartedAt: null,
  }
}

/**
 * Convert database ActiveWorkout to in-memory Workout format.
 * Includes validation to handle corrupted data (e.g., selectedBlockIndex out of bounds).
 */
export function dbToWorkout(databaseWorkout: Readonly<DbActiveWorkout>): Workout {
  const sortedBlocks = databaseWorkout.blocks
    .toSorted((a, b) => a.orderIndex - b.orderIndex)
    .map((block, index) => databaseToBlock(block, index))

  // Validate and clamp selectedBlockIndex to prevent black screen on corrupted data
  const maxIndex = sortedBlocks.length - 1
  const rawIndex = databaseWorkout.selectedBlockIndex
  const selectedBlockIndex =
    sortedBlocks.length === 0 ? -1 : Math.max(0, Math.min(rawIndex, maxIndex))

  // Reset to builder mode if blocks are empty but mode was active/completed
  // This prevents showing active mode UI with no blocks
  const rawMode = databaseWorkout.mode ?? 'builder'
  const mode = sortedBlocks.length === 0 && rawMode !== 'builder' ? 'builder' : rawMode

  return {
    id: 1,
    name: databaseWorkout.name,
    blocks: sortedBlocks,
    selectedBlockIndex,
    startedAt: databaseWorkout.startedAt,
    mode,
    activeSetIndex: databaseWorkout.activeSetIndex ?? null,
    // Note: activeExerciseIndex, benchmarkId, globalTimerStartedAt are ignored
    // from DB - they're only kept in schema for backward compatibility
  }
}

// ============================================
// Custom Exercise Converters
// ============================================

/**
 * Convert database CustomExercise to in-memory format.
 */
export function dbToCustomExercise(databaseExercise: Readonly<DbCustomExercise>): CustomExercise {
  return {
    id: databaseExercise.id,
    name: databaseExercise.name,
    equipment: databaseExercise.equipment ?? undefined,
    muscle: databaseExercise.muscle ?? undefined,
    type: databaseExercise.type,
    metrics: databaseExercise.metrics,
    createdAt: databaseExercise.createdAt,
    image: databaseExercise.image ?? undefined,
  }
}

/**
 * Create a new CustomExercise for database storage.
 */
export function createDbCustomExercise(
  exercise: Omit<CustomExercise, 'id' | 'createdAt'>,
): DbCustomExercise {
  const now = Date.now()
  return {
    id: generateId(),
    name: exercise.name,
    equipment: exercise.equipment ?? null,
    muscle: exercise.muscle ?? null,
    type: exercise.type,
    metrics: exercise.metrics,
    createdAt: now,
    updatedAt: now,
    image: exercise.image ?? null,
  }
}

// ============================================
// Benchmark Workout Converters
// ============================================

/**
 * Convert BenchmarkWorkout to database format.
 * Benchmarks execute as ForTime blocks, so this goes straight through the
 * fortime codec instead of the registry dispatch.
 */
export function benchmarkWorkoutToDb(
  workout: Readonly<BenchmarkWorkout>,
): DbActiveBenchmarkWorkout {
  return {
    id: 'current-benchmark',
    name: workout.name,
    benchmarkId: workout.benchmarkId,
    blocks: workout.blocks.map((block, index) => BLOCK_CODECS.fortime.toDb(block, index)),
    selectedBlockIndex: workout.selectedBlockIndex,
    activeExerciseIndex: workout.activeExerciseIndex,
    startedAt: workout.startedAt,
    lastModifiedAt: Date.now(),
    globalTimerStartedAt: workout.globalTimerStartedAt,
    mode: workout.mode,
  }
}

/**
 * Convert database ActiveBenchmarkWorkout to in-memory format.
 */
export function dbToBenchmarkWorkout(
  databaseWorkout: Readonly<DbActiveBenchmarkWorkout>,
): BenchmarkWorkout {
  const sortedBlocks = databaseWorkout.blocks
    .toSorted((a, b) => a.orderIndex - b.orderIndex)
    .map((block, index) => BLOCK_CODECS.fortime.fromDb(block, index))

  return {
    id: databaseWorkout.id,
    name: databaseWorkout.name,
    benchmarkId: databaseWorkout.benchmarkId,
    blocks: sortedBlocks,
    selectedBlockIndex: databaseWorkout.selectedBlockIndex,
    activeExerciseIndex: databaseWorkout.activeExerciseIndex,
    startedAt: databaseWorkout.startedAt,
    globalTimerStartedAt: databaseWorkout.globalTimerStartedAt,
    mode: databaseWorkout.mode ?? 'builder',
  }
}
