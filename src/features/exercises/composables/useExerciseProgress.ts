import { computed, onMounted, ref } from 'vue'
import { getExerciseProgressRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { ExerciseSession, ExerciseStats, PersonalRecords } from '@/db/schema'

// ============================================
// Types
// ============================================

type ExerciseProgressState =
  | { status: 'loading' }
  | { status: 'success'; data: LoadedData }
  | { status: 'not-found' }
  | { status: 'error'; error: Error }

type LoadedData = {
  exerciseName: string
  sessions: ReadonlyArray<ExerciseSession>
  stats: ExerciseStats
  personalRecords: PersonalRecords
}

/**
 * Data point for progression charts.
 * Each point represents one workout session.
 */
export type ChartDataPoint = {
  date: Date
  maxWeight: number
  volume: number
  estimated1RM: number
}

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Transforms exercise sessions to chart-friendly format.
 * Reverses to oldest-first for x-axis progression.
 */
function transformToChartData(sessions: ReadonlyArray<ExerciseSession>): Array<ChartDataPoint> {
  return [...sessions].toReversed().map((session) => ({
    date: session.date,
    maxWeight: session.maxWeight,
    volume: session.totalVolume,
    estimated1RM: Math.max(...session.sets.map((s) => s.estimated1RM), 0),
  }))
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useExerciseProgress(exerciseId: string) {
  // Primary State
  const state = ref<ExerciseProgressState>({ status: 'loading' })

  // Computed - derived state
  const chartData = computed<Array<ChartDataPoint>>(() => {
    if (state.value.status !== 'success') {
      return []
    }
    return transformToChartData(state.value.data.sessions)
  })

  const hasHistory = computed<boolean>(() => {
    if (state.value.status !== 'success') {
      return false
    }
    return state.value.data.sessions.length > 0
  })

  const exerciseName = computed<string>(() => {
    if (state.value.status !== 'success') {
      return ''
    }
    return state.value.data.exerciseName
  })

  const personalRecords = computed<PersonalRecords | null>(() => {
    if (state.value.status !== 'success') {
      return null
    }
    return state.value.data.personalRecords
  })

  // Methods
  async function loadProgress() {
    state.value = { status: 'loading' }
    const repo = getExerciseProgressRepository()

    // Load all data in parallel
    const [historyResult, statsResult, prsResult] = await Promise.all([
      tryCatch(repo.getExerciseHistory(exerciseId)),
      tryCatch(repo.getExerciseStats(exerciseId)),
      tryCatch(repo.getPersonalRecords(exerciseId)),
    ])

    const [historyError, sessions] = historyResult
    const [statsError, stats] = statsResult
    const [prsError, prs] = prsResult

    // Check for errors or missing data
    if (historyError || statsError || prsError || !sessions || !stats || !prs) {
      const error = historyError ?? statsError ?? prsError ?? new Error('Missing data')
      state.value = { status: 'error', error }
      return
    }

    // Determine exercise name - from stats or fallback
    const exerciseNameValue = stats.exerciseName || 'Unknown Exercise'

    state.value = {
      status: 'success',
      data: {
        exerciseName: exerciseNameValue,
        sessions,
        stats,
        personalRecords: prs,
      },
    }
  }

  // Lifecycle Hooks
  onMounted(() => {
    void loadProgress()
  })

  return {
    state,
    chartData,
    hasHistory,
    exerciseName,
    personalRecords,
    loadProgress,
  }
}
