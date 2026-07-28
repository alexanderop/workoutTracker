import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { kgToLbs, lbsToKg, WEIGHT_UNIT_LABELS } from '@/lib/unitConversion'

/**
 * Precision a weight is shown and entered with. Scales read to a hundredth of
 * a unit (116.25 lbs, 78.35 kg), so anything coarser rewrites what was typed.
 */
const DISPLAY_DECIMALS = 2

/**
 * Precision kg is stored with. One digit finer than the display precision:
 * 0.01 lbs is ~0.0045 kg, so rounding storage to two decimals would round a
 * quarter-pound entry into a different pound value on the way back out.
 */
const STORAGE_DECIMALS = 3

const TRAILING_ZEROS = /0+$/

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Format with at least `minDecimals` and at most `maxDecimals` fraction
 * digits, so `80` stays "80.0" while `116.25` keeps both digits.
 */
function formatDecimals(value: number, minDecimals: number, maxDecimals: number): string {
  const [whole = '', fraction = ''] = value.toFixed(maxDecimals).split('.')
  const kept = fraction.replace(TRAILING_ZEROS, '').padEnd(minDecimals, '0')
  return kept ? `${whole}.${kept}` : whole
}

/**
 * Composable for weight unit conversion between stored kg and display unit.
 * Internal storage is always kg; display converts to user's preferred unit.
 */
export function useWeightDisplay() {
  const settingsStore = useSettingsStore()

  const unit = computed(() => settingsStore.weightUnit)
  const unitLabel = computed(() => WEIGHT_UNIT_LABELS[settingsStore.weightUnit])

  /**
   * Convert stored kg value to display value based on user's unit preference.
   */
  function toDisplayValue(kg: number | string | undefined): number | undefined {
    if (kg === undefined || kg === '') return undefined
    const kgNumber = typeof kg === 'string' ? Number(kg) : kg
    if (settingsStore.weightUnit === 'lbs') {
      return roundTo(kgToLbs(kgNumber), DISPLAY_DECIMALS)
    }
    return kgNumber
  }

  /**
   * Convert display value back to kg for storage.
   */
  function toStorageValue(displayValue: number | undefined): number | undefined {
    if (displayValue === undefined) return undefined
    if (settingsStore.weightUnit === 'lbs') {
      return roundTo(lbsToKg(displayValue), STORAGE_DECIMALS)
    }
    return displayValue
  }

  /**
   * Format weight with unit label for display (e.g., "100 kg" or "220.5 lbs").
   * `decimals` is the minimum shown; entered precision beyond it is kept.
   */
  function formatWithUnit(kg: number | string | undefined, decimals = 0): string {
    const display = toDisplayValue(kg)
    if (display === undefined) return '—'
    const formatted = formatDecimals(display, decimals, Math.max(decimals, DISPLAY_DECIMALS))
    return `${formatted} ${unitLabel.value}`
  }

  return {
    unit,
    unitLabel,
    toDisplayValue,
    toStorageValue,
    formatWithUnit,
  }
}
