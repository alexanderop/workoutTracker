import type { CustomExercise, Equipment, ExerciseType, Metrics, Muscle } from '@/stores/exercises'
import { faker } from '@faker-js/faker'

const DEFAULTS: Readonly<CustomExercise> = {
  id: 'test-exercise-1',
  icon: '🏋️',
  name: 'Custom Exercise',
  equipment: 'barbell',
  muscle: 'chest',
  type: 'compound',
  metrics: 'weight-reps',
  createdAt: Date.now(),
}

export function createCustomExercise(overrides: Partial<CustomExercise> = {}): CustomExercise {
  return { ...DEFAULTS, ...overrides }
}

export function createRandomCustomExercise(
  overrides: Partial<CustomExercise> = {},
): CustomExercise {
  const equipmentOptions: ReadonlyArray<Equipment> = [
    'barbell',
    'dumbbell',
    'machine',
    'cable',
    'bodyweight',
  ]
  const muscleOptions: ReadonlyArray<Muscle> = [
    'chest',
    'back',
    'legs',
    'shoulders',
    'arms',
    'core',
  ]
  const typeOptions: ReadonlyArray<ExerciseType> = ['compound', 'isolation', 'stability', 'cardio']
  const metricsOptions: ReadonlyArray<Metrics> = [
    'weight-reps',
    'reps-only',
    'duration',
    'distance-duration',
    'weight-distance',
  ]

  return createCustomExercise({
    id: faker.string.uuid(),
    name: faker.lorem.words(2),
    equipment: faker.helpers.arrayElement(equipmentOptions),
    muscle: faker.helpers.arrayElement(muscleOptions),
    type: faker.helpers.arrayElement(typeOptions),
    metrics: faker.helpers.arrayElement(metricsOptions),
    createdAt: faker.date.past().getTime(),
    ...overrides,
  })
}
