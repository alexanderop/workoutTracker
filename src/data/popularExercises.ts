import { type Equipment, type Muscle, type ExerciseType, type Metrics } from '@/stores/exercises'

export interface PopularExercise {
  name: string
  icon: string
  equipment: Equipment
  muscle: Muscle
  type: ExerciseType
  metrics: Metrics
}

export const popularExercises: PopularExercise[] = [
  {
    name: 'Bench Press',
    icon: '🏋️',
    equipment: 'barbell',
    muscle: 'chest',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Squat',
    icon: '🦵',
    equipment: 'barbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Deadlift',
    icon: '💀',
    equipment: 'barbell',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Overhead Press',
    icon: '⬆️',
    equipment: 'barbell',
    muscle: 'shoulders',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Barbell Row',
    icon: '📦',
    equipment: 'barbell',
    muscle: 'back',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Pull-ups',
    icon: '🤸',
    equipment: 'bodyweight',
    muscle: 'back',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Push-ups',
    icon: '🏃',
    equipment: 'bodyweight',
    muscle: 'chest',
    type: 'compound',
    metrics: 'reps-only',
  },
  {
    name: 'Dumbbell Curl',
    icon: '💪',
    equipment: 'dumbbell',
    muscle: 'arms',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Tricep Extension',
    icon: '💪',
    equipment: 'cable',
    muscle: 'arms',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Lat Pulldown',
    icon: '⬇️',
    equipment: 'cable',
    muscle: 'back',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Leg Press',
    icon: '🦵',
    equipment: 'machine',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
  },
  {
    name: 'Leg Curl',
    icon: '🦵',
    equipment: 'machine',
    muscle: 'legs',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Chest Fly',
    icon: '🏔️',
    equipment: 'dumbbell',
    muscle: 'chest',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Lateral Raise',
    icon: '💪',
    equipment: 'dumbbell',
    muscle: 'shoulders',
    type: 'isolation',
    metrics: 'weight-reps',
  },
  {
    name: 'Plank',
    icon: '⭐',
    equipment: 'bodyweight',
    muscle: 'core',
    type: 'stability',
    metrics: 'duration',
  },
]
