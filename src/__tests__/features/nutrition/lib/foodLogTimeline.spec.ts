import { describe, expect, it } from 'vitest'
import type { DbNutritionDiaryEntry, MealKind } from '@/db/schema'
import {
  groupEntriesByHour,
  isLoggedOnDiaryDay,
  mealForHour,
  shiftLocalDateKey,
  timelineHour,
  timelineHours,
  weekLocalDateKeys,
} from '@/features/nutrition/lib/foodLogTimeline'
import { getLocalDateKey } from '@/features/nutrition/lib/nutritionCalculations'

function makeEntry(
  id: string,
  overrides: Partial<Pick<DbNutritionDiaryEntry, 'localDate' | 'meal' | 'loggedAt'>> = {},
): DbNutritionDiaryEntry {
  return {
    id,
    localDate: overrides.localDate ?? '2026-07-22',
    meal: overrides.meal ?? 'breakfast',
    foodId: id,
    grams: 100,
    foodSnapshot: {
      name: id,
      brand: null,
      nutrientsPer100Grams: { calories: 100, proteinGrams: 10, carbohydrateGrams: 20, fatGrams: 5 },
    },
    loggedAt: overrides.loggedAt ?? new Date(2026, 6, 22, 9, 15).getTime(),
    updatedAt: 1,
  }
}

describe('food log timeline', () => {
  it('places a live-logged entry at the hour it was logged', () => {
    const entry = makeEntry('a', { loggedAt: new Date(2026, 6, 22, 13, 45).getTime() })

    expect(isLoggedOnDiaryDay(entry)).toBe(true)
    expect(timelineHour(entry)).toBe(13)
  })

  it('falls back to the canonical meal hour for back-logged entries', () => {
    const cases: ReadonlyArray<[MealKind, number]> = [
      ['breakfast', 8],
      ['lunch', 12],
      ['snack', 15],
      ['dinner', 18],
    ]
    for (const [meal, hour] of cases) {
      // Logged "now" (a later day) into the diary of 2026-07-20.
      const entry = makeEntry(meal, {
        localDate: '2026-07-20',
        meal,
        loggedAt: new Date(2026, 6, 22, 23, 0).getTime(),
      })

      expect(isLoggedOnDiaryDay(entry)).toBe(false)
      expect(timelineHour(entry)).toBe(hour)
    }
  })

  it('groups entries by hour in chronological order with per-hour totals', () => {
    const nineFifty = makeEntry('late-morning', {
      loggedAt: new Date(2026, 6, 22, 9, 50).getTime(),
    })
    const nineTen = makeEntry('early-morning', { loggedAt: new Date(2026, 6, 22, 9, 10).getTime() })
    const thirteen = makeEntry('lunch', { loggedAt: new Date(2026, 6, 22, 13, 0).getTime() })

    const groups = groupEntriesByHour([thirteen, nineFifty, nineTen])

    expect(groups.map((group) => group.hour)).toEqual([9, 13])
    expect(groups[0].entries.map((entry) => entry.id)).toEqual(['early-morning', 'late-morning'])
    expect(groups[0].totals.calories).toBe(200)
    expect(groups[1].totals.calories).toBe(100)
  })

  it('renders the default hour range and stretches it to out-of-range entries', () => {
    expect(timelineHours([])).toEqual(Array.from({ length: 15 }, (_, index) => 7 + index))

    const earlyGroups = groupEntriesByHour([
      makeEntry('early', { loggedAt: new Date(2026, 6, 22, 5, 30).getTime() }),
    ])
    const hours = timelineHours(earlyGroups)
    expect(hours[0]).toBe(5)
    expect(hours.at(-1)).toBe(21)
  })

  it('maps hours to a sensible default meal', () => {
    expect(mealForHour(8)).toBe('breakfast')
    expect(mealForHour(12)).toBe('lunch')
    expect(mealForHour(16)).toBe('snack')
    expect(mealForHour(19)).toBe('dinner')
    expect(mealForHour(23)).toBe('snack')
    expect(mealForHour(2)).toBe('snack')
  })

  it('shifts local-date keys across month boundaries', () => {
    expect(shiftLocalDateKey('2026-07-31', 1)).toBe('2026-08-01')
    expect(shiftLocalDateKey('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('builds a Monday-based week containing the given day', () => {
    // 2026-07-22 is a Wednesday.
    const week = weekLocalDateKeys('2026-07-22')

    expect(week).toEqual([
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
      '2026-07-25',
      '2026-07-26',
    ])
    // A Monday is its own week start.
    expect(weekLocalDateKeys('2026-07-20')[0]).toBe('2026-07-20')
  })

  it('round-trips with getLocalDateKey for today', () => {
    const today = getLocalDateKey()
    expect(weekLocalDateKeys(today)).toContain(today)
  })
})
