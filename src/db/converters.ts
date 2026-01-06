import type { Set, Workout } from '@/types/workout'
import type { CustomExercise } from '@/types/exercises'
import type { BenchmarkWorkout } from '@/types/benchmark'
import type {
  AmrapBlock,
  AmrapResult,
  BlockExercise,
  CardioBlock,
  CardioResult,
  EmomBlock,
  EmomResult,
  ForTimeBlock,
  ForTimeResult,
  StrengthBlock,
  TabataBlock,
  TabataResult,
  WorkoutBlock,
} from '@/types/blocks'
import type {
  DbActiveBenchmarkWorkout as DatabaseActiveBenchmarkWorkout,
  DbActiveWorkout as DatabaseActiveWorkout,
  DbAmrapBlock as DatabaseAmrapBlock,
  DbAmrapResult as DatabaseAmrapResult,
  DbBlockExercise as DatabaseBlockExercise,
  DbCardioBlock as DatabaseCardioBlock,
  DbCardioResult as DatabaseCardioResult,
  DbCustomExercise as DatabaseCustomExercise,
  DbEmomBlock as DatabaseEmomBlock,
  DbEmomResult as DatabaseEmomResult,
  DbForTimeBlock as DatabaseForTimeBlock,
  DbForTimeResult as DatabaseForTimeResult,
  DbSet as DatabaseSet,
  DbStrengthBlock as DatabaseStrengthBlock,
  DbTabataBlock as DatabaseTabataBlock,
  DbTabataResult as DatabaseTabataResult,
  DbWorkoutBlock as DatabaseWorkoutBlock,
} from './schema'
import { generateId } from './index'

// ============================================
// Set Converters
// ============================================

/**
 * Convert in-memory Set to database format.
 */
function setToDatabase(set: Readonly<Set>): DatabaseSet {
  return {
    id: String(set.id),
    kg: set.kg,
    reps: set.reps,
    duration: set.duration,
    rir: set.rir,
    status: set.status,
    completedAt: set.status === 'completed' ? Date.now() : null,
  }
}

/**
 * Convert database Set to in-memory format.
 */
function databaseToSet(databaseSet: Readonly<DatabaseSet>, index: number): Set {
  return {
    id: index + 1,
    kg: databaseSet.kg,
    reps: databaseSet.reps,
    duration: databaseSet.duration,
    rir: databaseSet.rir,
    status: databaseSet.status,
  }
}

// ============================================
// Block Exercise Converters
// ============================================

function blockExerciseToDatabase(exercise: Readonly<BlockExercise>): DatabaseBlockExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    image: exercise.image,
  }
}

function databaseToBlockExercise(databaseExercise: Readonly<DatabaseBlockExercise>): BlockExercise {
  return {
    id: databaseExercise.id,
    name: databaseExercise.name,
    prescribedReps: databaseExercise.prescribedReps,
    load: databaseExercise.load,
    image: databaseExercise.image,
  }
}

// ============================================
// Block Result Converters
// ============================================

function amrapResultToDatabase(result: Readonly<AmrapResult>): DatabaseAmrapResult {
  return {
    rounds: result.rounds,
    partialReps: result.partialReps,
    actualDuration: result.actualDuration,
  }
}

function databaseToAmrapResult(databaseResult: Readonly<DatabaseAmrapResult>): AmrapResult {
  return {
    rounds: databaseResult.rounds,
    partialReps: databaseResult.partialReps,
    actualDuration: databaseResult.actualDuration,
  }
}

function emomResultToDatabase(result: Readonly<EmomResult>): DatabaseEmomResult {
  return {
    completedMinutes: result.completedMinutes,
    missedMinutes: [...result.missedMinutes],
  }
}

function databaseToEmomResult(databaseResult: Readonly<DatabaseEmomResult>): EmomResult {
  return {
    completedMinutes: databaseResult.completedMinutes,
    missedMinutes: [...databaseResult.missedMinutes],
  }
}

function tabataResultToDatabase(result: Readonly<TabataResult>): DatabaseTabataResult {
  return {
    repsPerRound: [...result.repsPerRound],
  }
}

function databaseToTabataResult(databaseResult: Readonly<DatabaseTabataResult>): TabataResult {
  return {
    repsPerRound: [...databaseResult.repsPerRound],
  }
}

