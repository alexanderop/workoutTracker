import { describe, it, expect, vi } from 'vitest'
import { startOfWeek } from 'date-fns'
import type { DbHabit } from '@/db/schema'
import {
  completionRate,
  currentStreak,
  isEntryComplete,
  longestStreak,
  startOfDay,
  weeklyProgress,
} from '@/features/habits/lib/habitStats'
import { createDbHabit } from '@/__tests__/factories'
import { entryOn, localDays } from './habitStatsHelpers'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

/** A fixed "today" so tests are deterministic regardless of when they run. */
const TODAY = startOfDay(new Date('2026-06-15T12:00:00Z').getTime()) // a Monday

function daysBefore(referenceDay: number, days: number): number {
  return referenceDay - days * DAY_MS
}

describe('isEntryComplete', () => {
  it('should treat a binary entry with value >= 1 as complete', () => {
    const habit = createDbHabit({ kind: { type: 'binary' } })
    expect(isEntryComplete(habit, entryOn(habit.id, TODAY, 1))).toBe(true)
    expect(isEntryComplete(habit, entryOn(habit.id, TODAY, 2))).toBe(true)
  })

  it('should treat a binary entry with value 0 as incomplete', () => {
    const habit = createDbHabit({ kind: { type: 'binary' } })
    expect(isEntryComplete(habit, entryOn(habit.id, TODAY, 0))).toBe(false)
  })

  it('should treat a quantity entry as complete only once value reaches the target', () => {
    const habit = createDbHabit({ kind: { type: 'quantity', target: 8, unit: 'glasses' } })
    expect(isEntryComplete(habit, entryOn(habit.id, TODAY, 7))).toBe(false)
    expect(isEntryComplete(habit, entryOn(habit.id, TODAY, 8))).toBe(true)
    expect(isEntryComplete(habit, entryOn(habit.id, TODAY, 9))).toBe(true)
  })
})

describe('currentStreak (daily habits)', () => {
  it('should return 0 for a habit with no entries', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    expect(currentStreak(habit, [], TODAY)).toBe(0)
  })

  it('should return 1 for a single complete entry today', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    const entries = [entryOn(habit.id, TODAY)]
    expect(currentStreak(habit, entries, TODAY)).toBe(1)
  })

  it('should count through yesterday when today has no entry yet (grace day)', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    const entries = [
      entryOn(habit.id, daysBefore(TODAY, 1)),
      entryOn(habit.id, daysBefore(TODAY, 2)),
    ]
    expect(currentStreak(habit, entries, TODAY)).toBe(2)
  })

  it('should not extend the grace day into a second free pass: an incomplete yesterday breaks the streak', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    // Today: no entry (grace). Yesterday: no entry either -> streak ends at 0.
    const entries = [entryOn(habit.id, daysBefore(TODAY, 2))]
    expect(currentStreak(habit, entries, TODAY)).toBe(0)
  })

  it('should stop the streak at a gap in the middle of the run', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    // today and yesterday complete, day-before-yesterday missing, then more complete days further back.
    const entries = [
      entryOn(habit.id, TODAY),
      entryOn(habit.id, daysBefore(TODAY, 1)),
      // gap at daysBefore(TODAY, 2)
      entryOn(habit.id, daysBefore(TODAY, 3)),
      entryOn(habit.id, daysBefore(TODAY, 4)),
    ]
    expect(currentStreak(habit, entries, TODAY)).toBe(2)
  })

  it('should not count an incomplete quantity entry toward the streak', () => {
    const habit = createDbHabit({
      schedule: { type: 'daily' },
      kind: { type: 'quantity', target: 8, unit: 'glasses' },
    })
    const entries = [
      entryOn(habit.id, TODAY, 8),
      entryOn(habit.id, daysBefore(TODAY, 1), 3), // below target -> breaks it
    ]
    expect(currentStreak(habit, entries, TODAY)).toBe(1)
  })
})

