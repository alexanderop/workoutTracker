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
  it('keys each entry off completedAt across local midnight while recordedAt tracks the clock', async () => {
    const habit = createDbHabit({ kind: { type: 'binary' }, autoLink: 'completed-workout' })
    const repo = createFakeHabitRepository({ habits: [habit] })
    // The clock never leaves the morning of the 11th, while the two completedAt
    // instants straddle midnight -- so the two sources cannot be confused.
    const clock = testClock(new Date(2026, 5, 11, 8, 0, 0).getTime())

    const completedAtBeforeMidnight = new Date(2026, 5, 10, 23, 59, 0).getTime()
    const recordedAtBeforeMidnight = clock.now()
    await autoLinkWorkoutCompletion(repo, completedAtBeforeMidnight, clock)

    clock.adjust(60 * 1000)
    const completedAtAfterMidnight = new Date(2026, 5, 11, 0, 1, 0).getTime()
    const recordedAtAfterMidnight = clock.now()
    await autoLinkWorkoutCompletion(repo, completedAtAfterMidnight, clock)

    const dayBefore = getStartOfDay(new Date(completedAtBeforeMidnight))
    const dayAfter = getStartOfDay(new Date(completedAtAfterMidnight))
    expect(dayBefore).not.toBe(dayAfter)
    // The first entry lands on the 10th, a day the clock was never on.
    expect(dayBefore).not.toBe(getStartOfDay(new Date(recordedAtBeforeMidnight)))

    const entriesBefore = await repo.getEntriesForDay(dayBefore)
    const entriesAfter = await repo.getEntriesForDay(dayAfter)
    expect(entriesBefore).toHaveLength(1)
    expect(entriesAfter).toHaveLength(1)
    expect(entriesBefore[0]?.recordedAt).toBe(recordedAtBeforeMidnight)
    expect(entriesAfter[0]?.recordedAt).toBe(recordedAtAfterMidnight)
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
      archivedAt: new Date(2026, 5, 1, 12, 0, 0).getTime(),
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
