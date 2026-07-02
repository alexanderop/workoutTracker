import type { DbCustomExercise } from '@/db/schema'
import { generateId } from '@/db'

const DEFAULTS: Readonly<Omit<DbCustomExercise, 'id' | 'createdAt' | 'updatedAt'>> = {
  name: 'Bench Press',
  equipment: 'barbell',
  muscle: 'chest',
  type: 'compound',
  metrics: 'weight-reps',
  image: null,
}

export function createDbCustomExercise(
  overrides: Partial<DbCustomExercise> = {},
): DbCustomExercise {
  return {
    id: generateId(),
    ...DEFAULTS,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}
