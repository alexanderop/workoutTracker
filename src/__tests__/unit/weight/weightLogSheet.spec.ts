import { describe, expect, it } from 'vitest'
import { findEntryForDay } from '@/features/weight/lib/weightLogSheet'
import type { DbWeightEntry } from '@/db/schema'

/**
 * Node-tier spec: pure lookup over a plain array, no DOM, no IndexedDB.
 */

function entry(overrides: Partial<DbWeightEntry> = {}): DbWeightEntry {
  return {
    id: 'entry-1',
    weight: 80,
    date: 1000,
    recordedAt: 1000,
    ...overrides,
  }
}

describe('findEntryForDay', () => {
  it("returns the day's entry", () => {
    const entries = [entry({ id: 'a', date: 1000 }), entry({ id: 'b', date: 2000 })]

    expect(findEntryForDay(entries, 2000)?.id).toBe('b')
  })

  it('returns undefined for an empty day', () => {
    const entries = [entry({ id: 'a', date: 1000 })]

    expect(findEntryForDay(entries, 2000)).toBeUndefined()
  })

  it('picks the highest recordedAt among same-day entries', () => {
    const entries = [
      entry({ id: 'a', date: 1000, recordedAt: 100 }),
      entry({ id: 'b', date: 1000, recordedAt: 300 }),
      entry({ id: 'c', date: 1000, recordedAt: 200 }),
    ]

    expect(findEntryForDay(entries, 1000)?.id).toBe('b')
  })

  it('resolves a recordedAt tie deterministically by descending id', () => {
    const entries = [
      entry({ id: 'aaa', date: 1000, recordedAt: 500 }),
      entry({ id: 'zzz', date: 1000, recordedAt: 500 }),
      entry({ id: 'mmm', date: 1000, recordedAt: 500 }),
    ]

    expect(findEntryForDay(entries, 1000)?.id).toBe('zzz')
  })
})
