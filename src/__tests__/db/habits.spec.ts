import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getHabitsRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'
import { createDbHabit, createDbHabitEntry, createDbHabitEntryForDate } from '@/__tests__/factories'

/**
 * Repository-level tests for habits and habit entries, mirroring the
 * dedup/archive-vs-delete conventions established by the weight repository
 * (src/db/implementations/dexie/weight.ts) and other CRUD repos.
 */
describe('HabitRepository', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('addHabit / getAllHabits / getHabitById', () => {
    it('should return an added habit from getAllHabits and getHabitById', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit({ name: 'Stretch' })

      await repo.addHabit(habit)

      const all = await repo.getAllHabits()
      expect(all).toEqual([habit])
      expect(await repo.getHabitById(habit.id)).toEqual(habit)
    })

    it('should order active habits by orderIndex ascending', async () => {
      const repo = getHabitsRepository()
      const third = createDbHabit({ name: 'Third', orderIndex: 2 })
      const first = createDbHabit({ name: 'First', orderIndex: 0 })
      const second = createDbHabit({ name: 'Second', orderIndex: 1 })

      await repo.addHabit(third)
      await repo.addHabit(first)
      await repo.addHabit(second)

      const all = await repo.getAllHabits()
      expect(all.map((h) => h.name)).toEqual(['First', 'Second', 'Third'])
    })

    it('should not include archived habits in getAllHabits', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit({ name: 'Meditate' })
      await repo.addHabit(habit)

      await repo.archiveHabit(habit.id)

      expect(await repo.getAllHabits()).toEqual([])
    })
  })

  describe('updateHabit', () => {
    it('should apply a partial update without touching other fields', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit({ name: 'Read', icon: null })
      await repo.addHabit(habit)

      await repo.updateHabit(habit.id, { name: 'Read daily', icon: '📚' })

      const updated = await repo.getHabitById(habit.id)
      expect(updated?.name).toBe('Read daily')
      expect(updated?.icon).toBe('📚')
      expect(updated?.kind).toEqual(habit.kind)
    })

    it('should throw when updating a habit that does not exist', async () => {
      const repo = getHabitsRepository()
      await expect(repo.updateHabit('missing-id', { name: 'x' })).rejects.toThrow()
    })
  })

  describe('archiveHabit / unarchiveHabit', () => {
    it('should move a habit from active to archived and back', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit({ name: 'Journal' })
      await repo.addHabit(habit)

      await repo.archiveHabit(habit.id)
      expect(await repo.getAllHabits()).toEqual([])
      const archived = await repo.getArchivedHabits()
      expect(archived).toHaveLength(1)
      expect(archived[0]?.archivedAt).not.toBeNull()

      await repo.unarchiveHabit(habit.id)
      expect(await repo.getAllHabits()).toEqual([{ ...habit, archivedAt: null }])
      expect(await repo.getArchivedHabits()).toEqual([])
    })

    it('should preserve entry history when a habit is archived (archive, not delete)', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit({ name: 'Walk' })
      await repo.addHabit(habit)
      const entry = createDbHabitEntryForDate(habit.id, new Date('2026-01-01'))
      await repo.upsertEntry(entry)

      await repo.archiveHabit(habit.id)

      const entries = await repo.getEntriesForHabit(habit.id)
      expect(entries).toEqual([entry])
    })

    it('should throw when archiving or unarchiving a habit that does not exist', async () => {
      const repo = getHabitsRepository()
      await expect(repo.archiveHabit('missing-id')).rejects.toThrow()
      await expect(repo.unarchiveHabit('missing-id')).rejects.toThrow()
    })

    it('should order archived habits by archivedAt descending (most recently archived first)', async () => {
      const repo = getHabitsRepository()
      const older = createDbHabit({ name: 'Older' })
      const newer = createDbHabit({ name: 'Newer' })
      await repo.addHabit(older)
      await repo.addHabit(newer)

      // archiveHabit stamps `archivedAt` with Date.now() -- pin the clock so
      // the two archives land on distinct timestamps regardless of how fast
      // this test executes, keeping the ordering assertion deterministic.
      vi.useFakeTimers()
      try {
        vi.setSystemTime(1000)
        await repo.archiveHabit(older.id)
        vi.setSystemTime(2000)
        await repo.archiveHabit(newer.id)
      } finally {
        vi.useRealTimers()
      }

      const archived = await repo.getArchivedHabits()
      expect(archived.map((h) => h.name)).toEqual(['Newer', 'Older'])
    })
  })

  describe('reorderHabits', () => {
    it('should reassign orderIndex to match the given array order', async () => {
      const repo = getHabitsRepository()
      const a = createDbHabit({ name: 'A', orderIndex: 0 })
      const b = createDbHabit({ name: 'B', orderIndex: 1 })
      const c = createDbHabit({ name: 'C', orderIndex: 2 })
      await repo.addHabit(a)
      await repo.addHabit(b)
      await repo.addHabit(c)

      await repo.reorderHabits([c.id, a.id, b.id])

      const all = await repo.getAllHabits()
      expect(all.map((h) => h.name)).toEqual(['C', 'A', 'B'])
    })
  })

  describe('upsertEntry (one entry per habit per day)', () => {
    it('should replace an existing entry for the same habit and day rather than duplicating it', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit({ kind: { type: 'quantity', target: 8, unit: 'glasses' } })
      await repo.addHabit(habit)
      const day = new Date('2026-02-10')

      const firstEntry = createDbHabitEntryForDate(habit.id, day, { value: 3 })
      await repo.upsertEntry(firstEntry)
      const secondEntry = createDbHabitEntryForDate(habit.id, day, {
        id: 'entry-2',
        value: 8,
      })
      await repo.upsertEntry(secondEntry)

      const entries = await repo.getEntriesForHabit(habit.id)
      expect(entries).toHaveLength(1)
      expect(entries[0]?.value).toBe(8)
    })

    it('should keep entries for different days separate', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)

      await repo.upsertEntry(createDbHabitEntryForDate(habit.id, new Date('2026-02-10')))
      await repo.upsertEntry(createDbHabitEntryForDate(habit.id, new Date('2026-02-11')))

      expect(await repo.getEntriesForHabit(habit.id)).toHaveLength(2)
    })

    it('should keep entries for different habits on the same day separate', async () => {
      const repo = getHabitsRepository()
      const habitA = createDbHabit({ name: 'A' })
      const habitB = createDbHabit({ name: 'B' })
      await repo.addHabit(habitA)
      await repo.addHabit(habitB)
      const day = new Date('2026-02-10')
      const entryA = createDbHabitEntryForDate(habitA.id, day)
      const entryB = createDbHabitEntryForDate(habitB.id, day)

      await repo.upsertEntry(entryA)
      await repo.upsertEntry(entryB)

      expect(await repo.getEntriesForHabit(habitA.id)).toHaveLength(1)
      expect(await repo.getEntriesForHabit(habitB.id)).toHaveLength(1)
      expect(await repo.getEntriesForDay(entryA.date)).toHaveLength(2)
    })
  })

  describe('deleteEntry / clearEntryForDay', () => {
    it('should remove an entry by id', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)
      const entry = createDbHabitEntry({ habitId: habit.id })
      await repo.upsertEntry(entry)

      await repo.deleteEntry(entry.id)

      expect(await repo.getEntriesForHabit(habit.id)).toEqual([])
    })

    it('should no-op deleting an entry that does not exist', async () => {
      const repo = getHabitsRepository()
      await expect(repo.deleteEntry('missing-id')).resolves.toBeUndefined()
    })

    it('should clear a habit entry for a specific day', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)
      const day = new Date('2026-03-01')
      const entry = createDbHabitEntryForDate(habit.id, day)
      await repo.upsertEntry(entry)

      await repo.clearEntryForDay(habit.id, entry.date)

      expect(await repo.getEntriesForHabit(habit.id)).toEqual([])
    })

    it('should no-op clearing a day that has no entry', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)

      await expect(repo.clearEntryForDay(habit.id, Date.now())).resolves.toBeUndefined()
    })
  })

  describe('range queries', () => {
    it('should return entries within an inclusive date range, oldest first', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)

      const jan1 = createDbHabitEntryForDate(habit.id, new Date('2026-01-01'))
      const jan5 = createDbHabitEntryForDate(habit.id, new Date('2026-01-05'))
      const jan10 = createDbHabitEntryForDate(habit.id, new Date('2026-01-10'))
      await repo.upsertEntry(jan1)
      await repo.upsertEntry(jan5)
      await repo.upsertEntry(jan10)

      const inRange = await repo.getEntriesInRange(jan1.date, jan5.date)

      expect(inRange).toEqual([jan1, jan5])
    })

    it('should return every habit entry recorded for a given day', async () => {
      const repo = getHabitsRepository()
      const habitA = createDbHabit({ name: 'A' })
      const habitB = createDbHabit({ name: 'B' })
      await repo.addHabit(habitA)
      await repo.addHabit(habitB)
      const day = new Date('2026-04-01')

      const entryA = createDbHabitEntryForDate(habitA.id, day)
      const entryB = createDbHabitEntryForDate(habitB.id, day)
      await repo.upsertEntry(entryA)
      await repo.upsertEntry(entryB)
      // A different day should not show up.
      await repo.upsertEntry(createDbHabitEntryForDate(habitA.id, new Date('2026-04-02')))

      const forDay = await repo.getEntriesForDay(entryA.date)

      expect(forDay).toHaveLength(2)
      expect(forDay.map((e) => e.habitId).toSorted()).toEqual([habitA.id, habitB.id].toSorted())
    })
  })
})
