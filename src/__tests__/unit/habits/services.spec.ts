/**
 * Node-tier spec for the habits pilot (C2, C5 in effect-style-di.md).
 *
 * This spec deliberately imports only `services.ts` (Tags) and the fake
 * repository — never `services.live.ts`, which reaches `@/db` and would
 * crash the Node `unit` tier (no `indexedDB` global). The fact that this
 * file runs at all under `pnpm exec vitest run --project=unit` is itself the
 * proof that `services.ts` and `@/__tests__/fakes/habitRepository` stay
 * `@/db`-free; `pnpm test:arch` (unitTierImports.test.ts) additionally
 * proves it by walking the import graph.
 */
import { describe, expect, it } from 'vitest'
import type { DbHabit } from '@/db/schema'
import { make } from '@/lib/di/context'
import { HabitRepo } from '@/features/habits/services'
import { createFakeHabitRepository } from '@/__tests__/fakes/habitRepository'
import { createDbHabit as habit, createDbHabitEntry as entry } from '@/__tests__/factories'

describe('habits services', () => {
  describe('HabitRepo', () => {
    it('resolves the fake repository through a context', async () => {
      const fake = createFakeHabitRepository()
      const ctx = make(HabitRepo, fake)

      const resolved = ctx.get(HabitRepo)

      expect(await resolved.getAllHabits()).toEqual([])
    })
  })

  describe('getAllHabits', () => {
    it('returns only active habits ordered by orderIndex', async () => {
      const a = habit({ id: 'a', orderIndex: 1 })
      const b = habit({ id: 'b', orderIndex: 0 })
      const archived = habit({ id: 'archived', orderIndex: -1, archivedAt: 1 })
      const repo = createFakeHabitRepository({ habits: [a, b, archived] })

      const result = await repo.getAllHabits()

      expect(result.map((h) => h.id)).toEqual(['b', 'a'])
    })
  })

  describe('getArchivedHabits', () => {
    it('returns only archived habits, most recently archived first', async () => {
      const earlier = habit({ id: 'earlier', archivedAt: 10 })
      const later = habit({ id: 'later', archivedAt: 20 })
      const active = habit({ id: 'active', archivedAt: null })
      const repo = createFakeHabitRepository({ habits: [earlier, later, active] })

      const result = await repo.getArchivedHabits()

      expect(result.map((h) => h.id)).toEqual(['later', 'earlier'])
    })
  })

  describe('getHabitById', () => {
    it('returns undefined for an unknown id', async () => {
      const repo = createFakeHabitRepository()

      expect(await repo.getHabitById('missing')).toBeUndefined()
    })

    it('finds an archived habit as well as an active one', async () => {
      const archived = habit({ id: 'archived', archivedAt: 1 })
      const repo = createFakeHabitRepository({ habits: [archived] })

      expect((await repo.getHabitById('archived'))?.id).toBe('archived')
    })
  })

  describe('addHabit', () => {
    it('makes the habit retrievable via getAllHabits', async () => {
      const repo = createFakeHabitRepository()

      await repo.addHabit(habit({ id: 'new' }))

      expect((await repo.getAllHabits()).map((h) => h.id)).toEqual(['new'])
    })
  })

  describe('updateHabit', () => {
    it('rejects with an Error for an unknown id', async () => {
      const repo = createFakeHabitRepository()

      await expect(repo.updateHabit('missing', { name: 'x' })).rejects.toThrow()
    })

    it('applies the given updates to the matching habit', async () => {
      const repo = createFakeHabitRepository({ habits: [habit({ id: 'a', name: 'Old' })] })

      await repo.updateHabit('a', { name: 'New' })

      expect((await repo.getHabitById('a'))?.name).toBe('New')
    })
  })

  describe('archiveHabit', () => {
    it('rejects with an Error for an unknown id', async () => {
      const repo = createFakeHabitRepository()

      await expect(repo.archiveHabit('missing')).rejects.toThrow()
    })

    it('sets archivedAt on the matching habit', async () => {
      const repo = createFakeHabitRepository({ habits: [habit({ id: 'a', archivedAt: null })] })

      await repo.archiveHabit('a')

      expect((await repo.getHabitById('a'))?.archivedAt).not.toBeNull()
    })
  })

  describe('unarchiveHabit', () => {
    it('rejects with an Error for an unknown id', async () => {
      const repo = createFakeHabitRepository()

      await expect(repo.unarchiveHabit('missing')).rejects.toThrow()
    })

    it('clears archivedAt on the matching habit', async () => {
      const repo = createFakeHabitRepository({ habits: [habit({ id: 'a', archivedAt: 5 })] })

      await repo.unarchiveHabit('a')

      expect((await repo.getHabitById('a'))?.archivedAt).toBeNull()
    })
  })

  describe('reorderHabits', () => {
    it('reassigns orderIndex to match array position, skipping unknown ids', async () => {
      const a = habit({ id: 'a', orderIndex: 0 })
      const b = habit({ id: 'b', orderIndex: 1 })
      const repo = createFakeHabitRepository({ habits: [a, b] })

      await repo.reorderHabits(['unknown', 'b', 'a'])

      const all = await repo.getAllHabits()
      expect(all.map((h) => h.id)).toEqual(['b', 'a'])
      expect(all.map((h) => h.orderIndex)).toEqual([0, 1])
    })
  })

  describe('upsertEntry', () => {
    it('replaces an existing entry for the same habit and day rather than appending', async () => {
      const repo = createFakeHabitRepository({
        entries: [entry({ id: 'first', habitId: 'a', date: 100, value: 1 })],
      })

      await repo.upsertEntry(entry({ id: 'second', habitId: 'a', date: 100, value: 5 }))

      const result = await repo.getEntriesForHabit('a')
      expect(result).toHaveLength(1)
      expect(result[0]?.value).toBe(5)
    })
  })

  describe('deleteEntry', () => {
    it('removes the matching entry', async () => {
      const repo = createFakeHabitRepository({
        entries: [entry({ id: 'e1', habitId: 'a', date: 100 })],
      })

      await repo.deleteEntry('e1')

      expect(await repo.getEntriesForHabit('a')).toEqual([])
    })

    it('silently succeeds for an unknown id', async () => {
      const repo = createFakeHabitRepository()

      await expect(repo.deleteEntry('missing')).resolves.toBeUndefined()
    })
  })

  describe('clearEntryForDay', () => {
    it('removes that day entry if present', async () => {
      const repo = createFakeHabitRepository({
        entries: [entry({ id: 'e1', habitId: 'a', date: 100 })],
      })

      await repo.clearEntryForDay('a', 100)

      expect(await repo.getEntriesForHabit('a')).toEqual([])
    })
  })

  describe('getEntriesForHabit', () => {
    it('returns entries for the habit, oldest first', async () => {
      const repo = createFakeHabitRepository({
        entries: [
          entry({ id: 'late', habitId: 'a', date: 200 }),
          entry({ id: 'early', habitId: 'a', date: 100 }),
        ],
      })

      const result = await repo.getEntriesForHabit('a')

      expect(result.map((e) => e.id)).toEqual(['early', 'late'])
    })
  })

  describe('getEntriesInRange', () => {
    it('returns entries within the inclusive range, oldest first', async () => {
      const repo = createFakeHabitRepository({
        entries: [
          entry({ id: 'before', habitId: 'a', date: 50 }),
          entry({ id: 'boundary-start', habitId: 'a', date: 100 }),
          entry({ id: 'middle', habitId: 'a', date: 150 }),
          entry({ id: 'boundary-end', habitId: 'a', date: 200 }),
          entry({ id: 'after', habitId: 'a', date: 250 }),
        ],
      })

      const result = await repo.getEntriesInRange(100, 200)

      expect(result.map((e) => e.id)).toEqual(['boundary-start', 'middle', 'boundary-end'])
    })
  })

  describe('getEntriesForDay', () => {
    it('returns every habit entry recorded for that day', async () => {
      const repo = createFakeHabitRepository({
        entries: [
          entry({ id: 'a-day', habitId: 'a', date: 100 }),
          entry({ id: 'b-day', habitId: 'b', date: 100 }),
          entry({ id: 'other-day', habitId: 'a', date: 200 }),
        ],
      })

      const result = await repo.getEntriesForDay(100)

      expect(result.map((e) => e.id).toSorted()).toEqual(['a-day', 'b-day'])
    })
  })

  describe('observeAll', () => {
    it('fires subscribe() with the current snapshot immediately', async () => {
      const repo = createFakeHabitRepository({ habits: [habit({ id: 'a' })] })

      const received: Array<{ habits: ReadonlyArray<DbHabit> }> = []
      repo.observeAll().subscribe((snapshot) => received.push(snapshot))

      expect(received).toHaveLength(1)
      expect(received[0]?.habits.map((h) => h.id)).toEqual(['a'])
    })
  })
})