describe('currentStreak (weekly habits)', () => {
  const weeklyHabit: DbHabit = createDbHabit({
    schedule: { type: 'weekly', targetDaysPerWeek: 3 },
  })

  function weekStart(offsetWeeks: number): number {
    return startOfDay(startOfWeek(TODAY, { weekStartsOn: 1 }).getTime()) - offsetWeeks * WEEK_MS
  }

  it('should count a fully-elapsed past week that met the target', () => {
    const lastWeek = weekStart(1)
    const entries = [
      entryOn(weeklyHabit.id, lastWeek),
      entryOn(weeklyHabit.id, lastWeek + DAY_MS),
      entryOn(weeklyHabit.id, lastWeek + 2 * DAY_MS),
    ]
    expect(currentStreak(weeklyHabit, entries, TODAY)).toBe(1)
  })

  it('should not count a past week that fell short of the target', () => {
    const lastWeek = weekStart(1)
    const entries = [entryOn(weeklyHabit.id, lastWeek), entryOn(weeklyHabit.id, lastWeek + DAY_MS)] // only 2 of 3
    expect(currentStreak(weeklyHabit, entries, TODAY)).toBe(0)
  })

  it('should not let progress in the current, still-in-progress week break an existing streak', () => {
    const lastWeek = weekStart(1)
    const thisWeek = weekStart(0)
    const entries = [
      entryOn(weeklyHabit.id, lastWeek),
      entryOn(weeklyHabit.id, lastWeek + DAY_MS),
      entryOn(weeklyHabit.id, lastWeek + 2 * DAY_MS),
      // This week only has 1 completed day so far -- below target, but the
      // week isn't over, so it must not zero out the streak.
      entryOn(weeklyHabit.id, thisWeek),
    ]
    expect(currentStreak(weeklyHabit, entries, TODAY)).toBe(1)
  })

  it('should chain multiple consecutive successful weeks', () => {
    const entries = [0, 1, 2].flatMap((weeksAgo) => {
      const start = weekStart(weeksAgo + 1)
      return [
        entryOn(weeklyHabit.id, start),
        entryOn(weeklyHabit.id, start + DAY_MS),
        entryOn(weeklyHabit.id, start + 2 * DAY_MS),
      ]
    })
    expect(currentStreak(weeklyHabit, entries, TODAY)).toBe(3)
  })
})

describe('longestStreak', () => {
  it('should return 0 for no entries', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    expect(longestStreak(habit, [])).toBe(0)
  })

  it('should find the longest run even when it is not the most recent one', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    // Recent run: 2 days. Older run: 4 days.
    const entries = [
      entryOn(habit.id, TODAY),
      entryOn(habit.id, daysBefore(TODAY, 1)),
      entryOn(habit.id, daysBefore(TODAY, 10)),
      entryOn(habit.id, daysBefore(TODAY, 11)),
      entryOn(habit.id, daysBefore(TODAY, 12)),
      entryOn(habit.id, daysBefore(TODAY, 13)),
    ]
    expect(longestStreak(habit, entries)).toBe(4)
  })

  it('should find the longest run of consecutive complete weeks for a weekly habit', () => {
    const habit = createDbHabit({ schedule: { type: 'weekly', targetDaysPerWeek: 3 } })
    function weekStart(offsetWeeks: number): number {
      return startOfDay(startOfWeek(TODAY, { weekStartsOn: 1 }).getTime()) - offsetWeeks * WEEK_MS
    }
    // Older run: 2 consecutive complete weeks (5 and 4 weeks ago). Recent
    // run: a single complete week (1 week ago), separated by a gap.
    const entries = [5, 4, 1].flatMap((weeksAgo) => {
      const start = weekStart(weeksAgo)
      return [0, 1, 2].map((dayOffset) => entryOn(habit.id, start + dayOffset * DAY_MS))
    })
    expect(longestStreak(habit, entries)).toBe(2)
  })
})

