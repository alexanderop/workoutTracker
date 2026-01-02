import { describe, it, expect } from 'vitest'
import { calculatePlates, getBarWeight, PLATE_CONFIG } from '@/lib/plateCalculation'

describe('plateCalculation', () => {
  describe('calculatePlates (kg)', () => {
    it('returns empty plates when weight equals bar weight', () => {
      const result = calculatePlates(20, 'kg')

      expect(result.plates).toEqual([])
      expect(result.isAchievable).toBe(true)
    })

    it('returns empty plates when weight is less than bar weight', () => {
            const result = calculatePlates(15, 'kg')

      expect(result.plates).toEqual([])
      expect(result.isAchievable).toBe(false)
    })

    it('calculates plates for 60kg (one 20kg plate per side)', () => {
            // (60 - 20) / 2 = 20kg per side = one 20kg plate
      const result = calculatePlates(60, 'kg')

      expect(result.plates).toEqual([20])
      expect(result.isAchievable).toBe(true)
    })

    it('calculates plates for 100kg (two 20kg plates per side)', () => {
      // (100 - 20) / 2 = 40kg per side = 20 + 20 (20kg prioritized over 25kg)
      const result = calculatePlates(100, 'kg')

      expect(result.plates).toEqual([20, 20])
      expect(result.isAchievable).toBe(true)
    })

    it('calculates plates for 90kg (20+15 plates per side)', () => {
      // (90 - 20) / 2 = 35kg per side = 20 + 15
      const result = calculatePlates(90, 'kg')

      expect(result.plates).toEqual([20, 15])
      expect(result.isAchievable).toBe(true)
    })

    it('calculates plates with small weights (27.5kg total)', () => {
            // (27.5 - 20) / 2 = 3.75kg per side = 2.5 + 1.25
      const result = calculatePlates(27.5, 'kg')

      expect(result.plates).toEqual([2.5, 1.25])
      expect(result.isAchievable).toBe(true)
    })

    it('returns not achievable for impossible weight (21kg)', () => {
            // (21 - 20) / 2 = 0.5kg per side (not achievable with 1.25kg smallest)
      const result = calculatePlates(21, 'kg')

      expect(result.plates).toEqual([])
      expect(result.isAchievable).toBe(false)
    })

    it('handles multiple same plates (180kg)', () => {
      // (180 - 20) / 2 = 80kg per side = 20+20+20+20 (four 20kg plates)
      const result = calculatePlates(180, 'kg')

      expect(result.plates).toEqual([20, 20, 20, 20])
      expect(result.isAchievable).toBe(true)
    })

    it('handles decimal precision correctly (25kg total)', () => {
            // (25 - 20) / 2 = 2.5kg per side
      const result = calculatePlates(25, 'kg')

      expect(result.plates).toEqual([2.5])
      expect(result.isAchievable).toBe(true)
    })
  })

  describe('calculatePlates (lbs)', () => {
    it('returns empty plates when weight equals bar weight (45lb)', () => {
            const result = calculatePlates(45, 'lbs')

      expect(result.plates).toEqual([])
      expect(result.isAchievable).toBe(true)
    })

    it('returns empty plates when weight is less than bar weight', () => {
            const result = calculatePlates(35, 'lbs')

      expect(result.plates).toEqual([])
      expect(result.isAchievable).toBe(false)
    })

    it('calculates plates for 135lb (one 45lb plate per side)', () => {
            // (135 - 45) / 2 = 45lb per side
      const result = calculatePlates(135, 'lbs')

      expect(result.plates).toEqual([45])
      expect(result.isAchievable).toBe(true)
    })

    it('calculates plates for 225lb (two 45lb plates per side)', () => {
            // (225 - 45) / 2 = 90lb per side = 45+45
      const result = calculatePlates(225, 'lbs')

      expect(result.plates).toEqual([45, 45])
      expect(result.isAchievable).toBe(true)
    })

    it('calculates plates for 185lb (45+25 plates per side)', () => {
            // (185 - 45) / 2 = 70lb per side = 45+25
      const result = calculatePlates(185, 'lbs')

      expect(result.plates).toEqual([45, 25])
      expect(result.isAchievable).toBe(true)
    })

    it('calculates plates with small weights (50lb total)', () => {
            // (50 - 45) / 2 = 2.5lb per side
      const result = calculatePlates(50, 'lbs')

      expect(result.plates).toEqual([2.5])
      expect(result.isAchievable).toBe(true)
    })
  })

  describe('getBarWeight', () => {
    it('returns 20 for kg', () => {
            expect(getBarWeight('kg')).toBe(20)
    })

    it('returns 45 for lbs', () => {
            expect(getBarWeight('lbs')).toBe(45)
    })
  })

  describe('PLATE_CONFIG', () => {
    it('exposes plate configuration with 20kg prioritized over 25kg', () => {
      expect(PLATE_CONFIG.kg.barWeight).toBe(20)
      // 20kg comes before 25kg (more common at gyms)
      expect(PLATE_CONFIG.kg.availablePlates).toEqual([20, 25, 15, 10, 5, 2.5, 1.25])

      expect(PLATE_CONFIG.lbs.barWeight).toBe(45)
      expect(PLATE_CONFIG.lbs.availablePlates).toEqual([45, 35, 25, 10, 5, 2.5])
    })
  })
})
