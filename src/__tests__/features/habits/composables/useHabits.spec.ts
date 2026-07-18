import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useHabits } from '@/features/habits/composables/useHabits'
import { getHabitsRepository } from '@/db'
import { getStartOfDay } from '@/lib/date'
import { resetDatabase } from '@/__tests__/setup'
import { createDbHabit, createDbHabitEntry } from '@/__tests__/factories'
import type { HabitFormData } from '@/features/habits/composables/useHabits'

/**
 * Direct composable-level tests for `useHabits`, covering paths the UI
 * integration suite (habit-tracking.spec.ts) can't reach: repository error
 * branches (stubbed via `vi.spyOn` on the real repository, mirroring
 * useBenchmarkPersistence.spec.ts's convention), `reorder` (not wired to any
 * UI yet), and edge cases like acting on a habit id that was never loaded
 * into local state.
 */
describe('useHabits', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  function formDataFor(habit: ReturnType<typeof createDbHabit>): HabitFormData {
    return {
      name: habit.name,
      icon: habit.icon,
      schedule: habit.schedule,
      kind: habit.kind,
      autoLink: habit.autoLink,
    }
  }

  describe('createHabit', () => {
    it('returns undefined and leaves local state untouched when the repository throws', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(getHabitsRepository(), 'addHabit').mockRejectedValueOnce(new Error('boom'))
      const { createHabit, habits } = useHabits()

      const result = await createHabit({
        name: 'Read',
        icon: null,
        schedule: { type: 'daily' },
        kind: { type: 'binary' },
        autoLink: null,
      })

      expect(result).toBeUndefined()
      expect(habits.value).toHaveLength(0)
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('editHabit', () => {
    it('updates only the matching habit in local state, leaving others untouched', async () => {
      const repo = getHabitsRepository()
      const a = createDbHabit({ name: 'A', orderIndex: 0 })
      const b = createDbHabit({ name: 'B', orderIndex: 1 })
      await repo.addHabit(a)
      await repo.addHabit(b)
      const { load, editHabit, habits } = useHabits()
      await load()

      const ok = await editHabit(a.id, { ...formDataFor(a), name: 'A renamed' })

      expect(ok).toBe(true)
      expect(habits.value.find((h) => h.id === a.id)?.name).toBe('A renamed')
      expect(habits.value.find((h) => h.id === b.id)?.name).toBe('B')
    })

    it('returns false and leaves local state untouched when the repository throws', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit({ name: 'Original' })
      await repo.addHabit(habit)
      const { load, editHabit, habits } = useHabits()
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(repo, 'updateHabit').mockRejectedValueOnce(new Error('boom'))

      const ok = await editHabit(habit.id, { ...formDataFor(habit), name: 'Renamed' })

      expect(ok).toBe(false)
      expect(habits.value.find((h) => h.id === habit.id)?.name).toBe('Original')
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('archive', () => {
    it('returns false and leaves local state untouched when the repository throws', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)
      const { load, archive, habits, archivedHabits } = useHabits()
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(repo, 'archiveHabit').mockRejectedValueOnce(new Error('boom'))

      const ok = await archive(habit.id)

      expect(ok).toBe(false)
      expect(habits.value).toHaveLength(1)
      expect(archivedHabits.value).toHaveLength(0)
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('succeeds against the repository but is a local no-op for a habit id not in local state', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)
      // Deliberately not calling load(): this composable instance's local
      // `habits` never learned about the habit that already exists in the DB.
      const { archive, archivedHabits } = useHabits()

      const ok = await archive(habit.id)

      expect(ok).toBe(true)
      expect(archivedHabits.value).toHaveLength(0)
      expect((await repo.getHabitById(habit.id))?.archivedAt).not.toBeNull()
    })
  })

  describe('unarchive', () => {
    it('returns false and leaves local state untouched when the repository throws', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)
      await repo.archiveHabit(habit.id)
      const { load, unarchive, habits, archivedHabits } = useHabits()
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(repo, 'unarchiveHabit').mockRejectedValueOnce(new Error('boom'))

      const ok = await unarchive(habit.id)

      expect(ok).toBe(false)
      expect(habits.value).toHaveLength(0)
      expect(archivedHabits.value).toHaveLength(1)
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('succeeds against the repository but is a local no-op for a habit id not in local state', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)
      await repo.archiveHabit(habit.id)
      // Deliberately not calling load(): this instance's `archivedHabits`
      // never learned about the already-archived habit.
      const { unarchive, habits } = useHabits()

      const ok = await unarchive(habit.id)

      expect(ok).toBe(true)
      expect(habits.value).toHaveLength(0)
      expect((await repo.getHabitById(habit.id))?.archivedAt).toBeNull()
    })
  })

  describe('reorder', () => {
    it('reassigns local orderIndex to match the given id order', async () => {
      const repo = getHabitsRepository()
      const a = createDbHabit({ name: 'A', orderIndex: 0 })
      const b = createDbHabit({ name: 'B', orderIndex: 1 })
      await repo.addHabit(a)
      await repo.addHabit(b)
      const { load, reorder, habits } = useHabits()
      await load()

      const ok = await reorder([b.id, a.id])

      expect(ok).toBe(true)
      expect(habits.value.map((h) => h.id)).toEqual([b.id, a.id])
      expect(habits.value.map((h) => h.orderIndex)).toEqual([0, 1])
    })

    it('drops ids that are not in local state rather than inserting a placeholder', async () => {
      const repo = getHabitsRepository()
      const a = createDbHabit({ name: 'A', orderIndex: 0 })
      await repo.addHabit(a)
      const { load, reorder, habits } = useHabits()
      await load()

      const ok = await reorder(['unknown-id', a.id])

      expect(ok).toBe(true)
      expect(habits.value.map((h) => h.id)).toEqual([a.id])
    })

    it('returns false and leaves local state untouched when the repository throws', async () => {
      const repo = getHabitsRepository()
      const a = createDbHabit({ name: 'A', orderIndex: 0 })
      const b = createDbHabit({ name: 'B', orderIndex: 1 })
      await repo.addHabit(a)
      await repo.addHabit(b)
      const { load, reorder, habits } = useHabits()
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(repo, 'reorderHabits').mockRejectedValueOnce(new Error('boom'))

      const ok = await reorder([b.id, a.id])

      expect(ok).toBe(false)
      expect(habits.value.map((h) => h.id)).toEqual([a.id, b.id])
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('toggleToday', () => {
    it('jumps straight to the target when toggling a quantity habit on', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit({ kind: { type: 'quantity', target: 8, unit: 'glasses' } })
      await repo.addHabit(habit)
      const { load, toggleToday, entriesFor } = useHabits()
      await load()

      const ok = await toggleToday(habit)

      expect(ok).toBe(true)
      expect(entriesFor(habit.id)[0]?.value).toBe(8)
    })

    it('initializes per-habit entry state on first write even without a prior load() for it', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)
      // No load() call: entriesByHabit has no map entry for this habit yet.
      const { toggleToday, entriesFor } = useHabits()

      const ok = await toggleToday(habit)

      expect(ok).toBe(true)
      expect(entriesFor(habit.id)).toHaveLength(1)
    })

    it('returns false and logs when saving the entry throws', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)
      const { load, toggleToday, entriesFor } = useHabits()
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(repo, 'upsertEntry').mockRejectedValueOnce(new Error('boom'))

      const ok = await toggleToday(habit)

      expect(ok).toBe(false)
      expect(entriesFor(habit.id)).toHaveLength(0)
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('returns false and logs when clearing an already-complete entry throws', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)
      await repo.upsertEntry(
        createDbHabitEntry({ habitId: habit.id, date: getStartOfDay(), value: 1 }),
      )
      const { load, toggleToday, entriesFor } = useHabits()
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(repo, 'clearEntryForDay').mockRejectedValueOnce(new Error('boom'))

      const ok = await toggleToday(habit) // already complete -> tries to clear -> throws
      expect(ok).toBe(false)
      expect(entriesFor(habit.id)).toHaveLength(1) // local state left as-is
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('toggleDay', () => {
    it('retro-toggles a complete day back to incomplete', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit()
      await repo.addHabit(habit)
      const day = getStartOfDay(new Date('2026-01-01'))
      await repo.upsertEntry(createDbHabitEntry({ habitId: habit.id, date: day, value: 1 }))
      const { load, toggleDay, entriesFor } = useHabits()
      await load()

      const ok = await toggleDay(habit, day)

      expect(ok).toBe(true)
      expect(entriesFor(habit.id).find((entry) => entry.date === day)).toBeUndefined()
    })

    it('retro-toggles a quantity habit day on straight to its target', async () => {
      const repo = getHabitsRepository()
      const habit = createDbHabit({ kind: { type: 'quantity', target: 5, unit: 'x' } })
      await repo.addHabit(habit)
      const day = getStartOfDay(new Date('2026-01-01'))
      const { load, toggleDay, entriesFor } = useHabits()
      await load()

      const ok = await toggleDay(habit, day)

      expect(ok).toBe(true)
      expect(entriesFor(habit.id).find((entry) => entry.date === day)?.value).toBe(5)
    })
  })
})
