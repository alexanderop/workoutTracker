import type { Set } from '@/types/workout'
import { faker } from '@faker-js/faker'

const DEFAULTS: Readonly<Set> = {
  id: 1,
  kg: '100',
  reps: '8',
  duration: '',
  rir: '2',
  status: 'active',
}

export function createSet(overrides: Partial<Set> = {}): Set {
  return { ...DEFAULTS, ...overrides }
}

export function createEmptySet(overrides: Partial<Set> = {}): Set {
  return createSet({ kg: '', reps: '', duration: '', rir: '', status: 'planned', ...overrides })
}

export function createCompletedSet(overrides: Partial<Set> = {}): Set {
  return createSet({ status: 'completed', ...overrides })
}

export function createRandomSet(overrides: Partial<Set> = {}): Set {
  return createSet({
    kg: String(faker.number.int({ min: 20, max: 200 })),
    reps: String(faker.number.int({ min: 1, max: 20 })),
    rir: String(faker.number.int({ min: 0, max: 5 })),
    ...overrides,
  })
}
