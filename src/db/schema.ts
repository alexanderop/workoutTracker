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

/**
 * Active (in-progress) workout.
 * Only one active workout exists at a time (id is always 'current').
 */
export type DbActiveWorkout = {
  id: 'current'
  name: string
  exercises: ReadonlyArray<DbWorkoutExercise>
  selectedExerciseId: string
  startedAt: number
  lastModifiedAt: number
}

/**
 * Completed workout (historical record).
 */
export type DbCompletedWorkout = {
  id: string
  name: string
  exercises: ReadonlyArray<DbWorkoutExercise>
  startedAt: number
  completedAt: number
  durationSeconds: number
  notes: string
}

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
 * Workout template for reusable workout structures.
 */
export type DbWorkoutTemplate = {
  id: string
  name: string
  exercises: ReadonlyArray<DbTemplateExercise>
  createdAt: number
  lastUsedAt: number | null
}

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
