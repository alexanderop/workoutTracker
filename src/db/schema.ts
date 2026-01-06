import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'
import type { SetStatus } from '@/types/workout'
import type { WorkoutMode } from '@/types/blocks'
import type { BenchmarkType } from '@/types/benchmark'

// ============================================
// Database Types
// ============================================

/**
 * Custom exercise definition stored in DB.
 * Uses null instead of undefined for explicit "no value" semantics.
 */
export type DbCustomExercise = {
  id: string
  name: string
  equipment: Equipment | null
  muscle: Muscle | null
  type: ExerciseType
  metrics: Metrics
  createdAt: number
  updatedAt: number
  image: Blob | null
}

/**
 * A set within a workout exercise (embedded in DbWorkoutExercise).
 */
export type DbSet = {
  id: string
  kg: string
  reps: string
  duration: string
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
  equipment: Equipment
  targetReps: number
  sets: ReadonlyArray<DbSet>
  orderIndex: number
  image: Blob | null
}

// ============================================
// Block Exercise (for timed blocks)
// ============================================

export type DbBlockExercise = {
  id: string
  name: string
  prescribedReps: number
  load: string | null
  image: Blob | null
}

// ============================================
// Benchmark Types
// ============================================

/**
 * Exercise within a benchmark round.
 * Each round can have different exercises with different rep counts.
 * Uses orderKey for fractional indexing (efficient reordering).
 */
export type DbBenchmarkRoundExercise = {
  orderKey: string
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  image: Blob | null
}

/**
 * A single round in a benchmark.
 * Rounds are ordered by fractional indexing for efficient reordering.
 */
export type DbBenchmarkRound = {
  orderKey: string
  exercises: ReadonlyArray<DbBenchmarkRoundExercise>
}

/**
 * Benchmark workout definition for performance tracking.
 * Supports variable reps per round (pyramid/ladder workouts like 40-30-20-10).
 *
 * For ForTime benchmarks: Each round can have different exercises and reps.
 * For AMRAP/EMOM benchmarks: Rounds sync - changing one updates all.
 */
export type DbBenchmark = {
  id: string
  name: string
  type: BenchmarkType
  rounds: ReadonlyArray<DbBenchmarkRound>
  structureHash: string
  createdAt: number
  lastUsedAt: number | null
}

// ============================================
// Block Configurations
// ============================================

type DatabaseEmomConfig = {
  minutes: number
  exerciseRotation: 'each-minute' | 'full-round'
}

type DatabaseAmrapConfig = {
  durationSeconds: number
}

type DatabaseTabataConfig = {
  rounds: number
  workSeconds: number
  restSeconds: number
}

type DatabaseForTimeConfig = {
  timeCapSeconds: number | null
}

type DatabaseCardioActivity =
  | 'running'
  | 'cycling'
  | 'rowing'
  | 'elliptical'
  | 'swimming'
  | 'stairclimber'
  | 'walking'

type DatabaseCardioConfig = {
  activity: DatabaseCardioActivity
  targetDurationSeconds: number | null
  targetDistanceMeters: number | null
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
  splitTimes?: ReadonlyArray<number>
}

export type DbCardioResult = {
  actualDurationSeconds: number
  distanceMeters: number | null
  avgPaceSecondsPerKm: number | null
  calories: number | null
  notes: string | null
}

// ============================================
// Block Types (Discriminated Union)
// ============================================

export type DbStrengthBlock = {
  kind: 'strength'
  id: string
  exerciseDefinitionId: string | null
  name: string
  equipment: Equipment
  targetReps: number
  sets: ReadonlyArray<DbSet>
  orderIndex: number
  image: Blob | null
}

export type DbEmomBlock = {
  kind: 'emom'
  id: string
  config: DatabaseEmomConfig
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbEmomResult | null
  orderIndex: number
}

export type DbAmrapBlock = {
  kind: 'amrap'
  id: string
  config: DatabaseAmrapConfig
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbAmrapResult | null
  orderIndex: number
}

export type DbTabataBlock = {
  kind: 'tabata'
  id: string
  config: DatabaseTabataConfig
  exercise: DbBlockExercise
  result: DbTabataResult | null
  orderIndex: number
}

export type DbForTimeBlock = {
  kind: 'fortime'
  id: string
  config: DatabaseForTimeConfig
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbForTimeResult | null
  orderIndex: number
}

export type DbCardioBlock = {
  kind: 'cardio'
  id: string
  config: DatabaseCardioConfig
  result: DbCardioResult | null
  orderIndex: number
}

type DatabaseTimedBlock = DbEmomBlock | DbAmrapBlock | DbTabataBlock | DbForTimeBlock

export type DbWorkoutBlock = DbStrengthBlock | DatabaseTimedBlock | DbCardioBlock

// ============================================
// Active Benchmark Workout
// ============================================

/**
 * Active (in-progress) benchmark workout.
 * Only one active benchmark exists at a time (id is always 'current-benchmark').
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
  activeExerciseIndex: number | null
  benchmarkId: string | null
  globalTimerStartedAt: number | null
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
  benchmarkId: string | null
}

// ============================================
// Template Types
// ============================================

/**
 * Template block exercise (for timed blocks in templates).
 */
export type DbTemplateBlockExercise = {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  load: string | null
  image: Blob | null
}

