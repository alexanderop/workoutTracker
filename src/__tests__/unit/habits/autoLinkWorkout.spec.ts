/**
 * Node-tier edge-case specs for `autoLinkWorkoutCompletion`
 * (src/lib/habits/autoLinkWorkout.ts), exercised against the in-memory fake
 * repository and a `testClock` instead of the real Dexie repository and
 * ambient `Date.now()` used by the browser-tier spec
 * (src/__tests__/lib/habits/autoLinkWorkout.spec.ts). These cases were not
 * expressible before the `Clock` seam existed: `recordedAt` used to be
 * ambient `Date.now()`, so there was nothing to pin or advance.
 */
import { describe, expect, it } from 'vitest'
import { autoLinkWorkoutCompletion } from '@/lib/habits/autoLinkWorkout'
import { testClock } from '@/__tests__/fakes/clock'
import { getStartOfDay } from '@/lib/date'
import { createDbHabit } from '@/__tests__/factories'
import { createFakeHabitRepository } from '@/__tests__/fakes/habitRepository'

describe('autoLinkWorkoutCompletion (unit tier, pinned clock)', () => {
  it('records two entries on two distinct start-of-day keys when clock.adjust crosses local midnight between calls', async () => {
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: 'completed-workout' })
    const repo = createFakeHabitRepository({ habits: [habit] })
    // 23:59:00 local time -- one minute from local midnight.
    const clock = testClock(new Date(2026, 5, 10, 23, 59, 0).getTime())

    const completedAtBeforeMidnight = clock.now()
    await autoLinkWorkoutCompletion(repo, completedAtBeforeMidnight, clock)

    clock.adjust(2 * 60 * 1000) // 00:01:00 the next local day
    const completedAtAfterMidnight = clock.now()
    await autoLinkWorkoutCompletion(repo, completedAtAfterMidnight, clock)

    const dayBefore = getStartOfDay(new Date(completedAtBeforeMidnight))
    const dayAfter = getStartOfDay(new Date(completedAtAfterMidnight))
    expect(dayBefore).not.toBe(dayAfter)

    const entriesBefore = await repo.getEntriesForDay(dayBefore)
    const entriesAfter = await repo.getEntriesForDay(dayAfter)
    expect(entriesBefore).toHaveLength(1)
    expect(entriesAfter).toHaveLength(1)
    expect(entriesBefore[0]?.recordedAt).toBe(completedAtBeforeMidnight)
    expect(entriesAfter[0]?.recordedAt).toBe(completedAtAfterMidnight)
  })

  it('produces exactly one entry at value 1 for two auto-links within the same virtual day', async () => {
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: 'completed-workout' })
    const repo = createFakeHabitRepository({ habits: [habit] })
    const clock = testClock(new Date(2026, 5, 10, 9, 0, 0).getTime())

    const completedAt = clock.now()
    await autoLinkWorkoutCompletion(repo, completedAt, clock)
    await autoLinkWorkoutCompletion(repo, completedAt, clock)

    const entries = await repo.getEntriesForDay(getStartOfDay(new Date(completedAt)))
    expect(entries).toHaveLength(1)
    expect(entries[0]?.value).toBe(1)
  })

  it('skips an archived habit while still filing an entry for an active sibling in the same call', async () => {
    const archived = createDbHabit({
      name: 'Archived, linked',
      kind: { type: 'binary' },
      autoLink: 'completed-workout',
      archivedAt: Date.now(),
    })
    const active = createDbHabit({
      name: 'Active, linked',
      kind: { type: 'binary' },
      autoLink: 'completed-workout',
      archivedAt: null,
    })
    const repo = createFakeHabitRepository({ habits: [archived, active] })
    const clock = testClock(new Date(2026, 5, 10, 9, 0, 0).getTime())

    const completedAt = clock.now()
    await autoLinkWorkoutCompletion(repo, completedAt, clock)

    const entries = await repo.getEntriesForDay(getStartOfDay(new Date(completedAt)))
    expect(entries).toHaveLength(1)
    expect(entries[0]?.habitId).toBe(active.id)
  })
})
