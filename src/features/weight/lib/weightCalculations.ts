/**
 * Pure functions for weight calculations and conversions.
 */

const KG_TO_LBS = 2.20462
const LBS_TO_KG = 1 / KG_TO_LBS

/**
 * Convert kg to lbs.
 */
export function kgToLbs(kg: number): number {
  return kg * KG_TO_LBS
}

/**
 * Convert lbs to kg.
 */
export function lbsToKg(lbs: number): number {
  return lbs * LBS_TO_KG
}

/**
 * Format weight for display with unit.
 * @param kg - Weight in kg (stored format)
 * @param unit - Display unit preference
 * @param decimals - Number of decimal places (default 1)
 */
export function formatWeight(kg: number, unit: 'kg' | 'lbs', decimals = 1): string {
  const value = unit === 'lbs' ? kgToLbs(kg) : kg
  return `${value.toFixed(decimals)} ${unit}`
}

/**
 * Parse weight input to kg.
 * @param value - Input value
 * @param unit - Unit of the input value
 */
export function parseWeightToKg(value: number, unit: 'kg' | 'lbs'): number {
  return unit === 'lbs' ? lbsToKg(value) : value
}

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
 * Calculate weight change between two values.
 * Returns positive for gain, negative for loss.
 */
export function calculateWeightChange(current: number, previous: number): number {
  return current - previous
}

/**
 * Format date for display in history list.
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format date for chart axis.
 */
export function formatDateShort(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
