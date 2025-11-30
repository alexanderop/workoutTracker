import type { Equipment, ExerciseType, Metrics, Muscle } from '@/stores/exercises'
import type { SetStatus } from '@/composables/useWorkout'

// ============================================
// Database Types
// ============================================

/**
 * Custom exercise definition stored in DB.
 * Uses null instead of undefined for explicit "no value" semantics.
 */
export type DbCustomExercise = {
  id: string
  icon: string
  name: string
  equipment: Equipment | null
  muscle: Muscle | null
  type: ExerciseType
  metrics: Metrics
  createdAt: number
  updatedAt: number
}

/**
 * A set within a workout exercise (embedded in DbWorkoutExercise).
 */
export type DbSet = {
  id: string
  kg: string
  reps: string
  rir: string
  status: SetStatus
  completedAt: number | null
}

/**
 * An exercise instance within a workout (embedded in workouts).
 * Contains snapshot of exercise data at time of workout.
 */
export type DbWorkoutExercise = {
  id: string
  exerciseDefinitionId: string | null
  name: string
  equipment: string
  targetReps: number
  thumbnail: string
  sets: ReadonlyArray<DbSet>
  orderIndex: number
}

// ============================================
// Block Exercise (for timed blocks)
// ============================================

export type DbBlockExercise = {
  id: string
  name: string
  prescribedReps: number
  load: string | null
  thumbnail: string
}

// ============================================
// Block Configurations
// ============================================

export type DbEmomConfig = {
  minutes: number
  exerciseRotation: 'each-minute' | 'full-round'
}

export type DbAmrapConfig = {
  durationSeconds: number
}

export type DbTabataConfig = {
  rounds: number
  workSeconds: number
  restSeconds: number
}

export type DbForTimeConfig = {
  timeCapSeconds: number | null
}

// ============================================
// Block Results
// ============================================

export type DbAmrapResult = {
  rounds: number
  partialReps: number
  actualDuration: number
}

export type DbEmomResult = {
  completedMinutes: number
  missedMinutes: ReadonlyArray<number>
}

export type DbTabataResult = {
  repsPerRound: ReadonlyArray<number>
}

export type DbForTimeResult = {
  completionTime: number
  completed: boolean
}

// ============================================
// Block Types (Discriminated Union)
// ============================================

export type DbStrengthBlock = {
  kind: 'strength'
  id: string
  exerciseDefinitionId: string | null
  name: string
  equipment: string
  targetReps: number
  thumbnail: string
  sets: ReadonlyArray<DbSet>
  orderIndex: number
}

export type DbEmomBlock = {
  kind: 'emom'
  id: string
  config: DbEmomConfig
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbEmomResult | null
  orderIndex: number
}

export type DbAmrapBlock = {
  kind: 'amrap'
  id: string
  config: DbAmrapConfig
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbAmrapResult | null
  orderIndex: number
}

export type DbTabataBlock = {
  kind: 'tabata'
  id: string
  config: DbTabataConfig
  exercise: DbBlockExercise
  result: DbTabataResult | null
  orderIndex: number
}

export type DbForTimeBlock = {
  kind: 'fortime'
  id: string
  config: DbForTimeConfig
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbForTimeResult | null
  orderIndex: number
}

export type DbTimedBlock = DbEmomBlock | DbAmrapBlock | DbTabataBlock | DbForTimeBlock

export type DbWorkoutBlock = DbStrengthBlock | DbTimedBlock

// ============================================
// Active Workout Types
// ============================================

/**
 * Active (in-progress) workout.
 * Only one active workout exists at a time (id is always 'current').
 */
export type DbActiveWorkout = {
  id: 'current'
  name: string
  blocks: ReadonlyArray<DbWorkoutBlock>
  selectedBlockIndex: number
  startedAt: number
  lastModifiedAt: number
}

/**
 * Completed workout (historical record).
 */
export type DbCompletedWorkout = {
  id: string
  name: string
  blocks: ReadonlyArray<DbWorkoutBlock>
  startedAt: number
  completedAt: number
  durationSeconds: number
  notes: string
}

// ============================================
// Template Types
// ============================================

/**
 * Template exercise (subset of exercise data for templates).
 */
export type DbTemplateExercise = {
  exerciseDefinitionId: string | null
  name: string
  equipment: string
  targetReps: number
  thumbnail: string
  defaultSetCount: number
}

/**
 * Template block exercise (for timed blocks in templates).
 */
export type DbTemplateBlockExercise = {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  load: string | null
  thumbnail: string
}

/**
 * Template block types (discriminated union).
 */
export type DbTemplateStrengthBlock = {
  kind: 'strength'
  exerciseDefinitionId: string | null
  name: string
  equipment: string
  targetReps: number
  thumbnail: string
  defaultSetCount: number
}

export type DbTemplateEmomBlock = {
  kind: 'emom'
  config: DbEmomConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

export type DbTemplateAmrapBlock = {
  kind: 'amrap'
  config: DbAmrapConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

export type DbTemplateTabataBlock = {
  kind: 'tabata'
  config: DbTabataConfig
  exercise: DbTemplateBlockExercise
}

export type DbTemplateForTimeBlock = {
  kind: 'fortime'
  config: DbForTimeConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

export type DbTemplateBlock =
  | DbTemplateStrengthBlock
  | DbTemplateEmomBlock
  | DbTemplateAmrapBlock
  | DbTemplateTabataBlock
  | DbTemplateForTimeBlock

/**
 * Workout template for reusable workout structures.
 */
export type DbWorkoutTemplate = {
  id: string
  name: string
  blocks: ReadonlyArray<DbTemplateBlock>
  createdAt: number
  lastUsedAt: number | null
  tags: ReadonlyArray<string>
}

// ============================================
// User Settings
// ============================================

/**
 * User settings with discriminated union for type safety.
 */
export type DbUserSetting =
  | { key: 'theme'; value: 'light' | 'dark' | 'system' }
  | { key: 'defaultRestTimer'; value: number }
  | { key: 'weightUnit'; value: 'kg' | 'lbs' }
  | { key: 'heightUnit'; value: 'cm' | 'ft-in' }
  | { key: 'autoSaveInterval'; value: number }

export type UserSettingKey = DbUserSetting['key']

// ============================================
// Type Guards
// ============================================

export function isDbStrengthBlock(block: DbWorkoutBlock): block is DbStrengthBlock {
  return block.kind === 'strength'
}

export function isDbTimedBlock(block: DbWorkoutBlock): block is DbTimedBlock {
  return block.kind !== 'strength'
}

// ============================================
// Legacy Types (for backward compatibility)
// ============================================

/**
 * Legacy active workout format (will be migrated to blocks).
 * @deprecated Use DbActiveWorkout with blocks instead
 */
export type DbLegacyActiveWorkout = {
  id: 'current'
  name: string
  exercises: ReadonlyArray<DbWorkoutExercise>
  selectedExerciseId: string
  startedAt: number
  lastModifiedAt: number
}

/**
 * Legacy completed workout format.
 * @deprecated Use DbCompletedWorkout with blocks instead
 */
export type DbLegacyCompletedWorkout = {
  id: string
  name: string
  exercises: ReadonlyArray<DbWorkoutExercise>
  startedAt: number
  completedAt: number
  durationSeconds: number
  notes: string
}

/**
 * Legacy template format.
 * @deprecated Use DbWorkoutTemplate with blocks instead
 */
export type DbLegacyWorkoutTemplate = {
  id: string
  name: string
  exercises: ReadonlyArray<DbTemplateExercise>
  createdAt: number
  lastUsedAt: number | null
}
