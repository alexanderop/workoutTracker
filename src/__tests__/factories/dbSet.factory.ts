import type { DbSet } from '@/db/schema'
import { generateId } from '@/db'

const DEFAULTS: Readonly<Omit<DbSet, 'id' | 'completedAt'>> = {
  kg: '100',
  reps: '8',
  duration: '',
  rir: '2',
  status: 'completed',
}

export function createDbSet(overrides: Partial<DbSet> = {}): DbSet {
  return {
    id: generateId(),
    ...DEFAULTS,
    completedAt: Date.now(),
    ...overrides,
  }
}

export function createDbPlannedSet(overrides: Partial<DbSet> = {}): DbSet {
  return createDbSet({
    status: 'planned',
    completedAt: null,
    ...overrides,
  })
}
