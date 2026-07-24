import type { DbWorkoutExercise } from '@/db/schema'
import type { DbSet } from '@/blocks'
import { generateId } from '@/db'
import { createDbSet as createDatabaseSet } from './dbSet.factory'

const DEFAULTS: Readonly<Omit<DbWorkoutExercise, 'id' | 'sets'>> = {
  exerciseDefinitionId: null,
  name: 'Bench Press',
  equipment: 'barbell',
  targetReps: 8,
  targetDuration: null,
  targetWeight: null,
  image: null,
  orderIndex: 0,
}

export function createDbExercise(overrides: Partial<DbWorkoutExercise> = {}): DbWorkoutExercise {
  return {
    id: generateId(),
    ...DEFAULTS,
    sets: overrides.sets ?? [createDatabaseSet()],
    ...overrides,
  }
}

export function createDbExerciseWithSets(
  sets: ReadonlyArray<Partial<DbSet>>,
  overrides: Partial<Omit<DbWorkoutExercise, 'sets'>> = {},
): DbWorkoutExercise {
  return createDbExercise({
    ...overrides,
    sets: sets.map((s) => createDatabaseSet(s)),
  })
}
