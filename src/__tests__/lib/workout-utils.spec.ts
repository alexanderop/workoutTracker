import { describe, expect, it } from 'vitest'
import { calculate10RM, formatDuration, formatTime } from '@/lib/workout-utils'

describe('workout-utils', () => {
  describe('calculate10RM', () => {
    it('estimates 1RM using the Epley formula', () => {
      // 100 × (1 + 8/30) = 126.666... → 126.7
      expect(calculate10RM(100, 8)).toBe(126.7)
      // 60 × (1 + 12/30) = 84
      expect(calculate10RM(60, 12)).toBe(84)
    })

    it('applies the rep bonus even for a single rep', () => {
      // 100 × (1 + 1/30) = 103.333... → 103.3
      expect(calculate10RM(100, 1)).toBe(103.3)
    })

    it('returns 0 when weight or reps are 0', () => {
      expect(calculate10RM(0, 10)).toBe(0)
      expect(calculate10RM(100, 0)).toBe(0)
    })

    it('rounds to one decimal place', () => {
      // 77.5 × (1 + 7/30) = 95.583... → 95.6
      expect(calculate10RM(77.5, 7)).toBe(95.6)
    })
  })

  describe('formatTime', () => {
    it('formats seconds as M:SS', () => {
      expect(formatTime(0)).toBe('0:00')
      expect(formatTime(9)).toBe('0:09')
      expect(formatTime(60)).toBe('1:00')
      expect(formatTime(330)).toBe('5:30')
    })

    it('does not roll minutes into hours', () => {
      expect(formatTime(3661)).toBe('61:01')
    })
  })

  describe('formatDuration', () => {
    it('formats durations under an hour as m:ss', () => {
      expect(formatDuration(330)).toBe('5:30')
      expect(formatDuration(2730)).toBe('45:30')
    })

    it('formats durations of an hour or more as h:mm:ss', () => {
      expect(formatDuration(3600)).toBe('1:00:00')
      expect(formatDuration(5025)).toBe('1:23:45')
    })

    it('pads minutes and seconds with leading zeros', () => {
      expect(formatDuration(3665)).toBe('1:01:05')
    })
  })
})
