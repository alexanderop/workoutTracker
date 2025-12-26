import { computed, onMounted, readonly, ref, shallowRef } from 'vue'
import { format, subDays, differenceInDays } from 'date-fns'
import { getWorkoutsRepository } from '@/db'
import type { DbCompletedWorkout } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'

// ============================================
// Types
// ============================================

export type StreakStats = {
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
  daysSinceFirstWorkout: number
}

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Group workouts by calendar day (yyyy-MM-dd).
 * Returns a Set of date strings for fast lookup.
 */
function getWorkoutDays(workouts: ReadonlyArray<DbCompletedWorkout>): Set<string> {
  const days = new Set<string>()
  for (const workout of workouts) {
    const dateKey = format(new Date(workout.completedAt), 'yyyy-MM-dd')
    days.add(dateKey)
  }
  return days
}

/**
 * Calculate current streak with 1-day grace period.
 * - If you worked out today, count from today
 * - If you didn't work out today but worked out yesterday, count from yesterday
 * - Otherwise streak is 0
 */
function calculateCurrentStreak(workoutDays: Set<string>, today: Date): number {
  let streak = 0
  let currentDate = new Date(today)
  currentDate.setHours(0, 0, 0, 0) // normalize to start of day

  // Check if worked out today
  const todayKey = format(currentDate, 'yyyy-MM-dd')
  const hasWorkoutToday = workoutDays.has(todayKey)

  if (!hasWorkoutToday) {
    // Use grace period - check yesterday
    currentDate = subDays(currentDate, 1)
    const yesterdayKey = format(currentDate, 'yyyy-MM-dd')
    if (!workoutDays.has(yesterdayKey)) {
      // No workout today or yesterday - streak is 0
      return 0
    }
  }

  // Count consecutive days with workouts going backwards
  while (true) {
    const dateKey = format(currentDate, 'yyyy-MM-dd')
    if (!workoutDays.has(dateKey)) {
      break
    }
    streak++
    currentDate = subDays(currentDate, 1)
  }

  return streak
}

/**
 * Calculate the longest streak in workout history.
 * Iterates through all days and finds the maximum consecutive streak.
 */
function calculateLongestStreak(
  workoutDays: Set<string>,
  workouts: ReadonlyArray<DbCompletedWorkout>,
): number {
  if (workouts.length === 0) return 0

  // Find earliest and latest workout dates
  const dates = Array.from(workoutDays)
    .map((dateStr) => new Date(dateStr))
    .toSorted((a, b) => a.getTime() - b.getTime())

  if (dates.length === 0) return 0

  const earliestDate = dates[0]!
  const latestDate = dates[dates.length - 1]!

  let maxStreak = 0
  let currentStreak = 0
  let currentDate = new Date(earliestDate)

  // Iterate through all days from earliest to latest
  while (currentDate <= latestDate) {
    const dateKey = format(currentDate, 'yyyy-MM-dd')
    if (workoutDays.has(dateKey)) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
      currentDate = subDays(currentDate, -1) // add 1 day
      continue
    }
    currentStreak = 0
    currentDate = subDays(currentDate, -1) // add 1 day
  }

  return maxStreak
}

/**
 * Calculate days since the first workout.
 */
function calculateDaysSinceFirstWorkout(
  workouts: ReadonlyArray<DbCompletedWorkout>,
  today: Date,
): number {
  if (workouts.length === 0) return 0

  const earliestWorkout = workouts.reduce((earliest, workout) =>
    workout.completedAt < earliest.completedAt ? workout : earliest,
  )

  return differenceInDays(today, new Date(earliestWorkout.completedAt))
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useWorkoutStreaks() {
  // Primary State
  const workouts = shallowRef<ReadonlyArray<DbCompletedWorkout>>([])

  // State Metadata
  const isLoading = ref(true)

  // Computed
  const streakStats = computed<StreakStats>(() => {
    if (workouts.value.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        daysSinceFirstWorkout: 0,
      }
    }

    const today = new Date()
    const workoutDays = getWorkoutDays(workouts.value)
    const currentStreak = calculateCurrentStreak(workoutDays, today)
    const longestStreak = calculateLongestStreak(workoutDays, workouts.value)
    const daysSinceFirstWorkout = calculateDaysSinceFirstWorkout(workouts.value, today)

    return {
      currentStreak,
      longestStreak,
      totalWorkouts: workouts.value.length,
      daysSinceFirstWorkout,
    }
  })

  // Computed: Individual stats for easy access
  const currentStreak = computed(() => streakStats.value.currentStreak)
  const longestStreak = computed(() => streakStats.value.longestStreak)
  const totalWorkouts = computed(() => streakStats.value.totalWorkouts)

  // Methods
  async function loadWorkouts(): Promise<void> {
    isLoading.value = true

    // Load all completed workouts (no limit)
    const [error, result] = await tryCatch(getWorkoutsRepository().getHistory({ limit: 10000 }))

    if (!error && result) {
      workouts.value = result
    }

    isLoading.value = false
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadWorkouts()
  })

  return {
    // State
    streakStats,
    currentStreak,
    longestStreak,
    totalWorkouts,
    isLoading: readonly(isLoading),
    // Methods
    refresh: loadWorkouts,
  }
}
