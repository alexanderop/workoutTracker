import { computed } from 'vue'
import type { DbWeightEntry } from '@/db/schema'
import { getDaysAgo } from '../lib/weightCalculations'

// ============================================
// Types
// ============================================

export type WeightStats = {
  current: number | null
  change7d: number | null
  change30d: number | null
  trend: 'up' | 'down' | 'stable' | null
}

// ============================================
// Constants
// ============================================

const DATE_TOLERANCE_MS = 2 * 24 * 60 * 60 * 1000 // 2 days

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Find entry closest to a target date.
 */
function findEntryNearDate(
  entries: ReadonlyArray<DbWeightEntry>,
  targetDate: Date,
): DbWeightEntry | undefined {
  const targetTime = targetDate.getTime()

  return entries.find((entry) => {
    const diff = Math.abs(entry.date - targetTime)
    return diff <= DATE_TOLERANCE_MS
  })
}

/**
 * Calculate weight change between current and past entry.
 * Returns null if no comparison data available.
 */
function calculateChange(
  currentWeight: number,
  entries: ReadonlyArray<DbWeightEntry>,
  daysAgo: number,
): number | null {
  const targetDate = getDaysAgo(daysAgo)
  const pastEntry = findEntryNearDate(entries, targetDate)

  if (!pastEntry) {
    return null
  }

  return currentWeight - pastEntry.weight
}

/**
 * Determine trend based on recent entries.
 * Compares average of last 3 entries vs previous 3 entries.
 */
function calculateTrend(
  entries: ReadonlyArray<DbWeightEntry>,
): 'up' | 'down' | 'stable' | null {
  if (entries.length < 4) {
    return null
  }

  const recent = entries.slice(0, 3)
  const previous = entries.slice(3, 6)

  if (previous.length < 2) {
    return null
  }

  const recentAvg = recent.reduce((sum, e) => sum + e.weight, 0) / recent.length
  const previousAvg = previous.reduce((sum, e) => sum + e.weight, 0) / previous.length

  const diff = recentAvg - previousAvg
  const threshold = 0.2 // 200g threshold for "stable"

  if (diff > threshold) {
    return 'up'
  }

  if (diff < -threshold) {
    return 'down'
  }

  return 'stable'
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useWeightStats(entries: () => ReadonlyArray<DbWeightEntry>) {
  const stats = computed<WeightStats>(() => {
    const allEntries = entries()

    const firstEntry = allEntries[0]
    if (!firstEntry) {
      return {
        current: null,
        change7d: null,
        change30d: null,
        trend: null,
      }
    }

    const current = firstEntry.weight

    return {
      current,
      change7d: calculateChange(current, allEntries, 7),
      change30d: calculateChange(current, allEntries, 30),
      trend: calculateTrend(allEntries),
    }
  })

  return {
    stats,
  }
}
