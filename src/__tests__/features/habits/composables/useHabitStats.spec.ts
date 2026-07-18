import { describe, expect, it } from 'vitest'
import { useHabitStats } from '@/features/habits/composables/useHabitStats'
import { createDbHabit, createDbHabitEntry } from '@/__tests__/factories'

describe('useHabitStats', () => {
  it('derives stats (streaks, completion rate, weekly progress, grid) from the habit and entries', () => {
    const habit = createDbHabit({ schedule: { type: 'daily' } })
    const entries = [createDbHabitEntry({ habitId: habit.id, value: 1 })]

    const { stats } = useHabitStats(
      () => habit,
      () => entries,
    )

    expect(stats.value).not.toBeNull()
    expect(stats.value?.currentStreak).toBe(1)
    expect(stats.value?.longestStreak).toBe(1)
    expect(stats.value?.completionRate30d).toBeGreaterThan(0)
    expect(stats.value?.weeklyProgress).toEqual({ completed: 1, target: 7 })
    expect(stats.value?.grid).toHaveLength(12)
  })

  it('is null when no habit is available yet', () => {
    const { stats } = useHabitStats(
      () => undefined,
      () => [],
    )

    expect(stats.value).toBeNull()
  })
})
