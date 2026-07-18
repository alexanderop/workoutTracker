import { describe, it, expect, beforeEach } from 'vitest'
import { autoLinkWorkoutCompletion } from '@/lib/habits/autoLinkWorkout'
import { getHabitsRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'
import { createDbHabit } from '@/__tests__/factories'
import { getStartOfDay } from '@/lib/date'

/**
 * Unit tests for the pure auto-link function that hooks workout completion
 * up to workout-linked habits (see src/lib/habits/autoLinkWorkout.ts).
 * Exercised against the real HabitRepository (Dexie/fake-indexeddb) rather
 * than a mock, matching the repository-test convention used elsewhere
 * (e.g. src/__tests__/db/habits.spec.ts).
 */
describe('autoLinkWorkoutCompletion', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('marks a binary habit done for the day', async () => {
    const repo = getHabitsRepository()
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: 'completed-workout' })
    await repo.addHabit(habit)

    const completedAt = Date.now()
    await autoLinkWorkoutCompletion(repo, completedAt)

    const entries = await repo.getEntriesForDay(getStartOfDay(new Date(completedAt)))
    expect(entries).toHaveLength(1)
    expect(entries[0]?.habitId).toBe(habit.id)
    expect(entries[0]?.value).toBe(1)
  })

  it('leaves a binary habit at value 1 for a second workout the same day', async () => {
    const repo = getHabitsRepository()
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: 'completed-workout' })
    await repo.addHabit(habit)

    const completedAt = Date.now()
    await autoLinkWorkoutCompletion(repo, completedAt)
    await autoLinkWorkoutCompletion(repo, completedAt + 60_000)

    const entries = await repo.getEntriesForDay(getStartOfDay(new Date(completedAt)))
    expect(entries).toHaveLength(1)
    expect(entries[0]?.value).toBe(1)
  })

  it('ignores quantity habits even when they have a legacy auto-link value', async () => {
    const repo = getHabitsRepository()
    const habit = createDbHabit({
      kind: { type: 'quantity', target: 3, unit: 'workouts' },
      autoLink: 'completed-workout',
    })
    await repo.addHabit(habit)

    const completedAt = Date.now()
    await autoLinkWorkoutCompletion(repo, completedAt)

    const entries = await repo.getEntriesForDay(getStartOfDay(new Date(completedAt)))
    expect(entries).toEqual([])
  })

  it('does not touch archived habits', async () => {
    const repo = getHabitsRepository()
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: 'completed-workout' })
    await repo.addHabit(habit)
    await repo.archiveHabit(habit.id)

    const completedAt = Date.now()
    await autoLinkWorkoutCompletion(repo, completedAt)

    const entries = await repo.getEntriesForDay(getStartOfDay(new Date(completedAt)))
    expect(entries).toHaveLength(0)
  })

  it('does not touch habits with autoLink: null', async () => {
    const repo = getHabitsRepository()
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: null })
    await repo.addHabit(habit)

    const completedAt = Date.now()
    await autoLinkWorkoutCompletion(repo, completedAt)

    const entries = await repo.getEntriesForDay(getStartOfDay(new Date(completedAt)))
    expect(entries).toHaveLength(0)
  })

  it('updates every auto-link habit in a single call, leaving unlinked habits alone', async () => {
    const repo = getHabitsRepository()
    const binaryLinked = createDbHabit({
      name: 'Binary linked',
      kind: { type: 'binary' },
      autoLink: 'completed-workout',
    })
    const quantityLinked = createDbHabit({
      name: 'Quantity linked',
      kind: { type: 'quantity', target: 2, unit: 'sessions' },
      autoLink: 'completed-workout',
    })
    const unlinked = createDbHabit({ name: 'Unlinked', autoLink: null })
    await repo.addHabit(binaryLinked)
    await repo.addHabit(quantityLinked)
    await repo.addHabit(unlinked)

    const completedAt = Date.now()
    await autoLinkWorkoutCompletion(repo, completedAt)

    const entries = await repo.getEntriesForDay(getStartOfDay(new Date(completedAt)))
    expect(entries).toHaveLength(1)
    expect(entries.find((e) => e.habitId === binaryLinked.id)?.value).toBe(1)
    expect(entries.find((e) => e.habitId === quantityLinked.id)).toBeUndefined()
    expect(entries.find((e) => e.habitId === unlinked.id)).toBeUndefined()
  })
})
