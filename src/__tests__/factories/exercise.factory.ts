// Re-export from block.factory for backward compatibility
// Tests using Exercise terminology will continue to work
export {
  createStrengthBlock as createExercise,
  createStrengthBlockWithSets as createExerciseWithSets,
} from './block.factory'

import type { StrengthBlock } from '@/blocks'
import type { Equipment } from '@/types/exercises'
import { faker } from '@faker-js/faker'
import { createStrengthBlock } from './block.factory'

export function createRandomExercise(overrides: Partial<StrengthBlock> = {}): StrengthBlock {
  const exerciseNames = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row']
  const equipmentTypes: Array<Equipment> = ['barbell', 'dumbbell', 'cable', 'machine']

  return createStrengthBlock({
    name: faker.helpers.arrayElement(exerciseNames),
    equipment: faker.helpers.arrayElement(equipmentTypes),
    targetReps: faker.number.int({ min: 5, max: 15 }),
    ...overrides,
  })
}

// Re-export the type for backward compatibility
export type { StrengthBlock as Exercise } from '@/blocks'
