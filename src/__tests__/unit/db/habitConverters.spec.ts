import { describe, expect, it } from 'vitest'

import { normalizeDbHabit } from '@/db/converters'
import type { StoredDbHabit } from '@/db/schema'

function storedHabit(overrides: Partial<StoredDbHabit> = {}): StoredDbHabit {
  return {
    id: 'habit-1',
    name: 'Stretch',
    icon: null,
    schedule: { type: 'daily' },
    kind: { type: 'binary' },
    autoLink: null,
    archivedAt: null,
    orderIndex: 0,
    createdAt: 1,
    ...overrides,
  }
}

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
    expect(normalizeDbHabit(storedHabit({ description: 42, accent: 'orange' }))).toMatchObject({
      description: null,
      accent: 'purple',
    })
  })

  it('maps every emoji the old icon picker offered onto bundled artwork', () => {
    const migrations: ReadonlyArray<readonly [string, string]> = [
      ['💧', 'habit-water'],
      ['🏃', 'habit-run'],
      ['🧘', 'habit-meditate'],
      ['📚', 'habit-read'],
      ['🛌', 'habit-sleep'],
      ['🥗', 'habit-nutrition'],
      ['🏋️', 'habit-strength'],
      ['✍️', 'habit-journal'],
      ['🚭', 'habit-no-smoke'],
      ['🧹', 'habit-clean'],
      ['📌', 'habit-default'],
      ['✅', 'habit-check'],
      ['📊', 'habit-progress'],
    ]

    for (const [emoji, key] of migrations) {
      expect(normalizeDbHabit(storedHabit({ icon: emoji })).icon).toBe(key)
    }
  })

  it('passes bundled keys through untouched', () => {
    expect(normalizeDbHabit(storedHabit({ icon: 'habit-read' })).icon).toBe('habit-read')
  })

  it('keeps an unmapped hand-typed icon rather than destroying it', () => {
    expect(normalizeDbHabit(storedHabit({ icon: '🎯' })).icon).toBe('🎯')
  })

  it('treats blank and non-string icons as absent', () => {
    expect(normalizeDbHabit(storedHabit({ icon: '  ' })).icon).toBeNull()
    expect(normalizeDbHabit(storedHabit({ icon: 42 })).icon).toBeNull()
    expect(normalizeDbHabit(storedHabit({ icon: undefined })).icon).toBeNull()
  })
})
