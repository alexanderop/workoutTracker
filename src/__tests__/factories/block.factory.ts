import type { Set } from '@/composables/useWorkout'
import type { StrengthBlock, WorkoutBlock } from '@/types/blocks'
import { createSet, createEmptySet } from './set.factory'

const STRENGTH_DEFAULTS: Readonly<Omit<StrengthBlock, 'sets'>> = {
  kind: 'strength',
  id: 1,
  exerciseDefinitionId: null,
  name: 'Bench Press',
  equipment: 'Barbell',
  targetReps: 8,
  thumbnail: '🏋️',
}

export function createStrengthBlock(overrides: Partial<StrengthBlock> = {}): StrengthBlock {
  return {
    ...STRENGTH_DEFAULTS,
    sets: [createSet(), createEmptySet({ id: 2 }), createEmptySet({ id: 3 })],
    ...overrides,
  }
}

export function createStrengthBlockWithSets(
  sets: ReadonlyArray<Partial<Set>>,
  overrides: Partial<Omit<StrengthBlock, 'sets'>> = {},
): StrengthBlock {
  return createStrengthBlock({
    ...overrides,
    sets: sets.map((s, i) => createSet({ id: i + 1, ...s })),
  })
}

// Re-export for backward compatibility with tests using Exercise terminology
export const createExercise = createStrengthBlock
export const createExerciseWithSets = createStrengthBlockWithSets
export type { StrengthBlock as Exercise, WorkoutBlock }
