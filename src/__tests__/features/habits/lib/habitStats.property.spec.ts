import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { subDays } from 'date-fns'
import type { DbHabit, DbHabitEntry } from '@/db/schema'
import {
  completionRate,
  currentStreak,
  isEntryComplete,
  longestStreak,
  startOfDay,
} from '@/features/habits/lib/habitStats'
import { createDbHabit, createDbHabitEntry } from '@/__tests__/factories'

/** Fixed reference "today", normalized to a day boundary. */
const TODAY = startOfDay(new Date('2026-06-15T12:00:00Z').getTime())

const dailyHabitArb: fc.Arbitrary<DbHabit> = fc
  .oneof(
    fc.constant<DbHabit['kind']>({ type: 'binary' }),
    fc
      .integer({ min: 1, max: 20 })
      .map((target) => ({ type: 'quantity' as const, target, unit: 'x' })),
  )
  .map((kind) => createDbHabit({ schedule: { type: 'daily' }, kind }))

const weeklyHabitArb: fc.Arbitrary<DbHabit> = fc
  .integer({ min: 1, max: 7 })
  .map((targetDaysPerWeek) => createDbHabit({ schedule: { type: 'weekly', targetDaysPerWeek } }))

const habitArb: fc.Arbitrary<DbHabit> = fc.oneof(dailyHabitArb, weeklyHabitArb)

/** A completion value guaranteed to satisfy `habit`'s kind. */
function completeValueFor(habit: DbHabit): number {
  return habit.kind.type === 'binary' ? 1 : habit.kind.target
}

/** A completion value guaranteed to NOT satisfy `habit`'s kind. */
function incompleteValueFor(habit: DbHabit): number {
  return habit.kind.type === 'binary' ? 0 : habit.kind.target - 1
}

/**
 * Entries on distinct past days (offsets 1..400 days before TODAY, so TODAY
 * itself is never included), each independently complete or not.
 *
 * Dates are derived via `date-fns subDays` over a `Date` object and
 * re-normalized through {@link startOfDay}, not fixed millisecond
 * arithmetic -- entry dates are LOCAL start-of-day timestamps, and a
 * `TODAY - offset * DAY_MS`-style calculation lands off the neighboring
 * day's start-of-day key across a DST transition (the host machine runs
 * Europe/Berlin). The widened 400-day range guarantees offsets regularly
 * span both a spring-forward and a fall-back transition across property
 * runs, so this exercises that boundary rather than sidestepping it.
 */
function entriesArb(habit: DbHabit): fc.Arbitrary<Array<DbHabitEntry>> {
  const today = new Date(TODAY)
  return fc.uniqueArray(fc.integer({ min: 1, max: 400 }), { maxLength: 60 }).chain((offsets) =>
    fc.tuple(...offsets.map(() => fc.boolean())).map((completions) =>
      offsets.map((offset, index) =>
        createDbHabitEntry({
          habitId: habit.id,
          date: startOfDay(subDays(today, offset).getTime()),
          value: completions[index] ? completeValueFor(habit) : incompleteValueFor(habit),
        }),
      ),
    ),
  )
}

type HabitWithEntries = { habit: DbHabit; entries: Array<DbHabitEntry> }

/** A habit paired with a compatible, arbitrary set of past-day entries. */
const habitWithEntriesArb: fc.Arbitrary<HabitWithEntries> = habitArb.chain((habit) =>
  entriesArb(habit).map((entries) => ({ habit, entries })),
)

describe('habitStats (property-based)', () => {
  it('isEntryComplete matches the completion helpers used to build entries', () => {
    fc.assert(
      fc.property(habitArb, fc.boolean(), (habit, complete) => {
        const value = complete ? completeValueFor(habit) : incompleteValueFor(habit)
        const entry = createDbHabitEntry({ habitId: habit.id, date: TODAY, value })
        expect(isEntryComplete(habit, entry)).toBe(complete)
      }),
    )
  })

  it('currentStreak never exceeds the number of complete entries', () => {
    fc.assert(
      fc.property(habitWithEntriesArb, ({ habit, entries }) => {
        const streak = currentStreak(habit, entries, TODAY)
        const completeCount = entries.filter((entry) => isEntryComplete(habit, entry)).length
        expect(streak).toBeLessThanOrEqual(completeCount)
      }),
    )
  })

  it('adding a completed entry for today never decreases the current streak', () => {
    fc.assert(
      fc.property(habitWithEntriesArb, ({ habit, entries: pastEntries }) => {
        const before = currentStreak(habit, pastEntries, TODAY)

        const todayEntry = createDbHabitEntry({
          habitId: habit.id,
          date: TODAY,
          value: completeValueFor(habit),
        })
        const after = currentStreak(habit, [...pastEntries, todayEntry], TODAY)

        expect(after).toBeGreaterThanOrEqual(before)
      }),
    )
  })

  it('longestStreak is never less than the currentStreak', () => {
    fc.assert(
      fc.property(habitWithEntriesArb, ({ habit, entries }) => {
        const current = currentStreak(habit, entries, TODAY)
        const longest = longestStreak(habit, entries)
        expect(longest).toBeGreaterThanOrEqual(0)
        // Every unit `currentStreak` counts is backed by a real complete
        // entry (an incomplete "today" is skipped via grace, never counted),
        // so it is itself one of the runs `longestStreak` scans over.
        expect(longest).toBeGreaterThanOrEqual(current)
      }),
    )
  })

  it('completionRate is always within [0, 1]', () => {
    fc.assert(
      fc.property(
        habitWithEntriesArb,
        fc.integer({ min: 1, max: 90 }),
        ({ habit, entries }, rangeDays) => {
          const rate = completionRate(habit, entries, rangeDays, TODAY)
          expect(rate).toBeGreaterThanOrEqual(0)
          expect(rate).toBeLessThanOrEqual(1)
        },
      ),
    )
  })

  it('completionRate is 0 for a non-positive rangeDays regardless of entries', () => {
    fc.assert(
      fc.property(
        habitWithEntriesArb,
        fc.integer({ min: -30, max: 0 }),
        ({ habit, entries }, rangeDays) => {
          expect(completionRate(habit, entries, rangeDays, TODAY)).toBe(0)
        },
      ),
    )
  })
})
