import { computed, onMounted, ref } from 'vue'
import { generateId, getWeightRepository } from '@/db'
import type { DbWeightEntry } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import { getStartOfDay } from '../lib/weightCalculations'

// ============================================
// Types
// ============================================

type WeightEntriesState =
  | { status: 'loading' }
  | { status: 'success'; entries: ReadonlyArray<DbWeightEntry> }
  | { status: 'error'; error: Error }

export type TimeRange = '7D' | '30D' | '90D' | 'All'

/**
 * Data point for weight chart.
 */
export type WeightChartDataPoint = {
  date: Date
  weight: number
}

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Filter entries by time range.
 */
function filterByTimeRange(
  entries: ReadonlyArray<DbWeightEntry>,
  range: TimeRange,
): ReadonlyArray<DbWeightEntry> {
  if (range === 'All') {
    return entries
  }

  const rangeToDays: Record<Exclude<TimeRange, 'All'>, number> = { '7D': 7, '30D': 30, '90D': 90 }
  const days = rangeToDays[range]
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

  return entries.filter((entry) => entry.date >= cutoff)
}

/**
 * Transform entries to chart-friendly format.
 * Returns entries in chronological order (oldest first) for x-axis progression.
 */
function transformToChartData(
  entries: ReadonlyArray<DbWeightEntry>,
): Array<WeightChartDataPoint> {
  return [...entries].toReversed().map((entry) => ({
    date: new Date(entry.date),
    weight: entry.weight,
  }))
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useWeightEntries() {
  // Primary State
  const state = ref<WeightEntriesState>({ status: 'loading' })
  const selectedRange = ref<TimeRange>('30D')

  // Computed - all entries (newest first)
  const entries = computed<ReadonlyArray<DbWeightEntry>>(() => {
    if (state.value.status !== 'success') {
      return []
    }
    return state.value.entries
  })

  // Computed - entries filtered by time range
  const filteredEntries = computed<ReadonlyArray<DbWeightEntry>>(() => {
    return filterByTimeRange(entries.value, selectedRange.value)
  })

  // Computed - chart data (oldest first for x-axis)
  const chartData = computed<Array<WeightChartDataPoint>>(() => {
    return transformToChartData(filteredEntries.value)
  })

  // Computed - latest entry
  const latestEntry = computed<DbWeightEntry | undefined>(() => {
    return entries.value[0]
  })

  // Computed - has entries
  const hasEntries = computed<boolean>(() => {
    return entries.value.length > 0
  })

  // Methods
  async function loadEntries() {
    state.value = { status: 'loading' }

    const repo = getWeightRepository()
    const [error, result] = await tryCatch(repo.getAll())

    if (error) {
      state.value = { status: 'error', error }
      return
    }

    state.value = { status: 'success', entries: result }
  }

  async function addEntry(weight: number): Promise<boolean> {
    const repo = getWeightRepository()
    const now = Date.now()

    const entry: DbWeightEntry = {
      id: generateId(),
      weight,
      date: getStartOfDay(new Date()),
      recordedAt: now,
    }

    const [error] = await tryCatch(repo.add(entry))

    if (error) {
      console.error('Failed to add weight entry:', error)
      return false
    }

    // Reload entries to get updated list
    await loadEntries()
    return true
  }

  async function deleteEntry(id: string): Promise<boolean> {
    const repo = getWeightRepository()
    const [error] = await tryCatch(repo.delete(id))

    if (error) {
      console.error('Failed to delete weight entry:', error)
      return false
    }

    // Reload entries to get updated list
    await loadEntries()
    return true
  }

  function setTimeRange(range: TimeRange) {
    selectedRange.value = range
  }

  // Check if entry exists for today
  async function getEntryForToday(): Promise<DbWeightEntry | undefined> {
    const repo = getWeightRepository()
    const [error, entry] = await tryCatch(repo.getByDate(new Date()))
    if (error) {
      return undefined
    }
    return entry
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadEntries()
  })

  return {
    state,
    entries,
    filteredEntries,
    chartData,
    latestEntry,
    hasEntries,
    selectedRange,
    loadEntries,
    addEntry,
    deleteEntry,
    setTimeRange,
    getEntryForToday,
  }
}
