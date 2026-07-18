/**
 * Per-habit derived stats -- pure computation over an already-loaded habit
 * and its entries. Mirrors `useWeightStats`'s split: this composable owns no
 * fetching, just derives from data the caller already has (see
 * `useHabits.ts` for the imperative shell that owns fetching/mutations).
 */
import { computed } from 'vue'
import type { DbHabit, DbHabitEntry } from '@/db/schema'
import {
  completionRate,
  currentStreak,
  longestStreak,
  weeklyProgress,
  type WeeklyProgress,
} from '../lib/habitStats'
import { buildHabitGrid, type HabitGridWeek } from '../lib/habitGrid'

/** Weeks of history shown in the contribution grid (~a quarter). */
const HISTORY_WEEKS = 12

/** Window for the rolling completion-rate stat. */
const COMPLETION_RATE_DAYS = 30

export type HabitStats = {
  currentStreak: number
  longestStreak: number
  completionRate30d: number
  weeklyProgress: WeeklyProgress
  grid: ReadonlyArray<HabitGridWeek>
}

export function useHabitStats(
  habit: () => Readonly<DbHabit> | undefined,
  entries: () => ReadonlyArray<DbHabitEntry>,
) {
  const stats = computed<HabitStats | null>(() => {
    const currentHabit = habit()
    if (!currentHabit) return null

    const habitEntries = entries()
    const now = Date.now()

    return {
      currentStreak: currentStreak(currentHabit, habitEntries, now),
      longestStreak: longestStreak(currentHabit, habitEntries),
      completionRate30d: completionRate(currentHabit, habitEntries, COMPLETION_RATE_DAYS, now),
      weeklyProgress: weeklyProgress(currentHabit, habitEntries, now),
      grid: buildHabitGrid(currentHabit, habitEntries, HISTORY_WEEKS, now),
    }
  })

  return { stats }
}
