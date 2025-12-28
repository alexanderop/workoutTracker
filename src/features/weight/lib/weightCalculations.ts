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