function forTimeResultToDatabase(result: Readonly<ForTimeResult>): DatabaseForTimeResult {
  return {
    completionTime: result.completionTime,
    completed: result.completed,
    splitTimes: result.splitTimes,
  }
}

function databaseToForTimeResult(databaseResult: Readonly<DatabaseForTimeResult>): ForTimeResult {
  return {
    completionTime: databaseResult.completionTime,
    completed: databaseResult.completed,
    splitTimes: databaseResult.splitTimes,
  }
}

function cardioResultToDatabase(result: Readonly<CardioResult>): DatabaseCardioResult {
  return {
    actualDurationSeconds: result.actualDurationSeconds,
    distanceMeters: result.distanceMeters,
    avgPaceSecondsPerKm: result.avgPaceSecondsPerKm,
    calories: result.calories,
    notes: result.notes,
  }
}

function databaseToCardioResult(databaseResult: Readonly<DatabaseCardioResult>): CardioResult {
  return {
    actualDurationSeconds: databaseResult.actualDurationSeconds,
    distanceMeters: databaseResult.distanceMeters,
    avgPaceSecondsPerKm: databaseResult.avgPaceSecondsPerKm,
    calories: databaseResult.calories,
    notes: databaseResult.notes,
  }
}

// ============================================
// Block Converter Registry Types
// ============================================

type BlockConverterPair<K extends WorkoutBlock['kind']> = {
  toDb: (
    block: Readonly<Extract<WorkoutBlock, { kind: K }>>,
    orderIndex: number,
  ) => Extract<DatabaseWorkoutBlock, { kind: K }>
  fromDb: (
    databaseBlock: Readonly<Extract<DatabaseWorkoutBlock, { kind: K }>>,
    index: number,
  ) => Extract<WorkoutBlock, { kind: K }>
}

type BlockConverterRegistry = {
  [K in WorkoutBlock['kind']]: BlockConverterPair<K>
}

// ============================================
// Block Converters
// ============================================

function strengthBlockToDatabase(block: Readonly<StrengthBlock>, orderIndex: number): DatabaseStrengthBlock {
  return {
    kind: 'strength',
    id: String(block.id),
    exerciseDefinitionId: block.exerciseDefinitionId,
    name: block.name,
    equipment: block.equipment,
    targetReps: block.targetReps,
    targetDuration: block.targetDuration,
    targetWeight: block.targetWeight,
    sets: block.sets.map(setToDatabase),
    orderIndex,
    image: block.image,
  }
}

function databaseToStrengthBlock(databaseBlock: Readonly<DatabaseStrengthBlock>, index: number): StrengthBlock {
  return {
    kind: 'strength',
    id: index + 1,
    exerciseDefinitionId: databaseBlock.exerciseDefinitionId,
    name: databaseBlock.name,
    equipment: databaseBlock.equipment,
    targetReps: databaseBlock.targetReps,
    targetDuration: databaseBlock.targetDuration ?? null, // backward compatibility
    targetWeight: databaseBlock.targetWeight ?? null, // backward compatibility
    sets: databaseBlock.sets.map(databaseToSet),
    image: databaseBlock.image,
  }
}

function amrapBlockToDatabase(block: Readonly<AmrapBlock>, orderIndex: number): DatabaseAmrapBlock {
  return {
    kind: 'amrap',
    id: String(block.id),
    config: {
      durationSeconds: block.config.durationSeconds,
    },
    exercises: block.exercises.map(blockExerciseToDatabase),
    result: block.result ? amrapResultToDatabase(block.result) : null,
    orderIndex,
  }
}

function databaseToAmrapBlock(databaseBlock: Readonly<DatabaseAmrapBlock>, index: number): AmrapBlock {
  return {
    kind: 'amrap',
    id: index + 1,
    config: {
      durationSeconds: databaseBlock.config.durationSeconds,
    },
    exercises: databaseBlock.exercises.map(databaseToBlockExercise),
    result: databaseBlock.result ? databaseToAmrapResult(databaseBlock.result) : null,
  }
}

