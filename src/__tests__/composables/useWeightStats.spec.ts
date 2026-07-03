import { describe, expect, it } from 'vitest'
import { useWeightStats } from '@/features/weight/composables/useWeightStats'
import type { DbWeightEntry } from '@/db/schema'

const DAY_MS = 24 * 60 * 60 * 1000

let idCounter = 0

function entry(daysAgo: number, weight: number): DbWeightEntry {
  idCounter += 1
  return {
    id: `entry-${idCounter}`,
    date: Date.now() - daysAgo * DAY_MS,
    weight,
    recordedAt: Date.now(),
  }
}

describe('useWeightStats', () => {
  it('returns all-null stats without entries', () => {
    const { stats } = useWeightStats(() => [])

    expect(stats.value).toEqual({
      current: null,
      change7d: null,
      change30d: null,
      trend: null,
    })
  })

  it('uses the most recent entry as the current weight', () => {
    const { stats } = useWeightStats(() => [entry(0, 82.5), entry(10, 84)])

    expect(stats.value.current).toBe(82.5)
  })

  it('computes 7-day and 30-day changes against nearby entries', () => {
    const entries = [entry(0, 80), entry(7, 82), entry(30, 85)]
    const { stats } = useWeightStats(() => entries)

    expect(stats.value.change7d).toBeCloseTo(-2)
    expect(stats.value.change30d).toBeCloseTo(-5)
  })

  it('returns null changes when no entry is near the comparison date', () => {
    const entries = [entry(0, 80), entry(15, 83)]
    const { stats } = useWeightStats(() => entries)

    expect(stats.value.change7d).toBeNull()
    expect(stats.value.change30d).toBeNull()
  })

  it('detects a downward trend', () => {
    const entries = [
      entry(0, 80),
      entry(1, 80.2),
      entry(2, 80.1),
      entry(3, 81.5),
      entry(4, 81.6),
      entry(5, 81.4),
    ]
    const { stats } = useWeightStats(() => entries)

    expect(stats.value.trend).toBe('down')
  })

  it('detects an upward trend', () => {
    const entries = [
      entry(0, 83),
      entry(1, 82.9),
      entry(2, 83.1),
      entry(3, 81.5),
      entry(4, 81.6),
      entry(5, 81.4),
    ]
    const { stats } = useWeightStats(() => entries)

    expect(stats.value.trend).toBe('up')
  })

  it('reports stable when averages differ less than 200g', () => {
    const entries = [
      entry(0, 81.5),
      entry(1, 81.6),
      entry(2, 81.4),
      entry(3, 81.5),
      entry(4, 81.6),
      entry(5, 81.4),
    ]
    const { stats } = useWeightStats(() => entries)

    expect(stats.value.trend).toBe('stable')
  })

  it('needs at least four entries for a trend', () => {
    const entries = [entry(0, 80), entry(1, 81), entry(2, 82)]
    const { stats } = useWeightStats(() => entries)

    expect(stats.value.trend).toBeNull()
  })
})