describe('completionRate', () => {
  it('should return 0 for a non-positive rangeDays', () => {
    const habit = createDbHabit()
    expect(completionRate(habit, [], 0, TODAY)).toBe(0)
    expect(completionRate(habit, [], -5, TODAY)).toBe(0)
  })

  it('should default referenceDay to now when the caller omits it', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(TODAY)
      const habit = createDbHabit({ schedule: { type: 'daily' } })
      const entries = [entryOn(habit.id, TODAY)]
      // No explicit referenceDay -- falls back to Date.now(), fixed by fake timers.
      expect(completionRate(habit, entries, 1)).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('should be within [0, 1] and reflect the completed fraction of the window', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    const entries = [entryOn(habit.id, TODAY), entryOn(habit.id, daysBefore(TODAY, 1))]
    // 2 complete days out of a 4-day trailing window.
    expect(completionRate(habit, entries, 4, TODAY)).toBe(0.5)
  })

  it('should return 0 when nothing in the window is complete', () => {
    const habit = createDbHabit()
    expect(completionRate(habit, [], 7, TODAY)).toBe(0)
  })

  it('should return 1 when every day in the window is complete', () => {
    const habit = createDbHabit()
    const entries = [0, 1, 2].map((offset) => entryOn(habit.id, daysBefore(TODAY, offset)))
    expect(completionRate(habit, entries, 3, TODAY)).toBe(1)
  })
})

describe('weeklyProgress', () => {
  it('should default the target to 7 for daily habits', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    const monday = startOfDay(startOfWeek(TODAY, { weekStartsOn: 1 }).getTime())
    const entries = [entryOn(habit.id, monday), entryOn(habit.id, monday + DAY_MS)]
    expect(weeklyProgress(habit, entries, TODAY)).toEqual({ completed: 2, target: 7 })
  })

  it('should use targetDaysPerWeek for weekly habits', () => {
    const habit = createDbHabit({ schedule: { type: 'weekly', targetDaysPerWeek: 3 } })
    const monday = startOfDay(startOfWeek(TODAY, { weekStartsOn: 1 }).getTime())
    const entries = [entryOn(habit.id, monday)]
    expect(weeklyProgress(habit, entries, TODAY)).toEqual({ completed: 1, target: 3 })
  })
})

/**
 * Regression coverage for DST transitions in the host timezone
 * (Europe/Berlin). Entry dates are LOCAL start-of-day timestamps; day/week
 * walking used to step by fixed 24h/168h milliseconds, which lands an hour
 * off the neighboring day's start-of-day key on the 23h/25h days either
 * side of a transition, silently breaking streaks. All dates below are
 * built via local `Date` construction (`new Date(year, monthIndex, day)`)
 * -- exactly like production data would be recorded -- then normalized
 * through the real `startOfDay`, so these tests genuinely exercise the
 * local-time boundary this machine actually observes.
 */
