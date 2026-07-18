import { describe, expect, it } from 'vitest'
import { buildHabitGrid } from '@/features/habits/lib/habitGrid'
import type { HabitGridDay, HabitGridWeek } from '@/features/habits/lib/habitGrid'
import { startOfDay } from '@/features/habits/lib/habitStats'
import { createDbHabit, createDbHabitEntryForDate } from '@/__tests__/factories'

// A fixed Wednesday so week-boundary math is deterministic across runs.
const TODAY = new Date('2026-07-15T12:00:00').getTime()

describe('buildHabitGrid', () => {
  it('returns the requested number of weeks, each with 7 days', () => {
    const habit = createDbHabit()
    const grid = buildHabitGrid(habit, [], 12, TODAY)

    expect(grid).toHaveLength(12)
    for (const week of grid) expect(week).toHaveLength(7)
  })

  it('starts every week on Monday', () => {
    const habit = createDbHabit()
    const grid = buildHabitGrid(habit, [], 6, TODAY)

    for (const week of grid) {
      expect(new Date(week[0]!.date).getDay()).toBe(1)
    }
  })

  it('ends the grid on the week containing today', () => {
    const habit = createDbHabit()
    const grid = buildHabitGrid(habit, [], 3, TODAY)

    const lastWeek = grid.at(-1)!
    expect(lastWeek.some((day) => day.isToday)).toBe(true)
  })

  it('marks days after today as future, and days up to today as not future', () => {
    const habit = createDbHabit()
    const grid = buildHabitGrid(habit, [], 1, TODAY)
    const week = grid[0]!

    for (const day of week) {
      expect(day.isFuture).toBe(day.date > new Date(TODAY).setHours(0, 0, 0, 0))
    }
    // At least one day in the current week is in the future (unless today is Sunday).
    expect(week.some((day) => day.isFuture)).toBe(true)
  })

  it('marks a binary habit day complete when any entry with value >= 1 exists', () => {
    const habit = createDbHabit({ kind: { type: 'binary' } })
    const entry = createDbHabitEntryForDate(habit.id, new Date(TODAY))
    const grid = buildHabitGrid(habit, [entry], 1, TODAY)

    const todayCell = grid[0]!.find((day) => day.isToday)
    expect(todayCell?.complete).toBe(true)
    expect(todayCell?.hasEntry).toBe(true)
  })

  it('does not mark a quantity habit day complete below its target', () => {
    const habit = createDbHabit({ kind: { type: 'quantity', target: 8, unit: 'glasses' } })
    const entry = createDbHabitEntryForDate(habit.id, new Date(TODAY), { value: 3 })
    const grid = buildHabitGrid(habit, [entry], 1, TODAY)

    const todayCell = grid[0]!.find((day) => day.isToday)
    expect(todayCell?.complete).toBe(false)
    expect(todayCell?.hasEntry).toBe(true)
  })

  it('marks a quantity habit day complete once its target is reached', () => {
    const habit = createDbHabit({ kind: { type: 'quantity', target: 8, unit: 'glasses' } })
    const entry = createDbHabitEntryForDate(habit.id, new Date(TODAY), { value: 8 })
    const grid = buildHabitGrid(habit, [entry], 1, TODAY)

    const todayCell = grid[0]!.find((day) => day.isToday)
    expect(todayCell?.complete).toBe(true)
  })

  it('leaves days without an entry incomplete', () => {
    const habit = createDbHabit()
    const grid = buildHabitGrid(habit, [], 1, TODAY)

    const todayCell = grid[0]!.find((day) => day.isToday)
    expect(todayCell?.complete).toBe(false)
    expect(todayCell?.hasEntry).toBe(false)
  })
})

/**
 * Regression coverage for DST transitions in the host timezone
 * (Europe/Berlin), mirroring the equivalent describe block in
 * habitStats.spec.ts. Entry dates are LOCAL start-of-day timestamps; day/week
 * walking used to step by fixed 24h/168h milliseconds, which lands an hour
 * off the neighboring day's start-of-day key on the 23h/25h days either side
 * of a transition, silently breaking the grid <-> entry match. All dates
 * below are built via local `Date` construction (`new Date(year, monthIndex,
 * day)`) -- exactly like production data would be recorded.
 */
describe('buildHabitGrid DST transitions (Europe/Berlin, host timezone)', () => {
  function dayCell(weeks: ReadonlyArray<HabitGridWeek>, date: number): HabitGridDay | undefined {
    return weeks.flat().find((day) => day.date === date)
  }

  // Spring forward: Sun Mar 29 2026 02:00 -> 03:00 CEST. That local day is
  // only 23h long. Week Mon Mar 23 - Sun Mar 29 contains it.
  describe('spring-forward day (Sun Mar 29 2026)', () => {
    const habit = createDbHabit({ kind: { type: 'binary' } })
    const mar27 = startOfDay(new Date(2026, 2, 27).getTime()) // Fri
    const mar28 = startOfDay(new Date(2026, 2, 28).getTime()) // Sat
    const mar29 = startOfDay(new Date(2026, 2, 29).getTime()) // Sun, the 23h day
    const mar30 = startOfDay(new Date(2026, 2, 30).getTime()) // Mon, "today"

    it('matches entries on and around the 23h day to the correct grid cells', () => {
      const entries = [mar27, mar28, mar29, mar30].map((date) =>
        createDbHabitEntryForDate(habit.id, new Date(date)),
      )
      const grid = buildHabitGrid(habit, entries, 2, mar30)

      for (const date of [mar27, mar28, mar29, mar30]) {
        const cell = dayCell(grid, date)
        expect(cell?.hasEntry, `expected an entry match for ${new Date(date).toISOString()}`).toBe(
          true,
        )
        expect(cell?.complete).toBe(true)
      }

      const todayCell = dayCell(grid, mar30)
      expect(todayCell?.hasEntry).toBe(true)
    })
  })

  // Fall back: Sun Oct 25 2026 03:00 -> 02:00 CET. That local day is 25h
  // long. Week Mon Oct 19 - Sun Oct 25 contains it.
  describe('fall-back day (Sun Oct 25 2026)', () => {
    const habit = createDbHabit({ kind: { type: 'binary' } })
    const oct24 = startOfDay(new Date(2026, 9, 24).getTime()) // Sat
    const oct25 = startOfDay(new Date(2026, 9, 25).getTime()) // Sun, the 25h day
    const oct26 = startOfDay(new Date(2026, 9, 26).getTime()) // Mon
    const oct27 = startOfDay(new Date(2026, 9, 27).getTime()) // Tue, "today"

    it('matches entries on and around the 25h day to the correct grid cells', () => {
      const entries = [oct24, oct25, oct26, oct27].map((date) =>
        createDbHabitEntryForDate(habit.id, new Date(date)),
      )
      const grid = buildHabitGrid(habit, entries, 2, oct27)

      for (const date of [oct24, oct25, oct26, oct27]) {
        const cell = dayCell(grid, date)
        expect(cell?.hasEntry, `expected an entry match for ${new Date(date).toISOString()}`).toBe(
          true,
        )
        expect(cell?.complete).toBe(true)
      }

      const todayCell = dayCell(grid, oct27)
      expect(todayCell?.hasEntry).toBe(true)
    })
  })
})
