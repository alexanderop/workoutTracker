import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { kgToLbs, lbsToKg, WEIGHT_UNIT_LABELS } from '@/lib/unitConversion'

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
    const kgNum = typeof kg === 'string' ? Number(kg) : kg
    if (settingsStore.weightUnit === 'lbs') {
      return Math.round(kgToLbs(kgNum))
    }
    return kgNum
  }

  /**
   * Convert display value back to kg for storage.
   */
  function toStorageValue(displayValue: number | undefined): number | undefined {
    if (displayValue === undefined) return undefined
    if (settingsStore.weightUnit === 'lbs') {
      return Math.round(lbsToKg(displayValue) * 10) / 10
    }
    return displayValue
  }

  /**
   * Format weight with unit label for display (e.g., "100 kg" or "220 lbs").
   */
  function formatWithUnit(kg: number | string | undefined, decimals = 0): string {
    const display = toDisplayValue(kg)
    if (display === undefined) return '—'
    const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display)
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
