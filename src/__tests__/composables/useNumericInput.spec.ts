import { describe, it, expect } from 'vitest'
import { useNumericInput } from '@/components/ui/numeric-input/useNumericInput'

describe('useNumericInput', () => {
  describe('generateWheelValues', () => {
    it('generates values centered around current value', () => {
      const { generateWheelValues } = useNumericInput()
      const values = generateWheelValues(20, { step: 2.5, range: 10 })

      expect(values).toContain(20) // Current value included
      expect(values[0]).toBe(10) // 20 - 10 = 10
      expect(values[values.length - 1]).toBe(30) // 20 + 10 = 30
    })

    it('respects min bound of 0', () => {
      const { generateWheelValues } = useNumericInput()
      const values = generateWheelValues(5, { step: 2.5, range: 10 })

      expect(values[0]).toBe(0) // Should not go below 0
      expect(values).toContain(5)
    })

    it('generates integer steps for reps', () => {
      const { generateWheelValues } = useNumericInput()
      const values = generateWheelValues(10, { step: 1, range: 5 })

      expect(values).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    })

    it('generates values with decimal steps for weight', () => {
      const { generateWheelValues } = useNumericInput()
      const values = generateWheelValues(20, { step: 2.5, range: 5 })

      expect(values).toContain(17.5)
      expect(values).toContain(20)
      expect(values).toContain(22.5)
    })
  })

  describe('getPresetConfig', () => {
    it('returns weight config with decimal step', () => {
      const { getPresetConfig } = useNumericInput()
      const config = getPresetConfig('weight')

      expect(config.step).toBe(2.5)
      expect(config.allowDecimal).toBe(true)
      expect(config.min).toBe(0)
    })

    it('returns reps config with integer step', () => {
      const { getPresetConfig } = useNumericInput()
      const config = getPresetConfig('reps')

      expect(config.step).toBe(1)
      expect(config.allowDecimal).toBe(false)
      expect(config.min).toBe(1)
    })

    it('returns rir config with constrained range', () => {
      const { getPresetConfig } = useNumericInput()
      const config = getPresetConfig('rir')

      expect(config.step).toBe(1)
      expect(config.allowDecimal).toBe(false)
      expect(config.min).toBe(0)
      expect(config.max).toBe(10)
    })
  })

  describe('clampValue', () => {
    it('clamps value above max to max', () => {
      const { clampValue } = useNumericInput()
      expect(clampValue(150, { min: 0, max: 100 })).toBe(100)
    })

    it('clamps value below min to min', () => {
      const { clampValue } = useNumericInput()
      expect(clampValue(-5, { min: 0, max: 100 })).toBe(0)
    })

    it('returns value unchanged when within bounds', () => {
      const { clampValue } = useNumericInput()
      expect(clampValue(50, { min: 0, max: 100 })).toBe(50)
    })
  })

  describe('appendDigit', () => {
    it('appends digit to existing value', () => {
      const { appendDigit } = useNumericInput()
      expect(appendDigit(20, '5')).toBe(205)
    })

    it('handles appending to zero', () => {
      const { appendDigit } = useNumericInput()
      expect(appendDigit(0, '5')).toBe(5)
    })

    it('handles appending zero to non-zero', () => {
      const { appendDigit } = useNumericInput()
      expect(appendDigit(5, '0')).toBe(50)
    })

    it('prevents appending zero to zero', () => {
      const { appendDigit } = useNumericInput()
      expect(appendDigit(0, '0')).toBe(0)
    })

    it('respects max constraint', () => {
      const { appendDigit } = useNumericInput()
      expect(appendDigit(99, '9', { max: 100 })).toBe(99)
    })
  })

  describe('removeDigit', () => {
    it('removes last digit from value', () => {
      const { removeDigit } = useNumericInput()
      expect(removeDigit(205)).toBe(20)
    })

    it('returns 0 when single digit removed', () => {
      const { removeDigit } = useNumericInput()
      expect(removeDigit(5)).toBe(0)
    })

    it('keeps 0 when already zero', () => {
      const { removeDigit } = useNumericInput()
      expect(removeDigit(0)).toBe(0)
    })
  })

  describe('appendDecimal', () => {
    it('adds decimal point to integer', () => {
      const { appendDecimal } = useNumericInput()
      expect(appendDecimal(20)).toBe('20.')
    })

    it('does not add decimal if already has one', () => {
      const { appendDecimal } = useNumericInput()
      expect(appendDecimal(20.5)).toBe('20.5')
    })
  })

  describe('formatDisplayValue', () => {
    it('formats integer without decimals', () => {
      const { formatDisplayValue } = useNumericInput()
      expect(formatDisplayValue(20, { allowDecimal: false })).toBe('20')
    })

    it('formats weight with up to 2 decimals', () => {
      const { formatDisplayValue } = useNumericInput()
      expect(formatDisplayValue(20.5, { allowDecimal: true })).toBe('20.5')
      expect(formatDisplayValue(20.25, { allowDecimal: true })).toBe('20.25')
    })

    it('removes trailing zeros', () => {
      const { formatDisplayValue } = useNumericInput()
      expect(formatDisplayValue(20.0, { allowDecimal: true })).toBe('20')
    })
  })
})
