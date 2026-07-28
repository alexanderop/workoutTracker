import { computed, type ComputedRef } from 'vue'
import { getCurrentLocale, type SupportedLocale } from '@/lib/dateLocale'

export type UseNumberLocaleReturn = {
  locale: ComputedRef<SupportedLocale>
  intlLocale: ComputedRef<string>
  decimalSeparator: ComputedRef<string>
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  parseNumber: (input: string) => number | undefined
  formatWeight: (value: number, decimals?: number) => string
  formatInputValue: (value: number, allowDecimal: boolean) => string
}

/**
 * Map app locale to Intl locale string for NumberFormat.
 */
const INTL_LOCALE_MAP: Record<SupportedLocale, string> = {
  en: 'en-US',
  de: 'de-DE',
}

/**
 * Map app locale to decimal separator character.
 */
const DECIMAL_SEPARATOR_MAP: Record<SupportedLocale, string> = {
  en: '.',
  de: ',',
}

/**
 * Parse a locale-formatted string back to a number.
 * Handles both period and comma as decimal separators.
 */
function parseNumber(input: string): number | undefined {
  if (!input || input.trim() === '') return undefined

  // Normalize: replace comma with period for JS parsing
  const normalized = input.replace(',', '.')
  const parsed = Number.parseFloat(normalized)

  return Number.isNaN(parsed) ? undefined : parsed
}

/**
 * Composable for locale-aware number formatting and parsing.
 * Ties decimal separator to app language setting.
 */
export function useNumberLocale(): UseNumberLocaleReturn {
  const locale = computed(() => getCurrentLocale())

  const intlLocale = computed(() => INTL_LOCALE_MAP[locale.value])

  const decimalSeparator = computed(() => DECIMAL_SEPARATOR_MAP[locale.value])

  /**
   * Format a number for display using current locale.
   */
  function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return value.toLocaleString(intlLocale.value, options)
  }

  /**
   * Format a number for weight display (respects decimals).
   */
  function formatWeight(value: number, decimals = 2): string {
    return formatNumber(value, {
      maximumFractionDigits: decimals,
      useGrouping: false,
    })
  }

  /**
   * Format a numeric input value for display (0-2 decimal places).
   * Used by NumericPresetList and NumericValueDisplay.
   *
   * Two decimals because the keypad accepts two: showing 116.3 for a typed
   * 116.25 would misreport the value the confirm button commits.
   */
  function formatInputValue(value: number, allowDecimal: boolean): string {
    if (allowDecimal) {
      return formatNumber(value, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: false,
      })
    }
    return String(value)
  }

  return {
    locale,
    intlLocale,
    decimalSeparator,
    formatNumber,
    parseNumber,
    formatWeight,
    formatInputValue,
  }
}
