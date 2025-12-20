import type { DbWorkoutExercise, DbSet } from '@/db/schema'
import { generateId } from '@/db'
import { createDbSet } from './dbSet.factory'

const DEFAULTS: Readonly<Omit<DbWorkoutExercise, 'id' | 'sets'>> = {
  exerciseDefinitionId: null,
  name: 'Bench Press',
  equipment: 'Barbell',
  targetReps: 8,
  thumbnail: '🏋️',
  orderIndex: 0,
  pattern: null,
  color: null,
}

export function createDbExercise(overrides: Partial<DbWorkoutExercise> = {}): DbWorkoutExercise {
  return {
    id: generateId(),
    ...DEFAULTS,
    sets: overrides.sets ?? [createDbSet()],
    ...overrides,
  }
}

export function createDbExerciseWithSets(
  sets: ReadonlyArray<Partial<DbSet>>,
  overrides: Partial<Omit<DbWorkoutExercise, 'sets'>> = {},
): DbWorkoutExercise {
  return createDbExercise({
    ...overrides,
    sets: sets.map((s) => createDbSet(s)),
  })
}
