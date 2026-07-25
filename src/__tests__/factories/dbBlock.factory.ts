import type { DbStrengthBlock, DbSet } from '@/blocks'
import { generateId } from '@/db/generateId'
import { createDbSet as createDatabaseSet } from './dbSet.factory'

const STRENGTH_DEFAULTS: Readonly<Omit<DbStrengthBlock, 'id' | 'sets'>> = {
  kind: 'strength',
  exerciseDefinitionId: null,
  name: 'Bench Press',
  equipment: 'barbell',
  targetReps: 8,
  targetDuration: null,
  targetWeight: null,
  image: null,
  orderIndex: 0,
}

export function createDbStrengthBlock(overrides: Partial<DbStrengthBlock> = {}): DbStrengthBlock {
  return {
    id: generateId(),
    ...STRENGTH_DEFAULTS,
    sets: overrides.sets ?? [createDatabaseSet()],
    ...overrides,
  }
}

export function createDbStrengthBlockWithSets(
  sets: ReadonlyArray<Partial<DbSet>>,
  overrides: Partial<Omit<DbStrengthBlock, 'sets'>> = {},
): DbStrengthBlock {
  return createDbStrengthBlock({
    ...overrides,
    sets: sets.map((s) => createDatabaseSet(s)),
  })
}

// Backward compatible alias
export const createDbExercise = createDbStrengthBlock
export const createDbExerciseWithSets = createDbStrengthBlockWithSets

export { type DbWorkoutBlock, type DbStrengthBlock } from '@/blocks'
