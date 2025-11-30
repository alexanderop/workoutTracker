import type { Exercise, Set } from '@/composables/useWorkout'
import { faker } from '@faker-js/faker'
import { createEmptySet, createSet } from './set.factory'

const DEFAULTS: Readonly<Omit<Exercise, 'sets'>> = {
  id: 1,
  name: 'Bench Press',
  equipment: 'Barbell',
  targetReps: 8,
  thumbnail: '🏋️',
}

export function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    ...DEFAULTS,
    sets: [createSet(), createEmptySet({ id: 2 }), createEmptySet({ id: 3 })],
    ...overrides,
  }
}

export function createExerciseWithSets(
  sets: ReadonlyArray<Partial<Set>>,
  overrides: Partial<Omit<Exercise, 'sets'>> = {},
): Exercise {
  return createExercise({
    ...overrides,
    sets: sets.map((s, i) => createSet({ id: i + 1, ...s })),
  })
}

export function createRandomExercise(overrides: Partial<Exercise> = {}): Exercise {
  const exerciseNames = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row']
  const equipmentTypes = ['Barbell', 'Dumbbell', 'Cable', 'Machine']

  return createExercise({
    name: faker.helpers.arrayElement(exerciseNames),
    equipment: faker.helpers.arrayElement(equipmentTypes),
    targetReps: faker.number.int({ min: 5, max: 15 }),
    ...overrides,
  })
}
