import { computed, onMounted } from 'vue'
import { startOfDay } from 'date-fns'
import { buildHeatmap } from '../lib/buildHeatmap'
import type { HeatmapGrid } from '../types/streak'
import { useActivityHistory } from './useActivityHistory'

const MONTHS = 6

/**
 * Reactive 6-month activity heatmap grid.
 */
export function useActivityHeatmap() {
  const { workouts, isLoading, hasLoaded, load, ensureLoaded } = useActivityHistory()

  const grid = computed<HeatmapGrid>(() =>
    buildHeatmap(workouts.value, startOfDay(new Date()), MONTHS),
  )

  const hasAnyActivity = computed(() => grid.value.totalWorkouts > 0)

  onMounted(() => {
    ensureLoaded()
  })

  return {
    grid,
    hasAnyActivity,
    isLoading,
    hasLoaded,
    reload: load,
  }
}
