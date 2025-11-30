import type { Workout } from '@/composables/useWorkout'
import { createExercise } from './exercise.factory'

const DEFAULTS: Readonly<Omit<Workout, 'exercises'>> = {
  id: 1,
  name: 'Test Workout',
  selectedExerciseId: 1,
}

export function createWorkout(overrides: Partial<Workout> = {}): Workout {
  const exercises = overrides.exercises ?? [createExercise()]
  return {
    ...DEFAULTS,
    exercises,
    selectedExerciseId: overrides.selectedExerciseId ?? exercises[0]?.id ?? 0,
    ...overrides,
  }
}
