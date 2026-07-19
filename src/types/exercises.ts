/**
 * Shared exercise types.
 *
 * These types define exercise attributes used across the application.
 * The runtime `*_VALUES` tuples are the single source of truth: the union
 * types derive from them, and the import-validation Zod enums in
 * `src/features/settings/utils/validation/primitiveSchemas.ts` consume them
 * directly, so adding a member here propagates everywhere at compile time.
 */

export const EQUIPMENT_VALUES = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'band',
  'ez-bar',
  'hex-bar',
  'club',
  'battle-rope',
  'egym',
] as const

export type Equipment = (typeof EQUIPMENT_VALUES)[number]

export const MUSCLE_VALUES = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as const

export type Muscle = (typeof MUSCLE_VALUES)[number]

export const EXERCISE_TYPE_VALUES = [
  'compound',
  'isolation',
  'stability',
  'cardio',
  'isometric',
] as const

export type ExerciseType = (typeof EXERCISE_TYPE_VALUES)[number]

export const METRICS_VALUES = [
  'weight-reps',
  'reps-only',
  'duration',
  'distance-duration',
  'weight-distance',
] as const

export type Metrics = (typeof METRICS_VALUES)[number]

export type CustomExercise = {
  id: string
  name: string
  equipment?: Equipment
  muscle?: Muscle
  type: ExerciseType
  metrics: Metrics
  createdAt: number
  image?: Blob
}