/**
 * Template block types (discriminated union).
 */
export type DbTemplateStrengthBlock = {
  kind: 'strength'
  exerciseDefinitionId: string | null
  name: string
  equipment: Equipment
  targetReps: number
  defaultSetCount: number
  image: Blob | null
}

type DatabaseTemplateEmomBlock = {
  kind: 'emom'
  config: DatabaseEmomConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

type DatabaseTemplateAmrapBlock = {
  kind: 'amrap'
  config: DatabaseAmrapConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

type DatabaseTemplateTabataBlock = {
  kind: 'tabata'
  config: DatabaseTabataConfig
  exercise: DbTemplateBlockExercise
}

type DatabaseTemplateForTimeBlock = {
  kind: 'fortime'
  config: DatabaseForTimeConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

type DatabaseTemplateCardioBlock = {
  kind: 'cardio'
  config: DatabaseCardioConfig
}

export type DbTemplateBlock =
  | DbTemplateStrengthBlock
  | DatabaseTemplateEmomBlock
  | DatabaseTemplateAmrapBlock
  | DatabaseTemplateTabataBlock
  | DatabaseTemplateForTimeBlock
  | DatabaseTemplateCardioBlock

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
  | { key: 'timerSoundVolume'; value: number }
  | { key: 'language'; value: 'en' | 'de' }

export type UserSettingKey = DbUserSetting['key']

// ============================================
// Type Guards
// ============================================

export function isDbStrengthBlock(block: DbWorkoutBlock): block is DbStrengthBlock {
  return block.kind === 'strength'
}

// ============================================
// Exercise Progress Types
// ============================================

/**
 * Performance data for a single set within an exercise session.
 */
export type SetPerformance = {
  kg: number
  reps: number
  rir: number | null
  estimated1RM: number
}

/**
 * Exercise performance data from a single workout session.
 */
export type ExerciseSession = {
  workoutId: string
  workoutName: string
  date: Date
  sets: ReadonlyArray<SetPerformance>
  totalVolume: number
  maxWeight: number
  totalReps: number
}

/**
 * Aggregated statistics for an exercise across all sessions.
 */
export type ExerciseStats = {
  exerciseDefinitionId: string
  exerciseName: string
  totalSessions: number
  lastPerformed: Date | null
  firstPerformed: Date | null
  avgVolumePerSession: number
  avgFrequencyDays: number | null
}

/**
 * Personal record data for an exercise.
 */
export type PersonalRecords = {
  maxWeight: { kg: number; date: Date; reps: number } | null
  estimated1RM: { kg: number; date: Date; fromReps: number } | null
  maxVolume: { volume: number; date: Date } | null
  maxRepsAtWeight: ReadonlyMap<number, { reps: number; date: Date }>
}

/**
 * Exercise with workout count for selection in progress views.
 */
export type PerformedExercise = {
  exerciseDefinitionId: string
  name: string
  workoutCount: number
  lastPerformed: Date
}

// ============================================
// Weight Tracking Types
// ============================================

/**
 * Weight entry for daily body weight tracking.
 * Weight is always stored in kg (converted on display based on user settings).
 */
export type DbWeightEntry = {
  id: string
  weight: number // Always stored in kg
  date: number // Start of day timestamp (for one-entry-per-day deduplication)
  recordedAt: number // When the entry was actually logged
}

// ============================================
// Form Draft Types
// ============================================

/**
 * Form draft for auto-saving creation forms.
 * Allows users to resume where they left off if they navigate away.
 */
export type DraftKey = 'benchmark-create' | 'template-create'

export type DbFormDraft = {
  key: DraftKey
  data: unknown // Serialized form state (JSON-compatible)
  savedAt: number // Timestamp when draft was last saved
}

// ============================================
// Progression Types (Kettlebell Swing Tracker)
// ============================================

/**
 * Kettlebell swing progression plan with automatic advancement.
 * Tracks progress through reps → time → weight phases.
 */
export type DbProgression = {
  id: string
  name: string
  availableWeights: ReadonlyArray<number> // [12, 16, 20, 24] kg
  currentWeightIndex: number // Which KB we're on (0, 1, 2...)
  currentReps: number // 10-20
  currentMinutes: number // 10-20
  startReps: number // 10 (config)
  maxReps: number // 20 (config)
  repIncrement: number // 2 (config)
  startMinutes: number // 10 (config)
  maxMinutes: number // 20 (config)
  minuteIncrement: number // 2 (config)
  sessionsCompleted: number // Total sessions done
  isComplete: boolean // All KBs mastered
  createdAt: number
  lastSessionAt: number | null
}

/**
 * Single session within a progression plan.
 * Records whether the user completed all reps in each minute.
 */
export type DbProgressionSession = {
  id: string
  progressionId: string
  weight: number // kg used in this session
  reps: number // target reps per minute
  minutes: number // total EMOM minutes
  completed: boolean // Did user complete all reps each minute?
  completedAt: number
}

// ============================================
// Onboarding Types
// ============================================

/**
 * Onboarding state for first-time user flow.
 * Uses singleton pattern (id is always 'onboarding').
 */
export type DbOnboarding = {
  id: 'onboarding'
  completed: boolean
  currentStep: number
}
