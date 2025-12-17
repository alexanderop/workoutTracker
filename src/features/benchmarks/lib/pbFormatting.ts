import { formatDuration } from '@/lib/formatters'

/**
 * Check if a personal best exists (type guard).
 * Pure function - no state dependencies.
 */
export function hasPb(pb: number | null | undefined): pb is number {
  return pb !== null && pb !== undefined
}

/**
 * Format PB time for hero/large display.
 * Returns formatted duration like "14:45" or "1:23:45".
 * Pure function - no state dependencies.
 */
export function formatHeroPb(pb: number): string {
  return formatDuration(pb)
}
