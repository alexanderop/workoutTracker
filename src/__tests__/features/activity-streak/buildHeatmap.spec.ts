import { describe, expect, it } from 'vitest'
import { format, startOfDay, subDays } from 'date-fns'
import type { DbCompletedWorkout } from '@/db/schema'
import { buildHeatmap, intensityForCount } from '@/features/activity-streak/lib/buildHeatmap'

function mockWorkout(completedAt: Date): DbCompletedWorkout {
  return {
    id: `w-${completedAt.getTime()}-${Math.random()}`,
    name: 'Test',
    blocks: [],
    startedAt: completedAt.getTime() - 3_600_000,
    completedAt: completedAt.getTime(),
    durationSeconds: 3600,
    notes: '',
    benchmarkId: null,
  }
}

function findCell(
  grid: ReturnType<typeof buildHeatmap>,
  date: Date,
): { count: number; intensity: number; inRange: boolean } | undefined {
  const key = format(startOfDay(date), 'yyyy-MM-dd')
  for (const week of grid.weeks) {
    for (const cell of week) {
      if (cell.dateKey === key) return cell
    }
  }
  return undefined
}

describe('intensityForCount', () => {
  it('maps count buckets to 0-4', () => {
    expect(intensityForCount(0)).toBe(0)
    expect(intensityForCount(1)).toBe(1)
    expect(intensityForCount(2)).toBe(2)
    expect(intensityForCount(3)).toBe(3)
    expect(intensityForCount(4)).toBe(4)
    expect(intensityForCount(10)).toBe(4)
  })
})

describe('buildHeatmap', () => {
  const today = startOfDay(new Date('2026-04-12T12:00:00Z'))

  it('produces an empty grid (all intensity 0) when no workouts', () => {
    const grid = buildHeatmap([], today)
    expect(grid.totalWorkouts).toBe(0)
    expect(grid.weeks.length).toBeGreaterThan(20)
    for (const week of grid.weeks) {
      expect(week.length).toBe(7)
      for (const cell of week) {
        expect(cell.intensity).toBe(0)
      }
    }
  })

  it('assigns correct intensities for 1, 2, 3, 4+ workouts on a day', () => {
    const d1 = subDays(today, 10)
    const d2 = subDays(today, 11)
    const d3 = subDays(today, 12)
    const d4 = subDays(today, 13)
    const workouts = [
      mockWorkout(d1),
      mockWorkout(d2),
      mockWorkout(d2),
      mockWorkout(d3),
      mockWorkout(d3),
      mockWorkout(d3),
      mockWorkout(d4),
      mockWorkout(d4),
      mockWorkout(d4),
      mockWorkout(d4),
      mockWorkout(d4),
    ]
    const grid = buildHeatmap(workouts, today)

    expect(findCell(grid, d1)?.intensity).toBe(1)
    expect(findCell(grid, d2)?.intensity).toBe(2)
    expect(findCell(grid, d3)?.intensity).toBe(3)
    expect(findCell(grid, d4)?.intensity).toBe(4)
    expect(grid.totalWorkouts).toBe(11)
  })

  it('ignores workouts outside the range', () => {
    const old = subDays(today, 400)
    const grid = buildHeatmap([mockWorkout(old)], today)
    expect(grid.totalWorkouts).toBe(0)
  })

  it('includes today cell within range', () => {
    const grid = buildHeatmap([mockWorkout(today)], today)
    const cell = findCell(grid, today)
    expect(cell?.inRange).toBe(true)
    expect(cell?.intensity).toBe(1)
    expect(grid.totalWorkouts).toBe(1)
  })
})
