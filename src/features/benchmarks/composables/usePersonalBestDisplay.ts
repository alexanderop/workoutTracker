import { useI18n } from 'vue-i18n'
import { hasPb, formatHeroPb } from '@/features/benchmarks/lib/pbFormatting'
import { formatDuration } from '@/lib/formatters'

/**
 * Display formatting for benchmark personal best times.
 * Thin composable wrapper providing i18n-aware formatting.
 *
 * Pure functions (hasPb, formatHeroPb) are exported from lib/pbFormatting.ts.
 * This composable adds i18n dependency for translated strings.
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
    formatHero: formatHeroPb,
    getAriaLabel,
  }
}
