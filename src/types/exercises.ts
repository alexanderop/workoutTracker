/**
 * Shared exercise types.
 *
 * These types define exercise attributes used across the application.
 */

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'ez-bar'
  | 'hex-bar'
  | 'club'

export type Muscle = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core'

export type ExerciseType = 'compound' | 'isolation' | 'stability' | 'cardio'

export type Metrics =
  | 'weight-reps'
  | 'reps-only'
  | 'duration'
  | 'distance-duration'
  | 'weight-distance'

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
