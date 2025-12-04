import type { Equipment, ExerciseType, Metrics, Muscle } from '@/stores/exercises'
import type { SetStatus } from '@/composables/useWorkout'
import type { WorkoutMode } from '@/types/blocks'

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

type DbEmomConfig = {
  minutes: number
  exerciseRotation: 'each-minute' | 'full-round'
}

type DbAmrapConfig = {
  durationSeconds: number
}

type DbTabataConfig = {
  rounds: number
  workSeconds: number
  restSeconds: number
}

type DbForTimeConfig = {
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

type DbTimedBlock = DbEmomBlock | DbAmrapBlock | DbTabataBlock | DbForTimeBlock

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
  mode: WorkoutMode
  activeSetIndex: number | null
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
 * Template block exercise (for timed blocks in templates).
 */
type DbTemplateBlockExercise = {
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

type DbTemplateEmomBlock = {
  kind: 'emom'
  config: DbEmomConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

type DbTemplateAmrapBlock = {
  kind: 'amrap'
  config: DbAmrapConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

type DbTemplateTabataBlock = {
  kind: 'tabata'
  config: DbTabataConfig
  exercise: DbTemplateBlockExercise
}

type DbTemplateForTimeBlock = {
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
  | { key: 'screenWakeLock'; value: boolean }
  | { key: 'timerSoundEnabled'; value: boolean }
  | { key: 'language'; value: 'en' | 'de' }

export type UserSettingKey = DbUserSetting['key']

// ============================================
// Type Guards
// ============================================

export function isDbStrengthBlock(block: DbWorkoutBlock): block is DbStrengthBlock {
  return block.kind === 'strength'
}