describe('DST transitions (Europe/Berlin, host timezone)', () => {
  // Spring forward: Sun Mar 29 2026 02:00 -> 03:00 CEST. That local day is
  // only 23h long.
  describe('spring-forward day (Sun Mar 29 2026)', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    const mar27 = startOfDay(new Date(2026, 2, 27).getTime()) // Fri
    const mar28 = startOfDay(new Date(2026, 2, 28).getTime()) // Sat
    const mar29 = startOfDay(new Date(2026, 2, 29).getTime()) // Sun, the 23h day
    const mar30 = startOfDay(new Date(2026, 2, 30).getTime()) // Mon

    it('should count currentStreak across the 23h day as 4 unbroken consecutive days', () => {
      const entries = [mar27, mar28, mar29, mar30].map((day) => entryOn(habit.id, day))
      expect(currentStreak(habit, entries, mar30)).toBe(4)
    })

    it('should not break the streak with a false gap between the 23h day and its neighbors', () => {
      // No entry on mar30 itself (grace day); mar27-29 must still read as
      // one unbroken 3-day run reaching back from "today".
      const entries = [mar27, mar28, mar29].map((day) => entryOn(habit.id, day))
      expect(currentStreak(habit, entries, mar30)).toBe(3)
    })

    it('should find the full run in longestStreak spanning the 23h day', () => {
      const entries = [mar27, mar28, mar29, mar30].map((day) => entryOn(habit.id, day))
      expect(longestStreak(habit, entries)).toBe(4)
    })

    it('should compute completionRate correctly across the transition', () => {
      const entries = [mar27, mar28, mar29, mar30].map((day) => entryOn(habit.id, day))
      expect(completionRate(habit, entries, 4, mar30)).toBe(1)
    })

    it('should count weeklyProgress days correctly for the week ending on the 23h day', () => {
      // Mon Mar 23 - Sun Mar 29 2026 is the week containing the transition.
      const mar23 = startOfDay(new Date(2026, 2, 23).getTime())
      const entries = [mar27, mar28, mar29].map((day) => entryOn(habit.id, day))
      expect(weeklyProgress(habit, entries, mar23)).toEqual({ completed: 3, target: 7 })
    })
  })

  // Fall back: Sun Oct 25 2026 03:00 -> 02:00 CET. That local day is 25h long.
  describe('fall-back day (Sun Oct 25 2026)', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    const oct24 = startOfDay(new Date(2026, 9, 24).getTime()) // Sat
    const oct25 = startOfDay(new Date(2026, 9, 25).getTime()) // Sun, the 25h day
    const oct26 = startOfDay(new Date(2026, 9, 26).getTime()) // Mon
    const oct27 = startOfDay(new Date(2026, 9, 27).getTime()) // Tue

    it('should count currentStreak across the 25h day as 4 unbroken consecutive days', () => {
      const entries = [oct24, oct25, oct26, oct27].map((day) => entryOn(habit.id, day))
      expect(currentStreak(habit, entries, oct27)).toBe(4)
    })

    it('should not merge or drop the 25h day from a longestStreak run', () => {
      const entries = [oct24, oct25, oct26, oct27].map((day) => entryOn(habit.id, day))
      expect(longestStreak(habit, entries)).toBe(4)
    })

    it('should compute completionRate correctly across the transition', () => {
      const entries = [oct24, oct25, oct26, oct27].map((day) => entryOn(habit.id, day))
      expect(completionRate(habit, entries, 4, oct27)).toBe(1)
    })

    it('should count weeklyProgress days correctly for the week ending on the 25h day', () => {
      // Mon Oct 19 - Sun Oct 25 2026 is the week containing the transition.
      const oct19 = startOfDay(new Date(2026, 9, 19).getTime())
      const entries = [oct24, oct25].map((day) => entryOn(habit.id, day))
      expect(weeklyProgress(habit, entries, oct19)).toEqual({ completed: 2, target: 7 })
    })
  })

  describe('weekly habit streaks spanning a DST boundary', () => {
    it('should chain a weekly streak across the spring-forward week boundary', () => {
      const habit = createDbHabit({ schedule: { type: 'weekly', targetDaysPerWeek: 3 } })
      // Week A: Mon Mar 16 - Sun Mar 22 (before DST).
      // Week B: Mon Mar 23 - Sun Mar 29 (contains the 23h day).
      // "today" (Mar 31, Tue) sits in week C, so A and B are both fully elapsed.
      const weekA = localDays(new Date(2026, 2, 16), [0, 1, 2])
      const weekB = localDays(new Date(2026, 2, 23), [0, 1, 2])
      const entries = [...weekA, ...weekB].map((day) => entryOn(habit.id, day))
      const today = startOfDay(new Date(2026, 2, 31).getTime())

      expect(currentStreak(habit, entries, today)).toBe(2)
    })

    it('should chain a weekly streak across the fall-back week boundary', () => {
      const habit = createDbHabit({ schedule: { type: 'weekly', targetDaysPerWeek: 3 } })
      // Week A: Mon Oct 12 - Sun Oct 18 (before DST).
      // Week B: Mon Oct 19 - Sun Oct 25 (contains the 25h day).
      // "today" (Oct 27, Tue) sits in week C, so A and B are both fully elapsed.
      const weekA = localDays(new Date(2026, 9, 12), [0, 1, 2])
      const weekB = localDays(new Date(2026, 9, 19), [0, 1, 2])
      const entries = [...weekA, ...weekB].map((day) => entryOn(habit.id, day))
      const today = startOfDay(new Date(2026, 9, 27).getTime())

      expect(currentStreak(habit, entries, today)).toBe(2)
    })
  })
})
