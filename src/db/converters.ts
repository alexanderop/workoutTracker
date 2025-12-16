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
  DbActiveBenchmarkWorkout,
  DbActiveWorkout,
  DbAmrapBlock,
  DbAmrapResult,
  DbBlockExercise,
  DbCardioBlock,
  DbCardioResult,
  DbEmomBlock,
  DbEmomResult,
  DbExercise,
  DbForTimeBlock,
  DbForTimeResult,
  DbSet,
  DbStrengthBlock,
  DbTabataBlock,
  DbTabataResult,
  DbWorkoutBlock,
} from './schema'
import { generateId } from './index'

// ============================================
// Set Converters
// ============================================

/**
 * Convert in-memory Set to database format.
 */
function setToDb(set: Readonly<Set>): DbSet {
  return {
    id: String(set.id),
    kg: set.kg,
    reps: set.reps,
    rir: set.rir,
    status: set.status,
    completedAt: set.status === 'completed' ? Date.now() : null,
  }
}

/**
 * Convert database Set to in-memory format.
 */
function dbToSet(dbSet: Readonly<DbSet>, index: number): Set {
  return {
    id: index + 1,
    kg: dbSet.kg,
    reps: dbSet.reps,
    rir: dbSet.rir,
    status: dbSet.status,
  }
}

// ============================================
// Block Exercise Converters
// ============================================

function blockExerciseToDb(exercise: Readonly<BlockExercise>): DbBlockExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    thumbnail: exercise.thumbnail,
  }
}

function dbToBlockExercise(dbExercise: Readonly<DbBlockExercise>): BlockExercise {
  return {
    id: dbExercise.id,
    name: dbExercise.name,
    prescribedReps: dbExercise.prescribedReps,
    load: dbExercise.load,
    thumbnail: dbExercise.thumbnail,
  }
}

// ============================================
// Block Result Converters
// ============================================

function amrapResultToDb(result: Readonly<AmrapResult>): DbAmrapResult {
  return {
    rounds: result.rounds,
    partialReps: result.partialReps,
    actualDuration: result.actualDuration,
  }
}

function dbToAmrapResult(dbResult: Readonly<DbAmrapResult>): AmrapResult {
  return {
    rounds: dbResult.rounds,
    partialReps: dbResult.partialReps,
    actualDuration: dbResult.actualDuration,
  }
}

function emomResultToDb(result: Readonly<EmomResult>): DbEmomResult {
  return {
    completedMinutes: result.completedMinutes,
    missedMinutes: [...result.missedMinutes],
  }
}

function dbToEmomResult(dbResult: Readonly<DbEmomResult>): EmomResult {
  return {
    completedMinutes: dbResult.completedMinutes,
    missedMinutes: [...dbResult.missedMinutes],
  }
}

function tabataResultToDb(result: Readonly<TabataResult>): DbTabataResult {
  return {
    repsPerRound: [...result.repsPerRound],
  }
}

function dbToTabataResult(dbResult: Readonly<DbTabataResult>): TabataResult {
  return {
    repsPerRound: [...dbResult.repsPerRound],
  }
}

function forTimeResultToDb(result: Readonly<ForTimeResult>): DbForTimeResult {
  return {
    completionTime: result.completionTime,
    completed: result.completed,
    splitTimes: result.splitTimes,
  }
}

function dbToForTimeResult(dbResult: Readonly<DbForTimeResult>): ForTimeResult {
  return {
    completionTime: dbResult.completionTime,
    completed: dbResult.completed,
    splitTimes: dbResult.splitTimes,
  }
}

function cardioResultToDb(result: Readonly<CardioResult>): DbCardioResult {
  return {
    actualDurationSeconds: result.actualDurationSeconds,
    distanceMeters: result.distanceMeters,
    avgPaceSecondsPerKm: result.avgPaceSecondsPerKm,
    calories: result.calories,
    notes: result.notes,
  }
}

