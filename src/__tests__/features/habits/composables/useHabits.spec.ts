import { describe, it, expect, vi } from 'vitest'
import { useHabits } from '@/features/habits/composables/useHabits'
import { HabitRepo } from '@/features/habits/services'
import { empty } from '@/lib/di/context'
import { Clock } from '@/lib/clock'
import { testClock } from '@/__tests__/fakes/clock'
import { getStartOfDay } from '@/lib/date'
import { createFakeHabitRepository } from '@/__tests__/fakes/habitRepository'
import { createDbHabit, createDbHabitEntry } from '@/__tests__/factories'
import type { HabitRepository } from '@/db/interfaces'
import type { Context } from '@/lib/di/context'
import type { HabitFormData } from '@/features/habits/composables/useHabits'

function formDataFor(habit: ReturnType<typeof createDbHabit>): HabitFormData {
  return {
    name: habit.name,
    icon: habit.icon,
    schedule: habit.schedule,
    kind: habit.kind,
    autoLink: habit.autoLink,
  }
}

/** A repository method that always rejects — the "the repository throws" arm. */
const rejects = () => Promise.reject(new Error('boom'))

/**
 * A `Context` providing `repo`, with `failing` methods overridden to reject.
 * Mirrors Effect's Layer-override pattern: build the working service, then
 * replace exactly the one method under test.
 */
function contextFor(
  repo: HabitRepository,
  failing: Partial<HabitRepository> = {},
): Context<HabitRepository> {
  return empty().add(HabitRepo, { ...repo, ...failing })
}

/**
 * Direct composable-level tests for `useHabits`, covering paths the UI
 * integration suite (habit-tracking.spec.ts) can't reach: repository error
 * branches (an in-memory fake with one method overridden to reject, injected
 * via `Context`, mirroring Effect's Layer-override pattern), `reorder` (not
 * wired to any UI yet), and edge cases like acting on a habit id that was
 * never loaded into local state.
 */
