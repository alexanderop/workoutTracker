import type { Equipment, ExerciseType, Metrics, Muscle } from '@/stores/exercises'

export const EQUIPMENT_LABELS: Readonly<Record<Equipment, string>> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  band: 'Band',
  'ez-bar': 'EZ Bar',
  'hex-bar': 'Hex Bar',
  club: 'Club',
} as const

export const MUSCLE_LABELS: Readonly<Record<Muscle, string>> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
} as const

export const TYPE_LABELS: Readonly<Record<ExerciseType, string>> = {
  compound: 'Compound Movement',
  isolation: 'Isolation Movement',
  stability: 'Stability/Core',
  cardio: 'Cardio',
} as const

export const METRICS_LABELS: Readonly<Record<Metrics, string>> = {
  'weight-reps': 'Weight + Reps',
  'reps-only': 'Reps Only',
  duration: 'Duration',
  'distance-duration': 'Distance + Duration',
  'weight-distance': 'Weight + Distance',
} as const