function emomBlockToDatabase(block: Readonly<EmomBlock>, orderIndex: number): DatabaseEmomBlock {
  return {
    kind: 'emom',
    id: String(block.id),
    config: {
      minutes: block.config.minutes,
      exerciseRotation: block.config.exerciseRotation,
    },
    exercises: block.exercises.map(blockExerciseToDatabase),
    result: block.result ? emomResultToDatabase(block.result) : null,
    orderIndex,
  }
}

function databaseToEmomBlock(databaseBlock: Readonly<DatabaseEmomBlock>, index: number): EmomBlock {
  return {
    kind: 'emom',
    id: index + 1,
    config: {
      minutes: databaseBlock.config.minutes,
      exerciseRotation: databaseBlock.config.exerciseRotation,
    },
    exercises: databaseBlock.exercises.map(databaseToBlockExercise),
    result: databaseBlock.result ? databaseToEmomResult(databaseBlock.result) : null,
  }
}

function tabataBlockToDatabase(block: Readonly<TabataBlock>, orderIndex: number): DatabaseTabataBlock {
  return {
    kind: 'tabata',
    id: String(block.id),
    config: {
      rounds: block.config.rounds,
      workSeconds: block.config.workSeconds,
      restSeconds: block.config.restSeconds,
    },
    exercise: blockExerciseToDatabase(block.exercise),
    result: block.result ? tabataResultToDatabase(block.result) : null,
    orderIndex,
  }
}

function databaseToTabataBlock(databaseBlock: Readonly<DatabaseTabataBlock>, index: number): TabataBlock {
  return {
    kind: 'tabata',
    id: index + 1,
    config: {
      rounds: databaseBlock.config.rounds,
      workSeconds: databaseBlock.config.workSeconds,
      restSeconds: databaseBlock.config.restSeconds,
    },
    exercise: databaseToBlockExercise(databaseBlock.exercise),
    result: databaseBlock.result ? databaseToTabataResult(databaseBlock.result) : null,
  }
}

function forTimeBlockToDatabase(block: Readonly<ForTimeBlock>, orderIndex: number): DatabaseForTimeBlock {
  return {
    kind: 'fortime',
    id: String(block.id),
    config: {
      timeCapSeconds: block.config.timeCapSeconds,
    },
    exercises: block.exercises.map(blockExerciseToDatabase),
    result: block.result ? forTimeResultToDatabase(block.result) : null,
    orderIndex,
  }
}

function databaseToForTimeBlock(databaseBlock: Readonly<DatabaseForTimeBlock>, index: number): ForTimeBlock {
  return {
    kind: 'fortime',
    id: index + 1,
    config: {
      timeCapSeconds: databaseBlock.config.timeCapSeconds,
    },
    exercises: databaseBlock.exercises.map(databaseToBlockExercise),
    result: databaseBlock.result ? databaseToForTimeResult(databaseBlock.result) : null,
  }
}

function cardioBlockToDatabase(block: Readonly<CardioBlock>, orderIndex: number): DatabaseCardioBlock {
  return {
    kind: 'cardio',
    id: String(block.id),
    config: {
      activity: block.config.activity,
      targetDurationSeconds: block.config.targetDurationSeconds,
      targetDistanceMeters: block.config.targetDistanceMeters,
    },
    result: block.result ? cardioResultToDatabase(block.result) : null,
    orderIndex,
  }
}

function databaseToCardioBlock(databaseBlock: Readonly<DatabaseCardioBlock>, index: number): CardioBlock {
  return {
    kind: 'cardio',
    id: index + 1,
    config: {
      activity: databaseBlock.config.activity,
      targetDurationSeconds: databaseBlock.config.targetDurationSeconds,
      targetDistanceMeters: databaseBlock.config.targetDistanceMeters,
    },
    result: databaseBlock.result ? databaseToCardioResult(databaseBlock.result) : null,
  }
}

// ============================================
// Block Converter Registry (compile-time exhaustiveness check)
// ============================================

/**
 * Registry mapping block kinds to their conversion functions.
 * TypeScript enforces that all block kinds are covered at compile time.
 */