describe('useHabits', () => {
  describe('createHabit', () => {
    it('returns undefined and leaves local state untouched when the repository throws', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const ctx = contextFor(createFakeHabitRepository(), { addHabit: rejects })
      const { createHabit, habits } = useHabits(ctx)

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
      const a = createDbHabit({ name: 'A', orderIndex: 0 })
      const b = createDbHabit({ name: 'B', orderIndex: 1 })
      const repo = createFakeHabitRepository({ habits: [a, b] })
      const { load, editHabit, habits } = useHabits(contextFor(repo))
      await load()

      const ok = await editHabit(a.id, { ...formDataFor(a), name: 'A renamed' })

      expect(ok).toBe(true)
      expect(habits.value.find((h) => h.id === a.id)?.name).toBe('A renamed')
      expect(habits.value.find((h) => h.id === b.id)?.name).toBe('B')
    })

    it('returns false and leaves local state untouched when the repository throws', async () => {
      const habit = createDbHabit({ name: 'Original' })
      const repo = createFakeHabitRepository({ habits: [habit] })
      const { load, editHabit, habits } = useHabits(contextFor(repo, { updateHabit: rejects }))
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const ok = await editHabit(habit.id, { ...formDataFor(habit), name: 'Renamed' })

      expect(ok).toBe(false)
      expect(habits.value.find((h) => h.id === habit.id)?.name).toBe('Original')
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('archive', () => {
    it('returns false and leaves local state untouched when the repository throws', async () => {
      const habit = createDbHabit()
      const repo = createFakeHabitRepository({ habits: [habit] })
      const { load, archive, habits, archivedHabits } = useHabits(
        contextFor(repo, { archiveHabit: rejects }),
      )
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const ok = await archive(habit.id)

      expect(ok).toBe(false)
      expect(habits.value).toHaveLength(1)
      expect(archivedHabits.value).toHaveLength(0)
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('succeeds against the repository but is a local no-op for a habit id not in local state', async () => {
      const habit = createDbHabit()
      const repo = createFakeHabitRepository({ habits: [habit] })
      // Deliberately not calling load(): this composable instance's local
      // `habits` never learned about the habit that already exists in the
      // fake repository.
      const { archive, archivedHabits } = useHabits(contextFor(repo))

      const ok = await archive(habit.id)

      expect(ok).toBe(true)
      expect(archivedHabits.value).toHaveLength(0)
      expect((await repo.getHabitById(habit.id))?.archivedAt).not.toBeNull()
    })
  })

  describe('unarchive', () => {
    it('returns false and leaves local state untouched when the repository throws', async () => {
      const habit = createDbHabit()
      const repo = createFakeHabitRepository({ habits: [habit] })
      await repo.archiveHabit(habit.id)
      const { load, unarchive, habits, archivedHabits } = useHabits(
        contextFor(repo, { unarchiveHabit: rejects }),
      )
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const ok = await unarchive(habit.id)

      expect(ok).toBe(false)
      expect(habits.value).toHaveLength(0)
      expect(archivedHabits.value).toHaveLength(1)
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('succeeds against the repository but is a local no-op for a habit id not in local state', async () => {
      const habit = createDbHabit()
      const repo = createFakeHabitRepository({ habits: [habit] })
      await repo.archiveHabit(habit.id)
      // Deliberately not calling load(): this instance's `archivedHabits`
      // never learned about the already-archived habit.
      const { unarchive, habits } = useHabits(contextFor(repo))

      const ok = await unarchive(habit.id)

      expect(ok).toBe(true)
      expect(habits.value).toHaveLength(0)
      expect((await repo.getHabitById(habit.id))?.archivedAt).toBeNull()
    })
  })

  describe('reorder', () => {
    it('reassigns local orderIndex to match the given id order', async () => {
      const a = createDbHabit({ name: 'A', orderIndex: 0 })
      const b = createDbHabit({ name: 'B', orderIndex: 1 })
      const repo = createFakeHabitRepository({ habits: [a, b] })
      const { load, reorder, habits } = useHabits(contextFor(repo))
      await load()

      const ok = await reorder([b.id, a.id])

      expect(ok).toBe(true)
      expect(habits.value.map((h) => h.id)).toEqual([b.id, a.id])
      expect(habits.value.map((h) => h.orderIndex)).toEqual([0, 1])
    })

    it('drops ids that are not in local state rather than inserting a placeholder', async () => {
      const a = createDbHabit({ name: 'A', orderIndex: 0 })
      const repo = createFakeHabitRepository({ habits: [a] })
      const { load, reorder, habits } = useHabits(contextFor(repo))
      await load()

      const ok = await reorder(['unknown-id', a.id])

      expect(ok).toBe(true)
      expect(habits.value.map((h) => h.id)).toEqual([a.id])
    })

    it('returns false and leaves local state untouched when the repository throws', async () => {
      const a = createDbHabit({ name: 'A', orderIndex: 0 })
      const b = createDbHabit({ name: 'B', orderIndex: 1 })
      const repo = createFakeHabitRepository({ habits: [a, b] })
      const { load, reorder, habits } = useHabits(contextFor(repo, { reorderHabits: rejects }))
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const ok = await reorder([b.id, a.id])

      expect(ok).toBe(false)
      expect(habits.value.map((h) => h.id)).toEqual([a.id, b.id])
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('toggleToday', () => {
    it('jumps straight to the target when toggling a quantity habit on', async () => {
      const habit = createDbHabit({ kind: { type: 'quantity', target: 8, unit: 'glasses' } })
      const repo = createFakeHabitRepository({ habits: [habit] })
      const { load, toggleToday, entriesFor } = useHabits(contextFor(repo))
      await load()

      const ok = await toggleToday(habit)

      expect(ok).toBe(true)
      expect(entriesFor(habit.id)[0]?.value).toBe(8)
    })

    it('initializes per-habit entry state on first write even without a prior load() for it', async () => {
      const habit = createDbHabit()
      const repo = createFakeHabitRepository({ habits: [habit] })
      // No load() call: entriesByHabit has no map entry for this habit yet.
      const { toggleToday, entriesFor } = useHabits(contextFor(repo))

      const ok = await toggleToday(habit)

      expect(ok).toBe(true)
      expect(entriesFor(habit.id)).toHaveLength(1)
    })

    it('returns false and logs when saving the entry throws', async () => {
      const habit = createDbHabit()
      const repo = createFakeHabitRepository({ habits: [habit] })
      const { load, toggleToday, entriesFor } = useHabits(
        contextFor(repo, { upsertEntry: rejects }),
      )
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const ok = await toggleToday(habit)

      expect(ok).toBe(false)
      expect(entriesFor(habit.id)).toHaveLength(0)
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('returns false and logs when clearing an already-complete entry throws', async () => {
      // A fixed clock keeps "today" (as computed inside useHabits) and the
      // pre-existing entry's date (constructed here) provably the same
      // calendar day, instead of relying on two independent wall-clock reads.
      const clock = testClock(Date.UTC(2026, 0, 15, 12))
      const today = getStartOfDay(new Date(clock.now()))
      const habit = createDbHabit()
      const repo = createFakeHabitRepository({
        habits: [habit],
        entries: [createDbHabitEntry({ habitId: habit.id, date: today, value: 1 })],
      })
      const { load, toggleToday, entriesFor } = useHabits(
        contextFor(repo, { clearEntryForDay: rejects }).add(Clock, clock),
      )
      await load()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const ok = await toggleToday(habit) // already complete -> tries to clear -> throws
      expect(ok).toBe(false)
      expect(entriesFor(habit.id)).toHaveLength(1) // local state left as-is
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('toggleDay', () => {
    it('retro-toggles a complete day back to incomplete', async () => {
      const habit = createDbHabit()
      const day = getStartOfDay(new Date('2026-01-01'))
      const repo = createFakeHabitRepository({
        habits: [habit],
        entries: [createDbHabitEntry({ habitId: habit.id, date: day, value: 1 })],
      })
      const { load, toggleDay, entriesFor } = useHabits(contextFor(repo))
      await load()

      const ok = await toggleDay(habit, day)

      expect(ok).toBe(true)
      expect(entriesFor(habit.id).find((entry) => entry.date === day)).toBeUndefined()
    })

    it('retro-toggles a quantity habit day on straight to its target', async () => {
      const habit = createDbHabit({ kind: { type: 'quantity', target: 5, unit: 'x' } })
      const day = getStartOfDay(new Date('2026-01-01'))
      const repo = createFakeHabitRepository({ habits: [habit] })
      const { load, toggleDay, entriesFor } = useHabits(contextFor(repo))
      await load()

      const ok = await toggleDay(habit, day)

      expect(ok).toBe(true)
      expect(entriesFor(habit.id).find((entry) => entry.date === day)?.value).toBe(5)
    })
  })
})
