import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'
import type { SetStatus } from '@/types/workout'
import type { WorkoutMode } from '@/types/blocks'
import type { BenchmarkType } from '@/types/benchmark'

// ============================================
// EXERCISES TABLE
// ============================================

/**
 * Exercise definition stored in DB (renamed from DbCustomExercise).
 * Uses null instead of undefined for explicit "no value" semantics.
 */
export type DbExercise = {
  id: string
  icon: string
  name: string
  equipment: Equipment | null
  muscle: Muscle | null
  type: ExerciseType
  metrics: Metrics
  isBuiltIn: boolean
  createdAt: number
  updatedAt: number
}

// ============================================
// WORKOUT HEADERS TABLE (Normalized)
// ============================================

/**
 * Pre-computed workout statistics for O(1) retrieval.
 */
export type DbWorkoutStats = {
  blockCount: number
  setCount: number
  completedSetCount: number
  totalVolume: number // kg × reps summed across all completed sets
  timedBlockCount: number
  totalRounds: number // Sum of AMRAP rounds
}

/**
 * Completed workout header (normalized - no embedded blocks).
 * Blocks are stored in separate workoutBlocks table.
 */
export type DbWorkoutHeader = {
  id: string
  name: string
  startedAt: number
  completedAt: number
  durationSeconds: number
  notes: string
  benchmarkId: string | null
  templateId: string | null
  stats: DbWorkoutStats
}

// ============================================
// WORKOUT BLOCKS TABLE (Normalized)
// ============================================

/**
 * Block configuration union type for normalized storage.
 */
export type DbBlockConfig =
  | { kind: 'strength' }
  | { kind: 'emom'; minutes: number; exerciseRotation: 'each-minute' | 'full-round' }
  | { kind: 'amrap'; durationSeconds: number }
  | { kind: 'tabata'; rounds: number; workSeconds: number; restSeconds: number }
  | { kind: 'fortime'; timeCapSeconds: number | null }
  | {
      kind: 'cardio'
      activity: DbCardioActivity
      targetDurationSeconds: number | null
      targetDistanceMeters: number | null
    }

/**
 * Block result union type for normalized storage.
 */
export type DbBlockResult =
  | { kind: 'amrap'; rounds: number; partialReps: number; actualDuration: number }
  | { kind: 'emom'; completedMinutes: number; missedMinutes: ReadonlyArray<number> }
  | { kind: 'tabata'; repsPerRound: ReadonlyArray<number> }
  | { kind: 'fortime'; completionTime: number; completed: boolean; splitTimes?: ReadonlyArray<number> }
  | {
      kind: 'cardio'
      actualDurationSeconds: number
      distanceMeters: number | null
      avgPaceSecondsPerKm: number | null
      calories: number | null
      notes: string | null
    }

export type DbBlockKind = 'strength' | 'emom' | 'amrap' | 'tabata' | 'fortime' | 'cardio'

/**
 * Workout block stored in separate table (normalized).
 * Linked to workout via workoutId.
 */
export type DbNormalizedBlock = {
  id: string
  workoutId: string
  kind: DbBlockKind
  orderIndex: number
  config: DbBlockConfig
  result: DbBlockResult | null
  // For strength blocks - exercise snapshot
  exerciseId: string | null
  exerciseName: string | null
  equipment: string | null
  targetReps: number | null
  thumbnail: string | null
}

// ============================================
// WORKOUT SETS TABLE (Normalized)
// ============================================

/**
 * Individual set stored in separate table (normalized).
 * Linked to block via blockId.
 */
export type DbNormalizedSet = {
  id: string
  blockId: string
  orderIndex: number
  kg: string
  reps: string
  rir: string
  status: SetStatus
  completedAt: number | null
}

// ============================================
// BLOCK EXERCISES TABLE (Normalized)
// ============================================

/**
 * Exercise within a timed block (EMOM, AMRAP, ForTime, Tabata).
 * Stored in separate table, linked to block via blockId.
 */
export type DbNormalizedBlockExercise = {
  id: string
  blockId: string
  orderIndex: number
  exerciseId: string | null
  name: string
  prescribedReps: number
  load: string | null
  thumbnail: string
}

// ============================================
// TEMPLATES TABLE (Normalized Header)
// ============================================

/**
 * Template header (normalized - no embedded blocks).
 * Blocks are stored in separate templateBlocks table.
 */
export type DbTemplateHeader = {
  id: string
  name: string
  createdAt: number
  lastUsedAt: number | null
  usageCount: number
  tags: ReadonlyArray<string>
}

// ============================================
// TEMPLATE BLOCKS TABLE (Normalized)
// ============================================

/**
 * Template block stored in separate table (normalized).
 * Linked to template via templateId.
 */
export type DbNormalizedTemplateBlock = {
  id: string
  templateId: string
  kind: DbBlockKind
  orderIndex: number
  config: DbBlockConfig
  // For strength blocks
  exerciseId: string | null
  exerciseName: string | null
  equipment: string | null
  targetReps: number | null
  thumbnail: string | null
  defaultSetCount: number | null
}

// ============================================
// TEMPLATE BLOCK EXERCISES TABLE (Normalized)
// ============================================

/**
 * Exercise within a timed template block.
 * Stored in separate table, linked to template block via blockId.
 */
export type DbNormalizedTemplateBlockExercise = {
  id: string
  blockId: string
  orderIndex: number
  exerciseId: string | null
  name: string
  prescribedReps: number
  load: string | null
  thumbnail: string
}

