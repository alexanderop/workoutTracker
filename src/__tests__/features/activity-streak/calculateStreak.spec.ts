import { describe, expect, it } from 'vitest'
import { startOfDay, subDays } from 'date-fns'
import type { DbCompletedWorkout } from '@/db/schema'
import { calculateStreak } from '@/features/activity-streak/lib/calculateStreak'

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

describe('calculateStreak', () => {
  const today = startOfDay(new Date('2026-04-12T12:00:00Z'))

  it('returns zero streak and hasEverTrained=false for empty history', () => {
    const result = calculateStreak([], today)
    expect(result).toEqual({ current: 0, longest: 0, hasEverTrained: false })
  })

  it('counts today-only as a 1 day streak', () => {
    const result = calculateStreak([mockWorkout(today)], today)
    expect(result.current).toBe(1)
    expect(result.longest).toBe(1)
    expect(result.hasEverTrained).toBe(true)
  })

  it('counts a 5 day active streak ending today', () => {
    const workouts = Array.from({ length: 5 }, (_, index) =>
      mockWorkout(subDays(today, index)),
    )
    const result = calculateStreak(workouts, today)
    expect(result.current).toBe(5)
    expect(result.longest).toBe(5)
  })

  it('counts a 5 day streak ending yesterday (today not yet trained)', () => {
    // Workouts on days -1..-5 (no workout today)
    const workouts = Array.from({ length: 5 }, (_, index) =>
      mockWorkout(subDays(today, index + 1)),
    )
    const result = calculateStreak(workouts, today)
    expect(result.current).toBe(5)
    expect(result.longest).toBe(5)
  })

  it('reports current 0 when the streak broke two days ago', () => {
    // Streak on days -2..-6, nothing today or yesterday
    const workouts = Array.from({ length: 5 }, (_, index) =>
      mockWorkout(subDays(today, index + 2)),
    )
    const result = calculateStreak(workouts, today)
    expect(result.current).toBe(0)
    expect(result.longest).toBe(5)
  })

  it('deduplicates multiple workouts on the same day', () => {
    const workouts = [
      mockWorkout(today),
      mockWorkout(today),
      mockWorkout(today),
      mockWorkout(subDays(today, 1)),
    ]
    const result = calculateStreak(workouts, today)
    expect(result.current).toBe(2)
    expect(result.longest).toBe(2)
  })

  it('reports longest > current when history has a bigger past streak', () => {
    // A 7 day streak 30 days ago, and 2 days current
    const oldStreak = Array.from({ length: 7 }, (_, index) =>
      mockWorkout(subDays(today, 30 + index)),
    )
    const current = [mockWorkout(today), mockWorkout(subDays(today, 1))]
    const result = calculateStreak([...oldStreak, ...current], today)
    expect(result.current).toBe(2)
    expect(result.longest).toBe(7)
  })
})
