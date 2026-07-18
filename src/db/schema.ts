import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'
import type { WorkoutMode } from '@/types/blocks'
import type { BenchmarkType } from '@/types/benchmark'
import type { DbSet, DbStrengthBlock } from '@/blocks/strength/types'
import type { DbForTimeBlock } from '@/blocks/fortime/types'
import type { DbTemplateBlock, DbWorkoutBlock } from '@/blocks/types'

// Block types moved to src/blocks/<kind>/ (ADR 002: Per-Kind Block Codecs);
// re-exported here so existing import paths keep working.
export type { DbSet, DbStrengthBlock, DbTemplateStrengthBlock } from '@/blocks/strength/types'
export type { DbBlockExercise, DbTemplateBlockExercise } from '@/blocks/shared/types'
export type { DbAmrapBlock, DbAmrapResult } from '@/blocks/amrap/types'
export type { DbEmomBlock, DbEmomResult } from '@/blocks/emom/types'
export type { DbTabataBlock, DbTabataResult } from '@/blocks/tabata/types'
export type { DbForTimeBlock, DbForTimeResult } from '@/blocks/fortime/types'
export type { DbCardioBlock, DbCardioResult } from '@/blocks/cardio/types'
export type { DbTemplateBlock, DbWorkoutBlock } from '@/blocks/types'

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
 * An exercise instance within a workout (embedded in workouts).
 * Contains snapshot of exercise data at time of workout.
 */
export type DbWorkoutExercise = {
  id: string
  exerciseDefinitionId: string | null
  name: string
  equipment: Equipment
  targetReps: number
  targetDuration: number | null
  targetWeight: number | null
  sets: ReadonlyArray<DbSet>
  orderIndex: number
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
// Per-kind template block types live in src/blocks/<kind>/types.ts and are
// re-exported above (ADR 002 stage 5).

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
  duration: number
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
// Habit Tracking Types
// ============================================

/**
 * How often a habit is expected to be done.
 */
export type HabitSchedule = { type: 'daily' } | { type: 'weekly'; targetDaysPerWeek: number } // 1-7

/**
 * What "done" means for a habit: a simple check-off, or hitting a quantity target.
 */
export type HabitKind = { type: 'binary' } | { type: 'quantity'; target: number; unit: string } // e.g. 2 'L' water

export const HABIT_ACCENTS = ['purple', 'blue', 'cyan', 'green', 'amber', 'rose', 'pink'] as const

export type HabitAccent = (typeof HABIT_ACCENTS)[number]

export const DEFAULT_HABIT_DESCRIPTION = null
export const DEFAULT_HABIT_ACCENT: HabitAccent = 'purple'

/**
 * A habit definition (e.g. "Drink water", "Stretch").
 * Archived rather than deleted so history is preserved (see DbHabitEntry) --
 * same convention as workouts/templates: nothing user-created disappears
 * outright.
 */
export type DbHabit = {
  id: string
  name: string
  icon: string | null // emoji
  description: string | null
  accent: HabitAccent
  schedule: HabitSchedule
  kind: HabitKind
  autoLink: 'completed-workout' | null
  archivedAt: number | null // archive, never delete history
  orderIndex: number
  createdAt: number
}

/** Raw habit shape accepted from IndexedDB before repository normalization. */
export type StoredDbHabit = Omit<DbHabit, 'description' | 'accent'> & {
  description?: unknown
  accent?: unknown
}

/**
 * A single day's record for a habit.
 * One entry per habit per day, deduped via the `[habitId+date]` compound
 * index (see database.ts) -- same start-of-day timestamp convention as
 * DbWeightEntry.date.
 */
export type DbHabitEntry = {
  id: string
  habitId: string
  date: number // Start of day timestamp (for one-entry-per-habit-per-day deduplication)
  value: number // 1 for binary; actual amount for quantity
  recordedAt: number // When the entry was actually logged
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
