import { useI18n } from 'vue-i18n'
import { formatDuration } from '@/lib/formatters'

/**
 * Check if a personal best exists (type guard).
 */
function hasPb(pb: number | null | undefined): pb is number {
  return pb !== null && pb !== undefined
}

/**
 * Display formatting for benchmark personal best times.
 *
 * Provides consistent formatting across list and detail views:
 * - null/undefined: No PB section shown (detail) or "No PB yet" (list)
 * - number: Formatted time with "PB: " prefix (list) or large display (detail)
 */
export function usePersonalBestDisplay() {
  const { t } = useI18n()

  /**
   * Format PB for compact list display.
   * Returns "No PB yet" if no PB exists, otherwise "PB: MM:SS".
   */
  function formatCompact(pb: number | null | undefined): string {
    if (!hasPb(pb)) {
      return t('workouts.benchmarks.noPbYet')
    }
    return `${t('workouts.benchmarks.pbLabel')}: ${formatDuration(pb)}`
  }

  /**
   * Format PB time without prefix for hero/large display.
   * Returns formatted duration like "14:45" or "1:23:45".
   */
  function formatHero(pb: number): string {
    return formatDuration(pb)
  }

  /**
   * Get ARIA label for PB display (accessibility).
   * Provides screen reader-friendly description.
   */
  function getAriaLabel(pb: number | null | undefined, benchmarkName: string): string {
    if (!hasPb(pb)) {
      return `${benchmarkName}, ${t('workouts.benchmarks.noPbYet')}`
    }
    const formattedTime = formatDuration(pb)
    return `${benchmarkName}, ${t('workouts.benchmarks.personalBest')}: ${formattedTime}`
  }

  return {
    hasPb,
    formatCompact,
    formatHero,
    getAriaLabel,
  }
}
