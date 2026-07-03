import { describe, expect, it } from 'vitest'
import { formatWeight, kgToLbs, lbsToKg, WEIGHT_UNIT_LABELS } from '@/lib/unitConversion'

describe('unitConversion', () => {
  describe('kgToLbs', () => {
    it('converts kilograms to pounds', () => {
      expect(kgToLbs(100)).toBeCloseTo(220.462, 3)
      expect(kgToLbs(0)).toBe(0)
    })
  })

  describe('lbsToKg', () => {
    it('converts pounds to kilograms', () => {
      expect(lbsToKg(220.462)).toBeCloseTo(100, 3)
      expect(lbsToKg(45)).toBeCloseTo(20.412, 3)
    })

    it('round-trips with kgToLbs', () => {
      expect(lbsToKg(kgToLbs(87.5))).toBeCloseTo(87.5, 10)
    })
  })

  describe('formatWeight', () => {
    it('formats kg values with one decimal by default', () => {
      expect(formatWeight(100, 'kg')).toBe('100.0')
      expect(formatWeight(62.5, 'kg')).toBe('62.5')
    })

    it('converts to lbs before formatting when unit is lbs', () => {
      expect(formatWeight(100, 'lbs')).toBe('220.5')
      expect(formatWeight(20, 'lbs')).toBe('44.1')
    })

    it('respects a custom decimal count', () => {
      expect(formatWeight(100, 'lbs', 0)).toBe('220')
      expect(formatWeight(1.234, 'kg', 2)).toBe('1.23')
    })
  })

  describe('WEIGHT_UNIT_LABELS', () => {
    it('maps units to display labels', () => {
      expect(WEIGHT_UNIT_LABELS).toEqual({ kg: 'kg', lbs: 'lbs' })
    })
  })
})
