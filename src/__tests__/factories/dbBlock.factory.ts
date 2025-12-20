import type { DbStrengthBlock, DbSet, DbWorkoutBlock } from '@/db/schema'
import { generateId } from '@/db'
import { createDbSet } from './dbSet.factory'

const STRENGTH_DEFAULTS: Readonly<Omit<DbStrengthBlock, 'id' | 'sets'>> = {
  kind: 'strength',
  exerciseDefinitionId: null,
  name: 'Bench Press',
  equipment: 'Barbell',
  targetReps: 8,
  thumbnail: '🏋️',
  orderIndex: 0,
  pattern: null,
  color: null,
}

export function createDbStrengthBlock(overrides: Partial<DbStrengthBlock> = {}): DbStrengthBlock {
  return {
    id: generateId(),
    ...STRENGTH_DEFAULTS,
    sets: overrides.sets ?? [createDbSet()],
    ...overrides,
  }
}

export function createDbStrengthBlockWithSets(
  sets: ReadonlyArray<Partial<DbSet>>,
  overrides: Partial<Omit<DbStrengthBlock, 'sets'>> = {},
): DbStrengthBlock {
  return createDbStrengthBlock({
    ...overrides,
    sets: sets.map((s) => createDbSet(s)),
  })
}

// Backward compatible alias
export const createDbExercise = createDbStrengthBlock
export const createDbExerciseWithSets = createDbStrengthBlockWithSets
export type { DbStrengthBlock, DbWorkoutBlock }
