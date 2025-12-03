import type { Set, Workout } from '@/composables/useWorkout'
import type { CustomExercise } from '@/stores/exercises'
import type {
  AmrapBlock,
  AmrapResult,
  BlockExercise,
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
  DbActiveWorkout,
  DbAmrapBlock,
  DbAmrapResult,
  DbBlockExercise,
  DbCustomExercise,
  DbEmomBlock,
  DbEmomResult,
  DbForTimeBlock,
  DbForTimeResult,
  DbLegacyActiveWorkout,
  DbSet,
  DbStrengthBlock,
  DbTabataBlock,
  DbTabataResult,
  DbWorkoutBlock,
  DbWorkoutExercise,
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
  }
}

function dbToForTimeResult(dbResult: Readonly<DbForTimeResult>): ForTimeResult {
  return {
    completionTime: dbResult.completionTime,
    completed: dbResult.completed,
  }
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

/**
 * Convert in-memory block to database format.
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
  }
}

/**
 * Convert database block to in-memory format.
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
  }
}

/**
 * Convert database ActiveWorkout to in-memory Workout format.
 */
export function dbToWorkout(dbWorkout: Readonly<DbActiveWorkout>): Workout {
  const sortedBlocks = [...dbWorkout.blocks]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(dbToBlock)

  return {
    id: 1,
    name: dbWorkout.name,
    blocks: sortedBlocks,
    selectedBlockIndex: dbWorkout.selectedBlockIndex,
    startedAt: dbWorkout.startedAt,
    mode: dbWorkout.mode ?? 'builder',
    activeSetIndex: dbWorkout.activeSetIndex ?? null,
  }
}

/**
 * Convert legacy active workout (exercises array) to new block-based format.
 */
export function legacyToBlockWorkout(legacy: Readonly<DbLegacyActiveWorkout>): DbActiveWorkout {
  const sortedExercises = [...legacy.exercises].sort((a, b) => a.orderIndex - b.orderIndex)

  const blocks: ReadonlyArray<DbWorkoutBlock> = sortedExercises.map(
    (ex, index): DbStrengthBlock => ({
      kind: 'strength',
      id: ex.id,
      exerciseDefinitionId: ex.exerciseDefinitionId,
      name: ex.name,
      equipment: ex.equipment,
      targetReps: ex.targetReps,
      thumbnail: ex.thumbnail,
      sets: ex.sets,
      orderIndex: index,
    }),
  )

  // Find selected block index
  const selectedIndex = sortedExercises.findIndex((ex) => ex.id === legacy.selectedExerciseId)

  return {
    id: 'current',
    name: legacy.name,
    blocks,
    selectedBlockIndex: selectedIndex >= 0 ? selectedIndex : 0,
    startedAt: legacy.startedAt,
    lastModifiedAt: legacy.lastModifiedAt,
    mode: 'builder',
    activeSetIndex: null,
  }
}

/**
 * Check if a workout is in legacy format (has exercises array instead of blocks).
 */
export function isLegacyWorkout(
  workout: DbActiveWorkout | DbLegacyActiveWorkout,
): workout is DbLegacyActiveWorkout {
  return 'exercises' in workout && !('blocks' in workout)
}

// ============================================
// Custom Exercise Converters
// ============================================

/**
 * Convert in-memory CustomExercise to database format.
 */
export function customExerciseToDb(exercise: Readonly<CustomExercise>): DbCustomExercise {
  return {
    id: exercise.id,
    icon: exercise.icon,
    name: exercise.name,
    equipment: exercise.equipment ?? null,
    muscle: exercise.muscle ?? null,
    type: exercise.type,
    metrics: exercise.metrics,
    createdAt: exercise.createdAt,
    updatedAt: Date.now(),
  }
}

/**
 * Convert database CustomExercise to in-memory format.
 */
export function dbToCustomExercise(dbExercise: Readonly<DbCustomExercise>): CustomExercise {
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
 * Create a new CustomExercise for database storage.
 */
export function createDbCustomExercise(
  exercise: Omit<CustomExercise, 'id' | 'createdAt'>,
): DbCustomExercise {
  const now = Date.now()
  return {
    id: generateId(),
    icon: exercise.icon,
    name: exercise.name,
    equipment: exercise.equipment ?? null,
    muscle: exercise.muscle ?? null,
    type: exercise.type,
    metrics: exercise.metrics,
    createdAt: now,
    updatedAt: now,
  }
}

// ============================================
// Legacy Exercise Converters (kept for backward compatibility)
// ============================================

/**
 * Convert legacy DbWorkoutExercise to DbStrengthBlock.
 * Used for migrating old data.
 */
export function legacyExerciseToBlock(exercise: Readonly<DbWorkoutExercise>): DbStrengthBlock {
  return {
    kind: 'strength',
    id: exercise.id,
    exerciseDefinitionId: exercise.exerciseDefinitionId,
    name: exercise.name,
    equipment: exercise.equipment,
    targetReps: exercise.targetReps,
    thumbnail: exercise.thumbnail,
    sets: exercise.sets,
    orderIndex: exercise.orderIndex,
  }
}
