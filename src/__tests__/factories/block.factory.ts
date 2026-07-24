import type { Set } from '@/types/workout'
import type { StrengthBlock } from '@/types/blocks'
import { createSet, createEmptySet } from './set.factory'

const STRENGTH_DEFAULTS: Readonly<Omit<StrengthBlock, 'sets'>> = {
  kind: 'strength',
  id: 1,
  exerciseDefinitionId: null,
  name: 'Bench Press',
  equipment: 'barbell',
  targetReps: 8,
  targetDuration: null,
  targetWeight: null,
  image: null,
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
    sets: sets.map((s, index) => createSet({ id: index + 1, ...s })),
  })
}

// Re-export for backward compatibility with tests using Exercise terminology
export const createExercise = createStrengthBlock
export const createExerciseWithSets = createStrengthBlockWithSets

export { type WorkoutBlock, type StrengthBlock as Exercise } from '@/types/blocks'
