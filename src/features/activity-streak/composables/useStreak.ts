import { computed, onMounted } from 'vue'
import { startOfDay } from 'date-fns'
import { calculateStreak } from '../lib/calculateStreak'
import type { StreakInfo } from '../types/streak'
import { useActivityHistory } from './useActivityHistory'

/**
 * Reactive streak info derived from shared activity history.
 */
export function useStreak() {
  const { workouts, isLoading, hasLoaded, load, ensureLoaded } = useActivityHistory()

  const streak = computed<StreakInfo>(() =>
    calculateStreak(workouts.value, startOfDay(new Date())),
  )

  onMounted(() => {
    ensureLoaded()
  })

  return {
    streak,
    isLoading,
    hasLoaded,
    reload: load,
  }
}
