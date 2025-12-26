import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { subDays } from 'date-fns'
import { useWorkoutStreaks } from '@/composables/useWorkoutStreaks'
import { db } from '@/db'
import { dbWorkoutBuilder } from '../factories'
import type { DbCompletedWorkout } from '@/db/schema'

describe('useWorkoutStreaks', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  afterEach(async () => {
    await db.delete()
    vi.restoreAllMocks()
  })

  describe('with no workouts', () => {
    it('returns zero for all stats', async () => {
      const { streakStats } = useWorkoutStreaks()

      // Wait for initial load
      await vi.waitFor(() => {
        expect(streakStats.value).toEqual({
          currentStreak: 0,
          longestStreak: 0,
          totalWorkouts: 0,
          daysSinceFirstWorkout: 0,
        })
      })
    })
  })

  describe('current streak calculation', () => {
    it('calculates streak when working out today', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const yesterday = subDays(today, 1)
      yesterday.setHours(12, 0, 0, 0)

      // Add workouts for today and yesterday
      await addWorkout(today)
      await addWorkout(yesterday)

      const { currentStreak } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(currentStreak.value).toBe(2)
      })
    })

    it('includes today in streak using grace period', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      await addWorkout(today)

      const { currentStreak } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(currentStreak.value).toBe(1)
      })
    })

    it('uses 1-day grace period when did not work out today', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const yesterday = subDays(today, 1)
      yesterday.setHours(12, 0, 0, 0)
      const twoDaysAgo = subDays(today, 2)
      twoDaysAgo.setHours(12, 0, 0, 0)

      // Add workouts for yesterday and two days ago (but not today)
      await addWorkout(yesterday)
      await addWorkout(twoDaysAgo)

      const { currentStreak } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(currentStreak.value).toBe(2)
      })
    })

    it('returns zero when last workout was more than 1 day ago', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const twoDaysAgo = subDays(today, 2)
      twoDaysAgo.setHours(12, 0, 0, 0)

      // Last workout was 2 days ago - streak is broken
      await addWorkout(twoDaysAgo)

      const { currentStreak } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(currentStreak.value).toBe(0)
      })
    })

    it('calculates long consecutive streak correctly', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      // Add 10 consecutive days of workouts
      for (let i = 0; i < 10; i++) {
        const date = subDays(today, i)
        date.setHours(12, 0, 0, 0)
        await addWorkout(date)
      }

      const { currentStreak } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(currentStreak.value).toBe(10)
      })
    })

    it('stops counting when gap is found', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      // Add workouts today, yesterday, and 3 days ago (with gap)
      await addWorkout(today)
      await addWorkout(subDays(today, 1))
      // Gap on day 2
      await addWorkout(subDays(today, 3))

      const { currentStreak } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(currentStreak.value).toBe(2)
      })
    })
  })

  describe('longest streak calculation', () => {
    it('returns 1 for a single workout', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      await addWorkout(today)

      const { longestStreak } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(longestStreak.value).toBe(1)
      })
    })

    it('calculates longest streak from multiple streaks', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      // Current streak: 3 days
      await addWorkout(today)
      await addWorkout(subDays(today, 1))
      await addWorkout(subDays(today, 2))

      // Gap
      // Previous streak: 5 days (longest)
      for (let i = 5; i <= 9; i++) {
        await addWorkout(subDays(today, i))
      }

      const { longestStreak } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(longestStreak.value).toBe(5)
      })
    })

    it('returns current streak if it is the longest', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      // Current streak: 7 days (longest)
      for (let i = 0; i < 7; i++) {
        await addWorkout(subDays(today, i))
      }

      // Gap
      // Previous streak: 3 days
      for (let i = 10; i < 13; i++) {
        await addWorkout(subDays(today, i))
      }

      const { longestStreak } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(longestStreak.value).toBe(7)
      })
    })

    it('handles non-consecutive workouts correctly', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      // Scattered workouts with no consecutive days
      await addWorkout(today)
      await addWorkout(subDays(today, 3))
      await addWorkout(subDays(today, 7))

      const { longestStreak } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(longestStreak.value).toBe(1)
      })
    })
  })

  describe('total workouts', () => {
    it('counts total number of completed workouts', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      // Add 5 workouts
      await addWorkout(today)
      await addWorkout(subDays(today, 1))
      await addWorkout(subDays(today, 2))
      await addWorkout(subDays(today, 5))
      await addWorkout(subDays(today, 10))

      const { totalWorkouts } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(totalWorkouts.value).toBe(5)
      })
    })

    it('counts multiple workouts on same day', async () => {
      const today = new Date()

      // Add 3 workouts on the same day
      await addWorkout(new Date(today.setHours(8, 0, 0, 0)))
      await addWorkout(new Date(today.setHours(12, 0, 0, 0)))
      await addWorkout(new Date(today.setHours(18, 0, 0, 0)))

      const { totalWorkouts } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(totalWorkouts.value).toBe(3)
      })
    })
  })

  describe('days since first workout', () => {
    it('calculates days since the earliest workout', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const tenDaysAgo = subDays(today, 10)
      tenDaysAgo.setHours(12, 0, 0, 0)

      await addWorkout(today)
      await addWorkout(tenDaysAgo)

      const { streakStats } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(streakStats.value.daysSinceFirstWorkout).toBe(10)
      })
    })

    it('returns 0 when first workout is today', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)

      await addWorkout(today)

      const { streakStats } = useWorkoutStreaks()

      await vi.waitFor(() => {
        expect(streakStats.value.daysSinceFirstWorkout).toBe(0)
      })
    })
  })

  describe('refresh()', () => {
    it('reloads workout data when called', async () => {
      const { totalWorkouts, refresh } = useWorkoutStreaks()

      // Initial state
      await vi.waitFor(() => {
        expect(totalWorkouts.value).toBe(0)
      })

      // Add workout after composable is initialized
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      await addWorkout(today)

      // Refresh
      await refresh()

      await vi.waitFor(() => {
        expect(totalWorkouts.value).toBe(1)
      })
    })
  })
})

// ============================================
// Test Helpers
// ============================================

/**
 * Add a completed workout to the database at a specific date.
 */
async function addWorkout(date: Date): Promise<DbCompletedWorkout> {
  const completedAt = date.getTime()
  const startedAt = completedAt - 3600000 // 1 hour earlier

  const workout = dbWorkoutBuilder()
    .withName('Test Workout')
    .withTimestamps(startedAt, completedAt)
    .withStrengthBlock()
    .build()

  await db.workouts.add(workout)
  return workout
}
