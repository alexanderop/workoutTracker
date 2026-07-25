import { describe, expect, it } from 'vitest'

import { normalizeDbHabit } from '@/db/converters'
import type { StoredDbHabit } from '@/db/schema'

describe('normalizeDbHabit', () => {
  it('adds appearance defaults to a legacy stored habit without mutating it', () => {
    const legacyHabit: StoredDbHabit = {
      id: 'habit-1',
      name: 'Stretch',
      icon: null,
      schedule: { type: 'daily' },
      kind: { type: 'binary' },
      autoLink: null,
      archivedAt: null,
      orderIndex: 0,
      createdAt: 1,
    }

    const normalized = normalizeDbHabit(legacyHabit)

    expect(normalized).toEqual({
      ...legacyHabit,
      description: null,
      accent: 'purple',
    })
    expect(legacyHabit).not.toHaveProperty('description')
    expect(legacyHabit).not.toHaveProperty('accent')
  })

  it('replaces invalid appearance values with defaults', () => {
    const storedHabit: StoredDbHabit = {
      id: 'habit-1',
      name: 'Stretch',
      icon: null,
      description: 42,
      accent: 'orange',
      schedule: { type: 'daily' },
      kind: { type: 'binary' },
      autoLink: null,
      archivedAt: null,
      orderIndex: 0,
      createdAt: 1,
    }

    expect(normalizeDbHabit(storedHabit)).toMatchObject({
      description: null,
      accent: 'purple',
    })
  })
})