const BLOCK_CONVERTERS: BlockConverterRegistry = {
  strength: { toDb: strengthBlockToDatabase, fromDb: databaseToStrengthBlock },
  amrap: { toDb: amrapBlockToDatabase, fromDb: databaseToAmrapBlock },
  emom: { toDb: emomBlockToDatabase, fromDb: databaseToEmomBlock },
  tabata: { toDb: tabataBlockToDatabase, fromDb: databaseToTabataBlock },
  fortime: { toDb: forTimeBlockToDatabase, fromDb: databaseToForTimeBlock },
  cardio: { toDb: cardioBlockToDatabase, fromDb: databaseToCardioBlock },
}

// Ensure registry covers all kinds (unused at runtime, enforced at compile time)
void BLOCK_CONVERTERS

/**
 * Convert in-memory block to database format.
 * Uses switch for proper TypeScript type narrowing.
 */
function blockToDatabase(block: Readonly<WorkoutBlock>, orderIndex: number): DatabaseWorkoutBlock {
  switch (block.kind) {
    case 'strength': {
      return strengthBlockToDatabase(block, orderIndex)
    }
    case 'amrap': {
      return amrapBlockToDatabase(block, orderIndex)
    }
    case 'emom': {
      return emomBlockToDatabase(block, orderIndex)
    }
    case 'tabata': {
      return tabataBlockToDatabase(block, orderIndex)
    }
    case 'fortime': {
      return forTimeBlockToDatabase(block, orderIndex)
    }
    case 'cardio': {
      return cardioBlockToDatabase(block, orderIndex)
    }
  }
}

/**
 * Convert database block to in-memory format.
 * Uses switch for proper TypeScript type narrowing.
 */
function databaseToBlock(databaseBlock: Readonly<DatabaseWorkoutBlock>, index: number): WorkoutBlock {
  switch (databaseBlock.kind) {
    case 'strength': {
      return databaseToStrengthBlock(databaseBlock, index)
    }
    case 'amrap': {
      return databaseToAmrapBlock(databaseBlock, index)
    }
    case 'emom': {
      return databaseToEmomBlock(databaseBlock, index)
    }
    case 'tabata': {
      return databaseToTabataBlock(databaseBlock, index)
    }
    case 'fortime': {
      return databaseToForTimeBlock(databaseBlock, index)
    }
    case 'cardio': {
      return databaseToCardioBlock(databaseBlock, index)
    }
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
): DatabaseActiveWorkout {
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
export function dbToWorkout(databaseWorkout: Readonly<DatabaseActiveWorkout>): Workout {
  const sortedBlocks = databaseWorkout.blocks
    .toSorted((a, b) => a.orderIndex - b.orderIndex)
    .map(databaseToBlock)

  // Validate and clamp selectedBlockIndex to prevent black screen on corrupted data
  const maxIndex = sortedBlocks.length - 1
  const rawIndex = databaseWorkout.selectedBlockIndex
  const selectedBlockIndex = sortedBlocks.length === 0 ? -1 : Math.max(0, Math.min(rawIndex, maxIndex))

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
export function dbToCustomExercise(databaseExercise: Readonly<DatabaseCustomExercise>): CustomExercise {
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
): DatabaseCustomExercise {
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
 */
export function benchmarkWorkoutToDb(
  workout: Readonly<BenchmarkWorkout>,
): DatabaseActiveBenchmarkWorkout {
  return {
    id: "current-benchmark",
    name: workout.name,
    benchmarkId: workout.benchmarkId,
    blocks: workout.blocks.map((block, index) => forTimeBlockToDatabase(block, index)),
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
export function dbToBenchmarkWorkout(databaseWorkout: Readonly<DatabaseActiveBenchmarkWorkout>): BenchmarkWorkout {
  const sortedBlocks = databaseWorkout.blocks
    .toSorted((a, b) => a.orderIndex - b.orderIndex)
    .map(databaseToForTimeBlock)

  return {
    id: databaseWorkout.id,
    name: databaseWorkout.name,
    benchmarkId: databaseWorkout.benchmarkId,
    blocks: sortedBlocks,
    selectedBlockIndex: databaseWorkout.selectedBlockIndex,
    activeExerciseIndex: databaseWorkout.activeExerciseIndex,
    startedAt: databaseWorkout.startedAt,
    globalTimerStartedAt: databaseWorkout.globalTimerStartedAt,
    mode: databaseWorkout.mode ?? "builder",
  }
}

