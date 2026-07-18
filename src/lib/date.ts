/**
 * Get the start of day timestamp (local time, midnight) for a given date.
 *
 * Shared by every feature that dedups entries to one-per-day (weight
 * entries, habit entries): each stores its `date` field as this value so a
 * compound/plain index can enforce "one row per day".
 */
export function getStartOfDay(date: Date = new Date()): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
