import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'

export type SelectorOption<T extends string = string> = {
  value: T
  label: string
  icon?: string
  description?: string
}

export const EQUIPMENT_OPTIONS: ReadonlyArray<SelectorOption<Equipment>> = [
  { value: 'barbell', label: 'Barbell', icon: '🏋️' },
  { value: 'dumbbell', label: 'Dumbbell', icon: '🪑' },
  { value: 'machine', label: 'Machine', icon: '⚙️' },
  { value: 'cable', label: 'Cable', icon: '📏' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '💪' },
  { value: 'kettlebell', label: 'Kettlebell', icon: '🔔' },
  { value: 'band', label: 'Band', icon: '〰️' },
  { value: 'ez-bar', label: 'EZ Bar', icon: '↪️' },
  { value: 'hex-bar', label: 'Hex Bar', icon: '⬡' },
]

export const MUSCLE_OPTIONS: ReadonlyArray<SelectorOption<Muscle>> = [
  { value: 'chest', label: 'Chest', icon: '🏔️' },
  { value: 'back', label: 'Back', icon: '🔙' },
  { value: 'legs', label: 'Legs', icon: '🦵' },
  { value: 'shoulders', label: 'Shoulders', icon: '💪' },
  { value: 'arms', label: 'Arms', icon: '💯' },
  { value: 'core', label: 'Core', icon: '⭐' },
]

export const TYPE_OPTIONS: ReadonlyArray<SelectorOption<ExerciseType>> = [
  {
    value: 'compound',
    label: 'Compound Movement',
    description: 'Complex, multi-joint lifts like Squats/Bench',
  },
  {
    value: 'isolation',
    label: 'Isolation Movement',
    description: 'Single-joint lifts like Curls/Extensions',
  },
  { value: 'stability', label: 'Stability/Core', description: 'Dynamic stability exercises' },
  { value: 'isometric', label: 'Isometric', description: 'Static holds like Planks, Wall Sits' },
  { value: 'cardio', label: 'Cardio', description: 'Running, Jumping Jacks' },
]

export const METRICS_OPTIONS: ReadonlyArray<SelectorOption<Metrics>> = [
  {
    value: 'weight-reps',
    label: 'Weight + Reps',
    description: 'Standard lifting (e.g., 5kg x 10 reps)',
  },
  { value: 'reps-only', label: 'Reps Only', description: 'Bodyweight volume (e.g., 10 reps)' },
  { value: 'duration', label: 'Duration', description: 'Time-based (e.g., Planks for 60 seconds)' },
  {
    value: 'distance-duration',
    label: 'Distance + Duration',
    description: 'Cardio (e.g., 5km in 30 mins)',
  },
  {
    value: 'weight-distance',
    label: 'Weight + Distance',
    description: 'Combined (e.g., Sled Push 100m)',
  },
]
