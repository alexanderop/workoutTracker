/**
 * Pure functions for weight date calculations.
 *
 * Note: Unit conversions (kgToLbs, lbsToKg, formatWeight) are in @/lib/unitConversion.ts
 */

/**
 * Get the start of day timestamp for a given date.
 * Used for one-entry-per-day deduplication.
 */
export function getStartOfDay(date: Date = new Date()): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Get date N days ago from today.
 */
export function getDaysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

/**
 * Format date for display in history list.
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Relative change (as a fraction) above which a new entry is flagged as an outlier. */
const OUTLIER_RELATIVE_THRESHOLD = 0.2

/** Absolute change (in kg) above which a new entry is flagged as an outlier. */
const OUTLIER_ABSOLUTE_THRESHOLD_KG = 15

/**
 * Detects whether a new weight entry deviates wildly from the previous entry,
 * so the UI can ask the user to confirm before saving (e.g. a fat-fingered
 * "500" instead of "50"). Both values must be in the same unit (kg).
 *
 * An entry is an outlier when the absolute change exceeds
 * {@link OUTLIER_ABSOLUTE_THRESHOLD_KG} or the relative change exceeds
 * {@link OUTLIER_RELATIVE_THRESHOLD}.
 */
export function isOutlier(previousKg: number, nextKg: number): boolean {
  const absoluteChange = Math.abs(nextKg - previousKg)

  if (absoluteChange > OUTLIER_ABSOLUTE_THRESHOLD_KG) return true
  if (previousKg <= 0) return false

  const relativeChange = absoluteChange / previousKg
  return relativeChange > OUTLIER_RELATIVE_THRESHOLD
}
