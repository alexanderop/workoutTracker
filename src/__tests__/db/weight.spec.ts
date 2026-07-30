import { beforeEach, describe, expect, it } from 'vitest'
import { getWeightRepository } from '@/db'
import { db } from '@/db/implementations/dexie/database'
import { resetDatabase } from '@/__tests__/setup'
import { createDbWeightEntryForDate } from '@/__tests__/factories/dbWeightEntry.factory'
import { dbWeightEntrySchema } from '@/features/settings/utils/validation/weightEntrySchema'

/**
 * Repository-level tests for `upsertForDate`, mirroring the same-day dedup
 * conventions established by `HabitRepository.upsertEntry`
 * (src/db/implementations/dexie/habits.ts) but for weight entries, where the
 * "most recent existing row" for a date must be picked with a total-order
 * comparator rather than assumed unique.
 */
describe('WeightRepository.upsertForDate', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('inserts a new entry when the date has no existing entry', async () => {
    const repo = getWeightRepository()
    const entry = createDbWeightEntryForDate(new Date('2026-07-20'), 80)

    await repo.upsertForDate(entry)

    expect(await repo.getAll()).toEqual([entry])
  })

  it('replaces the existing entry for that date in place, keeping its id', async () => {
    const repo = getWeightRepository()
    const day = new Date('2026-07-20')
    const original = createDbWeightEntryForDate(day, 80, { id: 'original-id' })
    await repo.upsertForDate(original)

    const replacement = createDbWeightEntryForDate(day, 82, { id: 'replacement-id' })
    await repo.upsertForDate(replacement)

    const all = await repo.getAll()
    expect(all).toHaveLength(1)
    expect(all[0]?.id).toBe('original-id')
    expect(all[0]?.weight).toBe(82)
  })

  it('round-trips bodyFatPct and also accepts an entry with the field absent', async () => {
    const repo = getWeightRepository()
    const withBodyFat = createDbWeightEntryForDate(new Date('2026-07-20'), 80, {
      bodyFatPct: 18.5,
    })

    await repo.upsertForDate(withBodyFat)

    expect((await repo.getAll())[0]?.bodyFatPct).toBe(18.5)

    const withoutBodyFat = createDbWeightEntryForDate(new Date('2026-07-21'), 81)
    await repo.upsertForDate(withoutBodyFat)

    const secondDayEntry = (await repo.getAll()).find((e) => e.id === withoutBodyFat.id)
    expect(secondDayEntry?.bodyFatPct).toBeUndefined()
  })

  it('updates only the most recently recorded row for a date, leaving older duplicates present', async () => {
    const day = new Date('2026-07-20')
    const older = createDbWeightEntryForDate(day, 79, {
      id: 'older-entry',
      recordedAt: new Date('2026-07-20T08:00:00Z').getTime(),
    })
    const newer = createDbWeightEntryForDate(day, 80, {
      id: 'newer-entry',
      recordedAt: new Date('2026-07-20T18:00:00Z').getTime(),
    })
    await db.weightEntries.add(older)
    await db.weightEntries.add(newer)

    const repo = getWeightRepository()
    const replacement = createDbWeightEntryForDate(day, 85, { id: 'replacement-entry' })
    await repo.upsertForDate(replacement)

    const all = await repo.getAll()
    expect(all).toHaveLength(2)
    expect(all.find((e) => e.id === 'older-entry')?.weight).toBe(79)
    expect(all.find((e) => e.id === 'newer-entry')?.weight).toBe(85)
    expect(all.find((e) => e.id === 'replacement-entry')).toBeUndefined()
  })

  it('reads back an entry stored without bodyFatPct unchanged (backward compatibility)', async () => {
    const legacyEntry = createDbWeightEntryForDate(new Date('2026-07-20'), 80)
    await db.weightEntries.add(legacyEntry)

    const repo = getWeightRepository()

    expect(await repo.getAll()).toEqual([legacyEntry])
  })
})

describe('dbWeightEntrySchema', () => {
  const base = {
    id: 'entry-1',
    weight: 80,
    date: 1_753_920_000_000,
    recordedAt: 1_753_920_000_000,
  }

  it('accepts an entry with bodyFatPct', () => {
    expect(dbWeightEntrySchema.safeParse({ ...base, bodyFatPct: 18.5 }).success).toBe(true)
  })

  it('accepts an entry without bodyFatPct', () => {
    expect(dbWeightEntrySchema.safeParse(base).success).toBe(true)
  })

  it('rejects a bodyFatPct above 100', () => {
    expect(dbWeightEntrySchema.safeParse({ ...base, bodyFatPct: 120 }).success).toBe(false)
  })
})