// ============================================
// BENCHMARK PERSONAL BESTS TABLE (Denormalized)
// ============================================

/**
 * Denormalized personal best for O(1) lookup.
 * Updated when a benchmark workout is completed.
 */
export type DbBenchmarkPersonalBest = {
  benchmarkId: string
  completionTimeSeconds: number
  workoutId: string
  achievedAt: number
}

// ============================================
// BENCHMARK ATTEMPTS TABLE (Denormalized)
// ============================================

/**
 * Denormalized benchmark attempt for fast history queries.
 * Created when a benchmark workout is completed.
 */
export type DbBenchmarkAttempt = {
  id: string
  benchmarkId: string
  workoutId: string
  completionTimeSeconds: number
  completedAt: number
}

// ============================================
// BENCHMARKS TABLE
// ============================================

/**
 * Benchmark exercise (embedded in benchmark definition).
 * Stores snapshot of exercise data at benchmark creation time.
 */
export type DbBenchmarkExercise = {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  thumbnail: string
}

/**
 * Benchmark workout definition for performance tracking.
 * Exercises remain embedded (small, read-only definitions).
 */
export type DbBenchmark = {
  id: string
  name: string
  type: BenchmarkType
  rounds: number
  exercises: ReadonlyArray<DbBenchmarkExercise>
  createdAt: number
  lastUsedAt: number | null
}

// ============================================
// USER SETTINGS TABLE
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
  | { key: 'timerSoundVolume'; value: number }
  | { key: 'language'; value: 'en' | 'de' }

export type UserSettingKey = DbUserSetting['key']

// ============================================
// EMBEDDED TYPES FOR ACTIVE WORKOUTS
// (Singletons - keep embedded for simplicity)
// ============================================

/**
 * A set within an active workout (embedded).
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
 * Block exercise for timed blocks (embedded in active workouts).
 */
export type DbBlockExercise = {
  id: string
  name: string
  prescribedReps: number
  load: string | null
  thumbnail: string
}

// Block Configurations (embedded)
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

export type DbCardioActivity =
  | 'running'
  | 'cycling'
  | 'rowing'
  | 'elliptical'
  | 'swimming'
  | 'stairclimber'
  | 'walking'

type DbCardioConfig = {
  activity: DbCardioActivity
  targetDurationSeconds: number | null
  targetDistanceMeters: number | null
}

// Block Results (embedded)
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
  splitTimes?: ReadonlyArray<number>
}

export type DbCardioResult = {
  actualDurationSeconds: number
  distanceMeters: number | null
  avgPaceSecondsPerKm: number | null
  calories: number | null
  notes: string | null
}

// Embedded Block Types (for active workouts)
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

export type DbCardioBlock = {
  kind: 'cardio'
  id: string
  config: DbCardioConfig
  result: DbCardioResult | null
  orderIndex: number
}

type DbTimedBlock = DbEmomBlock | DbAmrapBlock | DbTabataBlock | DbForTimeBlock

export type DbWorkoutBlock = DbStrengthBlock | DbTimedBlock | DbCardioBlock

// ============================================
// ACTIVE WORKOUT (Singleton - Embedded)
// ============================================

/**
 * Active (in-progress) workout.
 * Only one active workout exists at a time (id is always 'current').
 * Blocks remain embedded for simplicity (singleton pattern).
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
  activeExerciseIndex: number | null
  benchmarkId: string | null
  globalTimerStartedAt: number | null
}

// ============================================
// ACTIVE BENCHMARK WORKOUT (Singleton - Embedded)
// ============================================

/**
 * Active (in-progress) benchmark workout.
 * Only one active benchmark exists at a time (id is always 'current-benchmark').
 * Blocks remain embedded for simplicity (singleton pattern).
 */
export type DbActiveBenchmarkWorkout = {
  id: 'current-benchmark'
  name: string
  benchmarkId: string
  blocks: ReadonlyArray<DbForTimeBlock>
  selectedBlockIndex: number
  activeExerciseIndex: number
  startedAt: number
  lastModifiedAt: number
  globalTimerStartedAt: number
  mode: WorkoutMode
}

// ============================================
// EMBEDDED TEMPLATE TYPES (for backward compat)
// ============================================

/**
 * Template block exercise (embedded - for converters).
 */
export type DbTemplateBlockExercise = {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  load: string | null
  thumbnail: string
}

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

type DbTemplateCardioBlock = {
  kind: 'cardio'
  config: DbCardioConfig
}

export type DbTemplateBlock =
  | DbTemplateStrengthBlock
  | DbTemplateEmomBlock
  | DbTemplateAmrapBlock
  | DbTemplateTabataBlock
  | DbTemplateForTimeBlock
  | DbTemplateCardioBlock

// ============================================
// LEGACY TYPES (for backward compatibility during transition)
// ============================================

/**
 * @deprecated Use DbWorkoutHeader with normalized blocks instead
 */
export type DbCompletedWorkout = {
  id: string
  name: string
  blocks: ReadonlyArray<DbWorkoutBlock>
  startedAt: number
  completedAt: number
  durationSeconds: number
  notes: string
  benchmarkId: string | null
}

/**
 * @deprecated Use DbTemplateHeader with normalized blocks instead
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
// TYPE GUARDS
// ============================================

export function isDbStrengthBlock(block: DbWorkoutBlock): block is DbStrengthBlock {
  return block.kind === 'strength'
}
