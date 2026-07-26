import type { AppIconKey } from '@/components/app-icons'
import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'

export type SelectorOption<T extends string = string> = {
  value: T
  label: string
  /** Bundled artwork key -- see src/components/app-icons. */
  icon?: AppIconKey
  description?: string
}

export const EQUIPMENT_OPTIONS: ReadonlyArray<SelectorOption<Equipment>> = [
  { value: 'barbell', label: 'Barbell', icon: 'equipment-barbell' },
  { value: 'dumbbell', label: 'Dumbbell', icon: 'equipment-dumbbell' },
  { value: 'machine', label: 'Machine', icon: 'equipment-machine' },
  { value: 'cable', label: 'Cable', icon: 'equipment-cable' },
  { value: 'bodyweight', label: 'Bodyweight', icon: 'equipment-bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell', icon: 'equipment-kettlebell' },
  { value: 'band', label: 'Band', icon: 'equipment-band' },
  { value: 'ez-bar', label: 'EZ Bar', icon: 'equipment-ez-bar' },
  { value: 'hex-bar', label: 'Hex Bar', icon: 'equipment-hex-bar' },
  { value: 'egym', label: 'EGYM', icon: 'equipment-egym' },
]

export const MUSCLE_OPTIONS: ReadonlyArray<SelectorOption<Muscle>> = [
  { value: 'chest', label: 'Chest', icon: 'muscle-chest' },
  { value: 'back', label: 'Back', icon: 'muscle-back' },
  { value: 'legs', label: 'Legs', icon: 'muscle-legs' },
  { value: 'shoulders', label: 'Shoulders', icon: 'muscle-shoulders' },
  { value: 'arms', label: 'Arms', icon: 'muscle-arms' },
  { value: 'core', label: 'Core', icon: 'muscle-core' },
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
