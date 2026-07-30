import { computed, ref } from 'vue'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { generateId, getWeightRepository } from '@/db'
import type { DbWeightEntry } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import { getStartOfDay } from '../lib/weightCalculations'

// ============================================
// Types
// ============================================

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
function transformToChartData(entries: ReadonlyArray<DbWeightEntry>): Array<WeightChartDataPoint> {
  return [...entries].toReversed().map((entry) => ({
    date: new Date(entry.date),
    weight: entry.weight,
  }))
}

async function addEntry(weight: number): Promise<boolean> {
  const now = Date.now()
  const entry: DbWeightEntry = {
    id: generateId(),
    weight,
    date: getStartOfDay(new Date()),
    recordedAt: now,
  }

  const [error] = await tryCatch(getWeightRepository().add(entry))
  if (error) {
    console.error('Failed to add weight entry:', error)
    return false
  }

  return true
}

async function deleteEntry(id: string): Promise<boolean> {
  const [error] = await tryCatch(getWeightRepository().delete(id))
  if (error) {
    console.error('Failed to delete weight entry:', error)
    return false
  }

  return true
}

/**
 * Write the entry for `day` (a start-of-day timestamp), replacing that day's
 * most recent existing entry if there is one. `bodyFatPct` is omitted from
 * the record entirely when undefined.
 */
async function upsertEntry(input: {
  day: number
  weightKg: number
  bodyFatPct?: number
}): Promise<boolean> {
  // Built as a fresh plain object -- never a reactive proxy -- because Dexie
  // persists via structuredClone, which throws DataCloneError on a Proxy.
  const entry: DbWeightEntry = {
    id: generateId(),
    weight: input.weightKg,
    date: input.day,
    recordedAt: Date.now(),
    ...(input.bodyFatPct !== undefined && { bodyFatPct: input.bodyFatPct }),
  }

  const [error] = await tryCatch(getWeightRepository().upsertForDate(entry))
  if (error) {
    console.error('Failed to upsert weight entry:', error)
    return false
  }

  return true
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useWeightEntries() {
  // Primary State — live query keeps `entries` in sync with storage, including
  // changes made from other tabs, so add/delete below don't need a manual reload.
  const { data: entriesData } = useLiveQuery<ReadonlyArray<DbWeightEntry>>(() =>
    getWeightRepository().observeEntries(),
  )
  const selectedRange = ref<TimeRange>('30D')

  // Computed - all entries (newest first)
  const entries = computed<ReadonlyArray<DbWeightEntry>>(() => entriesData.value ?? [])

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

  // State Metadata — no snapshot yet means the initial `get()` hasn't resolved
  const isLoading = computed(() => entriesData.value === undefined)

  // Methods
  function setTimeRange(range: TimeRange) {
    selectedRange.value = range
  }

  // Check if entry exists for today
  return {
    entries,
    filteredEntries,
    chartData,
    latestEntry,
    hasEntries,
    isLoading,
    selectedRange,
    addEntry,
    deleteEntry,
    upsertEntry,
    setTimeRange,
  }
}