function dbToCardioResult(dbResult: Readonly<DbCardioResult>): CardioResult {
  return {
    actualDurationSeconds: dbResult.actualDurationSeconds,
    distanceMeters: dbResult.distanceMeters,
    avgPaceSecondsPerKm: dbResult.avgPaceSecondsPerKm,
    calories: dbResult.calories,
    notes: dbResult.notes,
  }
}

// ============================================
// Block Converter Registry Types
// ============================================

type BlockConverterPair<K extends WorkoutBlock['kind']> = {
  toDb: (
    block: Readonly<Extract<WorkoutBlock, { kind: K }>>,
    orderIndex: number,
  ) => Extract<DbWorkoutBlock, { kind: K }>
  fromDb: (
    dbBlock: Readonly<Extract<DbWorkoutBlock, { kind: K }>>,
    index: number,
  ) => Extract<WorkoutBlock, { kind: K }>
}

type BlockConverterRegistry = {
  [K in WorkoutBlock['kind']]: BlockConverterPair<K>
}

// ============================================
// Block Converters
// ============================================

function strengthBlockToDb(block: Readonly<StrengthBlock>, orderIndex: number): DbStrengthBlock {
  return {
    kind: 'strength',
    id: String(block.id),
    exerciseDefinitionId: block.exerciseDefinitionId,
    name: block.name,
    equipment: block.equipment,
    targetReps: block.targetReps,
    thumbnail: block.thumbnail,
    sets: block.sets.map(setToDb),
    orderIndex,
  }
}

function dbToStrengthBlock(dbBlock: Readonly<DbStrengthBlock>, index: number): StrengthBlock {
  return {
    kind: 'strength',
    id: index + 1,
    exerciseDefinitionId: dbBlock.exerciseDefinitionId,
    name: dbBlock.name,
    equipment: dbBlock.equipment,
    targetReps: dbBlock.targetReps,
    thumbnail: dbBlock.thumbnail,
    sets: dbBlock.sets.map(dbToSet),
  }
}

function amrapBlockToDb(block: Readonly<AmrapBlock>, orderIndex: number): DbAmrapBlock {
  return {
    kind: 'amrap',
    id: String(block.id),
    config: {
      durationSeconds: block.config.durationSeconds,
    },
    exercises: block.exercises.map(blockExerciseToDb),
    result: block.result ? amrapResultToDb(block.result) : null,
    orderIndex,
  }
}

function dbToAmrapBlock(dbBlock: Readonly<DbAmrapBlock>, index: number): AmrapBlock {
  return {
    kind: 'amrap',
    id: index + 1,
    config: {
      durationSeconds: dbBlock.config.durationSeconds,
    },
    exercises: dbBlock.exercises.map(dbToBlockExercise),
    result: dbBlock.result ? dbToAmrapResult(dbBlock.result) : null,
  }
}

function emomBlockToDb(block: Readonly<EmomBlock>, orderIndex: number): DbEmomBlock {
  return {
    kind: 'emom',
    id: String(block.id),
    config: {
      minutes: block.config.minutes,
      exerciseRotation: block.config.exerciseRotation,
    },
    exercises: block.exercises.map(blockExerciseToDb),
    result: block.result ? emomResultToDb(block.result) : null,
    orderIndex,
  }
}

function dbToEmomBlock(dbBlock: Readonly<DbEmomBlock>, index: number): EmomBlock {
  return {
    kind: 'emom',
    id: index + 1,
    config: {
      minutes: dbBlock.config.minutes,
      exerciseRotation: dbBlock.config.exerciseRotation,
    },
    exercises: dbBlock.exercises.map(dbToBlockExercise),
    result: dbBlock.result ? dbToEmomResult(dbBlock.result) : null,
  }
}

