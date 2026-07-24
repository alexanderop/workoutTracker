import type { DbSet } from '@/blocks'
import { generateId } from '@/db'

const DEFAULTS: Readonly<Omit<DbSet, 'id'>> = {
  kg: '100',
  reps: '8',
  duration: '',
  rir: '2',
  status: 'completed',
  completedAt: Date.now(),
}

export function createDbSet(overrides: Partial<DbSet> = {}): DbSet {
  return {
    id: generateId(),
    ...DEFAULTS,
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
