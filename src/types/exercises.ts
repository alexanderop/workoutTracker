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

export type MovementPattern =
  | 'push-horizontal'
  | 'push-vertical'
  | 'pull-horizontal'
  | 'pull-vertical'
  | 'squat'
  | 'hinge'
  | 'carry'
  | 'rotation'
  | 'stability'
  | 'isolation'

export type PatternColor =
  | 'red'
  | 'orange'
  | 'amber'
  | 'green'
  | 'emerald'
  | 'cyan'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'rose'
  | 'slate'

export type CustomExercise = {
  id: string
  icon: string
  name: string
  equipment?: Equipment
  muscle?: Muscle
  type: ExerciseType
  metrics: Metrics
  pattern?: MovementPattern
  color?: PatternColor
  createdAt: number
}