function tabataBlockToDb(block: Readonly<TabataBlock>, orderIndex: number): DbTabataBlock {
  return {
    kind: 'tabata',
    id: String(block.id),
    config: {
      rounds: block.config.rounds,
      workSeconds: block.config.workSeconds,
      restSeconds: block.config.restSeconds,
    },
    exercise: blockExerciseToDb(block.exercise),
    result: block.result ? tabataResultToDb(block.result) : null,
    orderIndex,
  }
}

function dbToTabataBlock(dbBlock: Readonly<DbTabataBlock>, index: number): TabataBlock {
  return {
    kind: 'tabata',
    id: index + 1,
    config: {
      rounds: dbBlock.config.rounds,
      workSeconds: dbBlock.config.workSeconds,
      restSeconds: dbBlock.config.restSeconds,
    },
    exercise: dbToBlockExercise(dbBlock.exercise),
    result: dbBlock.result ? dbToTabataResult(dbBlock.result) : null,
  }
}

function forTimeBlockToDb(block: Readonly<ForTimeBlock>, orderIndex: number): DbForTimeBlock {
  return {
    kind: 'fortime',
    id: String(block.id),
    config: {
      timeCapSeconds: block.config.timeCapSeconds,
    },
    exercises: block.exercises.map(blockExerciseToDb),
    result: block.result ? forTimeResultToDb(block.result) : null,
    orderIndex,
  }
}

function dbToForTimeBlock(dbBlock: Readonly<DbForTimeBlock>, index: number): ForTimeBlock {
  return {
    kind: 'fortime',
    id: index + 1,
    config: {
      timeCapSeconds: dbBlock.config.timeCapSeconds,
    },
    exercises: dbBlock.exercises.map(dbToBlockExercise),
    result: dbBlock.result ? dbToForTimeResult(dbBlock.result) : null,
  }
}

function cardioBlockToDb(block: Readonly<CardioBlock>, orderIndex: number): DbCardioBlock {
  return {
    kind: 'cardio',
    id: String(block.id),
    config: {
      activity: block.config.activity,
      targetDurationSeconds: block.config.targetDurationSeconds,
      targetDistanceMeters: block.config.targetDistanceMeters,
    },
    result: block.result ? cardioResultToDb(block.result) : null,
    orderIndex,
  }
}

