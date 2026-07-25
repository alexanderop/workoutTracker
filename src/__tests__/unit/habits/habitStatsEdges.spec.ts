/**
 * Node-tier edge-case specs for src/features/habits/lib/habitStats.ts,
 * covering DST/week-start/archive edges genuinely not asserted by
 * habitStats.spec.ts (read in full before adding cases here -- these
 * deliberately avoid re-asserting what it already covers).
 */
import { describe, expect, it } from 'vitest'
import {
  currentStreak,
  longestStreak,
  startOfDay,
  weeklyProgress,
} from '@/features/habits/lib/habitStats'
import { createDbHabit } from '@/__tests__/factories'
import { createFakeHabitRepository } from '@/__tests__/fakes/habitRepository'
import { entryOn, localDays } from './habitStatsHelpers'

describe('longestStreak (weekly, DST boundary)', () => {
  it('chains three consecutive complete weeks as one unbroken run across the fall-back week boundary', () => {
    // Not covered by habitStats.spec.ts's DST section: it asserts
    // currentStreak across a weekly DST boundary, but not longestStreak,
    // which walks weeks forward via its own nextWeek stepper to find how
    // far a run extends. The fall-back week (Mon Oct 19 - Sun Oct 25 2026,
    // containing the 25h fall-back day) is 169 real hours long, one hour
    // *more* than a fixed 7 * 86_400_000ms step. Stepping nextWeek(Oct 19)
    // by that fixed amount undershoots into Oct 25 23:00 local -- still
    // calendar day Oct 25, so it renormalizes back to Oct 25, not Oct 26 --
    // so walking the run from Oct 12 would silently stop after 2 weeks
    // instead of continuing to the Oct 26 week, once that week is also
    // complete. (The mirror spring-forward case does *not* reproduce this:
    // overshooting by an hour there still lands within the correct next
    // calendar day, so it self-corrects on renormalization -- fall-back is
    // the genuine regression case.) Trivially true in a UTC test runner --
    // this is a real regression test only in a DST-observing zone
    // (Europe/Berlin, this host's timezone).
    const habit = createDbHabit({ schedule: { type: 'weekly', targetDaysPerWeek: 3 } })
    const weekA = localDays(new Date(2026, 9, 12), [0, 1, 2]) // Mon Oct 12 - before the transition
    const weekB = localDays(new Date(2026, 9, 19), [0, 1, 2]) // Mon Oct 19 - contains the 25h day (Sun Oct 25)
    const weekC = localDays(new Date(2026, 9, 26), [0, 1, 2]) // Mon Oct 26 - immediately after the transition
    const entries = [...weekA, ...weekB, ...weekC].map((day) => entryOn(habit.id, day))

    expect(longestStreak(habit, entries)).toBe(3)
  })
})

describe('currentStreak (weekly, Sunday-to-Monday week-start edge)', () => {
  it('counts a Sunday completion toward the week that started the preceding Monday, excluding the just-started week', () => {
    const habit = createDbHabit({ schedule: { type: 'weekly', targetDaysPerWeek: 1 } })
    const sunday = startOfDay(new Date(2026, 5, 14).getTime()) // Sun Jun 14 -- last day of the Mon Jun 8 week
    const entries = [entryOn(habit.id, sunday)]
    const followingMonday = startOfDay(new Date(2026, 5, 15).getTime()) // the following week, just started

    expect(currentStreak(habit, entries, followingMonday)).toBe(1)
  })
})

describe('weeklyProgress (Sunday-to-Monday week-start edge)', () => {
  it('attributes a Sunday entry to the week that started the preceding Monday, not the following one', () => {
    const habit = createDbHabit({ schedule: { type: 'weekly', targetDaysPerWeek: 3 } })
    const sunday = startOfDay(new Date(2026, 5, 14).getTime()) // Sun Jun 14
    const precedingMonday = startOfDay(new Date(2026, 5, 8).getTime()) // Mon Jun 8
    const followingMonday = startOfDay(new Date(2026, 5, 15).getTime()) // Mon Jun 15
    const entries = [entryOn(habit.id, sunday)]

    expect(weeklyProgress(habit, entries, precedingMonday)).toEqual({ completed: 1, target: 3 })
    expect(weeklyProgress(habit, entries, followingMonday)).toEqual({ completed: 0, target: 3 })
  })
})

describe('currentStreak (archive boundary)', () => {
  it('reports the run up to archival using entries the fake repository retains after archiving', async () => {
    const day1 = startOfDay(new Date(2026, 5, 10).getTime())
    const day2 = startOfDay(new Date(2026, 5, 11).getTime())
    const day3 = startOfDay(new Date(2026, 5, 12).getTime())
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    const repo = createFakeHabitRepository({
      habits: [habit],
      entries: [entryOn(habit.id, day1), entryOn(habit.id, day2), entryOn(habit.id, day3)],
    })

    await repo.archiveHabit(habit.id)

    const archivedHabit = await repo.getHabitById(habit.id)
    const retainedEntries = await repo.getEntriesForHabit(habit.id)
    // Grace day: "today" is the day right after the run, with no entry yet.
    const today = startOfDay(new Date(2026, 5, 13).getTime())

    expect(archivedHabit?.archivedAt).not.toBeNull()
    expect(retainedEntries).toHaveLength(3)
    expect(currentStreak(archivedHabit!, retainedEntries, today)).toBe(3)
  })
})
