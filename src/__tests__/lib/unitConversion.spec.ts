import { describe, expect, it } from 'vitest'
import {
  kgToLbs,
  lbsToKg,
  formatWeight,
  toKg,
  cmToFtIn,
  ftInToCm,
  formatHeight,
  toCm,
} from '@/lib/unitConversion'

describe('unitConversion', () => {
  describe('weight conversions', () => {
    it('converts kg to lbs correctly', () => {
      expect(kgToLbs(1)).toBeCloseTo(2.205, 2)
      expect(kgToLbs(100)).toBeCloseTo(220.46, 1)
      expect(kgToLbs(0)).toBe(0)
    })

    it('converts lbs to kg correctly', () => {
      expect(lbsToKg(2.205)).toBeCloseTo(1, 2)
      expect(lbsToKg(220)).toBeCloseTo(99.79, 1)
      expect(lbsToKg(0)).toBe(0)
    })

    it('formats weight in kg', () => {
      expect(formatWeight(100, 'kg')).toBe('100.0')
      expect(formatWeight(50.5, 'kg', 0)).toBe('51')
    })

    it('formats weight in lbs', () => {
      expect(formatWeight(100, 'lbs')).toBe('220.5')
      expect(formatWeight(45.35, 'lbs', 0)).toBe('100')
    })

    it('converts display value to kg', () => {
      expect(toKg(100, 'kg')).toBe(100)
      expect(toKg(220, 'lbs')).toBeCloseTo(99.79, 1)
    })
  })

  describe('height conversions', () => {
    it('converts cm to feet and inches correctly', () => {
      const result = cmToFtIn(180)
      expect(result.feet).toBe(5)
      expect(result.inches).toBe(11)
    })

    it('converts 6 feet to cm correctly', () => {
      expect(ftInToCm(6, 0)).toBeCloseTo(182.88, 0)
    })

    it('formats height in cm', () => {
      expect(formatHeight(180, 'cm')).toBe('180 cm')
    })

    it('formats height in ft-in', () => {
      expect(formatHeight(180, 'ft-in')).toBe('5\'11"')
    })

    it('converts display value to cm', () => {
      expect(toCm(180, 'cm')).toBe(180)
      expect(toCm(6, 'ft-in', 0)).toBeCloseTo(182.88, 0)
    })
  })
})