function dbToCardioBlock(dbBlock: Readonly<DbCardioBlock>, index: number): CardioBlock {
  return {
    kind: 'cardio',
    id: index + 1,
    config: {
      activity: dbBlock.config.activity,
      targetDurationSeconds: dbBlock.config.targetDurationSeconds,
      targetDistanceMeters: dbBlock.config.targetDistanceMeters,
    },
    result: dbBlock.result ? dbToCardioResult(dbBlock.result) : null,
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
  strength: { toDb: strengthBlockToDb, fromDb: dbToStrengthBlock },
  amrap: { toDb: amrapBlockToDb, fromDb: dbToAmrapBlock },
  emom: { toDb: emomBlockToDb, fromDb: dbToEmomBlock },
  tabata: { toDb: tabataBlockToDb, fromDb: dbToTabataBlock },
  fortime: { toDb: forTimeBlockToDb, fromDb: dbToForTimeBlock },
  cardio: { toDb: cardioBlockToDb, fromDb: dbToCardioBlock },
}

// Ensure registry covers all kinds (unused at runtime, enforced at compile time)
void BLOCK_CONVERTERS

/**
 * Convert in-memory block to database format.
 * Uses switch for proper TypeScript type narrowing.
 */
function blockToDb(block: Readonly<WorkoutBlock>, orderIndex: number): DbWorkoutBlock {
  switch (block.kind) {
    case 'strength':
      return strengthBlockToDb(block, orderIndex)
    case 'amrap':
      return amrapBlockToDb(block, orderIndex)
    case 'emom':
      return emomBlockToDb(block, orderIndex)
    case 'tabata':
      return tabataBlockToDb(block, orderIndex)
    case 'fortime':
      return forTimeBlockToDb(block, orderIndex)
    case 'cardio':
      return cardioBlockToDb(block, orderIndex)
  }
}

/**
 * Convert database block to in-memory format.
 * Uses switch for proper TypeScript type narrowing.
 */
function dbToBlock(dbBlock: Readonly<DbWorkoutBlock>, index: number): WorkoutBlock {
  switch (dbBlock.kind) {
    case 'strength':
      return dbToStrengthBlock(dbBlock, index)
    case 'amrap':
      return dbToAmrapBlock(dbBlock, index)
    case 'emom':
      return dbToEmomBlock(dbBlock, index)
    case 'tabata':
      return dbToTabataBlock(dbBlock, index)
    case 'fortime':
      return dbToForTimeBlock(dbBlock, index)
    case 'cardio':
      return dbToCardioBlock(dbBlock, index)
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
    blocks: workout.blocks.map((block, index) => blockToDb(block, index)),
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
 */
export function dbToWorkout(dbWorkout: Readonly<DbActiveWorkout>): Workout {
  const sortedBlocks = dbWorkout.blocks
    .toSorted((a, b) => a.orderIndex - b.orderIndex)
    .map(dbToBlock)

  return {
    id: 1,
    name: dbWorkout.name,
    blocks: sortedBlocks,
    selectedBlockIndex: dbWorkout.selectedBlockIndex,
    startedAt: dbWorkout.startedAt,
    mode: dbWorkout.mode ?? 'builder',
    activeSetIndex: dbWorkout.activeSetIndex ?? null,
    // Note: activeExerciseIndex, benchmarkId, globalTimerStartedAt are ignored
    // from DB - they're only kept in schema for backward compatibility
  }
}

// ============================================
// Exercise Converters
// ============================================

/**
 * Convert database Exercise to in-memory CustomExercise format.
 */
export function dbToExercise(dbExercise: Readonly<DbExercise>): CustomExercise {
  return {
    id: dbExercise.id,
    icon: dbExercise.icon,
    name: dbExercise.name,
    equipment: dbExercise.equipment ?? undefined,
    muscle: dbExercise.muscle ?? undefined,
    type: dbExercise.type,
    metrics: dbExercise.metrics,
    createdAt: dbExercise.createdAt,
  }
}

/**
 * Create a new custom exercise for database storage.
 * Sets isBuiltIn to false for user-created exercises.
 */
export function createDbExercise(
  exercise: Omit<CustomExercise, 'id' | 'createdAt'>,
): DbExercise {
  const now = Date.now()
  return {
    id: generateId(),
    icon: exercise.icon,
    name: exercise.name,
    equipment: exercise.equipment ?? null,
    muscle: exercise.muscle ?? null,
    type: exercise.type,
    metrics: exercise.metrics,
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
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
): DbActiveBenchmarkWorkout {
  return {
    id: "current-benchmark",
    name: workout.name,
    benchmarkId: workout.benchmarkId,
    blocks: workout.blocks.map((block, index) => forTimeBlockToDb(block, index)),
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
export function dbToBenchmarkWorkout(dbWorkout: Readonly<DbActiveBenchmarkWorkout>): BenchmarkWorkout {
  const sortedBlocks = dbWorkout.blocks
    .toSorted((a, b) => a.orderIndex - b.orderIndex)
    .map(dbToForTimeBlock)

  return {
    id: dbWorkout.id,
    name: dbWorkout.name,
    benchmarkId: dbWorkout.benchmarkId,
    blocks: sortedBlocks,
    selectedBlockIndex: dbWorkout.selectedBlockIndex,
    activeExerciseIndex: dbWorkout.activeExerciseIndex,
    startedAt: dbWorkout.startedAt,
    globalTimerStartedAt: dbWorkout.globalTimerStartedAt,
    mode: dbWorkout.mode ?? "builder",
  }
}

