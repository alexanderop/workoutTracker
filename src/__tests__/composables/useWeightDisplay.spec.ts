import { beforeEach, describe, expect, it } from 'vitest'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { useSettingsStore } from '@/stores/settings'

/**
 * Bodyweight is logged on a scale that reads finer than whole/half units
 * (116.25 lbs, 78.35 kg). Every conversion and format step here has to carry
 * that precision through — rounding it away silently rewrites the user's data.
 */
describe('useWeightDisplay', () => {
  beforeEach(() => {
    useSettingsStore().$reset()
  })

  describe('kg (storage unit)', () => {
    it('keeps two-decimal precision when converting for storage', () => {
      const { toStorageValue } = useWeightDisplay()

      expect(toStorageValue(116.25)).toBe(116.25)
    })

    it('keeps two-decimal precision when converting for display', () => {
      const { toDisplayValue } = useWeightDisplay()

      expect(toDisplayValue(116.25)).toBe(116.25)
    })

    it('formats the second decimal instead of rounding it away', () => {
      const { formatWithUnit } = useWeightDisplay()

      expect(formatWithUnit(116.25, 1)).toBe('116.25 kg')
    })

    it('still pads to the requested minimum decimals', () => {
      const { formatWithUnit } = useWeightDisplay()

      expect(formatWithUnit(80, 1)).toBe('80.0 kg')
    })

    it('shows decimals even when none are requested', () => {
      const { formatWithUnit } = useWeightDisplay()

      expect(formatWithUnit(116.25)).toBe('116.25 kg')
    })

    it('leaves whole values undecorated when no decimals are requested', () => {
      const { formatWithUnit } = useWeightDisplay()

      expect(formatWithUnit(80)).toBe('80 kg')
    })

    it('returns a dash for a missing weight', () => {
      const { formatWithUnit } = useWeightDisplay()

      expect(formatWithUnit(undefined)).toBe('—')
    })
  })

  describe('lbs (display unit)', () => {
    beforeEach(async () => {
      await useSettingsStore().setWeightUnit('lbs')
    })

    it('does not round the display value to whole pounds', () => {
      const { toDisplayValue, toStorageValue } = useWeightDisplay()

      const kg = toStorageValue(116.25)

      expect(toDisplayValue(kg)).toBe(116.25)
    })

    it('round-trips a quarter-pound entry through storage', () => {
      const { toDisplayValue, toStorageValue } = useWeightDisplay()

      for (const entered of [116.25, 180.75, 199.5, 205.1]) {
        expect(toDisplayValue(toStorageValue(entered))).toBe(entered)
      }
    })

    it('formats a quarter-pound entry with its entered precision', () => {
      const { formatWithUnit, toStorageValue } = useWeightDisplay()

      expect(formatWithUnit(toStorageValue(116.25), 1)).toBe('116.25 lbs')
    })
  })
})
