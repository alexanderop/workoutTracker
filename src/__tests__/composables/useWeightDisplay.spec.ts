import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import { useSettingsStore } from '@/stores/settings'

describe('useWeightDisplay', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('unit and unitLabel', () => {
    it('returns kg when weightUnit is kg', () => {
      const { unit, unitLabel } = useWeightDisplay()
      expect(unit.value).toBe('kg')
      expect(unitLabel.value).toBe('kg')
    })

    it('returns lbs when weightUnit is lbs', () => {
      const settingsStore = useSettingsStore()
      settingsStore.weightUnit = 'lbs'

      const { unit, unitLabel } = useWeightDisplay()
      expect(unit.value).toBe('lbs')
      expect(unitLabel.value).toBe('lbs')
    })
  })

  describe('toDisplayValue', () => {
    it('returns kg value when unit is kg', () => {
      const { toDisplayValue } = useWeightDisplay()
      expect(toDisplayValue(100)).toBe(100)
    })

    it('converts to lbs when unit is lbs', () => {
      const settingsStore = useSettingsStore()
      settingsStore.weightUnit = 'lbs'

      const { toDisplayValue } = useWeightDisplay()
      expect(toDisplayValue(100)).toBe(220) // 100 * 2.20462 rounded
    })

    it('handles string input', () => {
      const { toDisplayValue } = useWeightDisplay()
      expect(toDisplayValue('50')).toBe(50)
    })

    it('returns undefined for undefined input', () => {
      const { toDisplayValue } = useWeightDisplay()
      expect(toDisplayValue(undefined)).toBeUndefined()
    })

    it('returns undefined for empty string input', () => {
      const { toDisplayValue } = useWeightDisplay()
      expect(toDisplayValue('')).toBeUndefined()
    })

    it('converts fractional kg values to rounded lbs', () => {
      const settingsStore = useSettingsStore()
      settingsStore.weightUnit = 'lbs'

      const { toDisplayValue } = useWeightDisplay()
      expect(toDisplayValue(45.5)).toBe(100) // 45.5 * 2.20462 ≈ 100.3 → 100
    })
  })

  describe('toStorageValue', () => {
    it('returns value as-is when unit is kg', () => {
      const { toStorageValue } = useWeightDisplay()
      expect(toStorageValue(100)).toBe(100)
    })

    it('converts lbs to kg when unit is lbs', () => {
      const settingsStore = useSettingsStore()
      settingsStore.weightUnit = 'lbs'

      const { toStorageValue } = useWeightDisplay()
      // 220 lbs ≈ 99.79 kg, rounded to 1 decimal = 99.8
      expect(toStorageValue(220)).toBeCloseTo(99.8, 1)
    })

    it('returns undefined for undefined input', () => {
      const { toStorageValue } = useWeightDisplay()
      expect(toStorageValue(undefined)).toBeUndefined()
    })
  })

  describe('formatWithUnit', () => {
    it('formats kg with unit label', () => {
      const { formatWithUnit } = useWeightDisplay()
      expect(formatWithUnit(100)).toBe('100 kg')
    })

    it('formats lbs with unit label', () => {
      const settingsStore = useSettingsStore()
      settingsStore.weightUnit = 'lbs'

      const { formatWithUnit } = useWeightDisplay()
      expect(formatWithUnit(100)).toBe('220 lbs')
    })

    it('returns em dash for undefined', () => {
      const { formatWithUnit } = useWeightDisplay()
      expect(formatWithUnit(undefined)).toBe('—')
    })

    it('handles string input', () => {
      const { formatWithUnit } = useWeightDisplay()
      expect(formatWithUnit('50')).toBe('50 kg')
    })

    it('respects decimals parameter', () => {
      const { formatWithUnit } = useWeightDisplay()
      expect(formatWithUnit(100.567, 1)).toBe('100.6 kg')
    })
  })

  describe('reactivity', () => {
    it('updates display when unit setting changes', () => {
      const settingsStore = useSettingsStore()
      const { toDisplayValue, unitLabel } = useWeightDisplay()

      expect(toDisplayValue(100)).toBe(100)
      expect(unitLabel.value).toBe('kg')

      settingsStore.weightUnit = 'lbs'

      expect(toDisplayValue(100)).toBe(220)
      expect(unitLabel.value).toBe('lbs')
    })
  })
})
