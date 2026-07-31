import { describe, expect, it } from 'vitest'
import { isOutlier, trailingAverage } from '@/features/weight/lib/weightCalculations'

describe('trailingAverage', () => {
  it('averages each value with the window preceding it', () => {
    expect(trailingAverage([80, 82, 84, 86], 3)).toEqual([80, 81, 82, 84])
  })

  it('averages over what exists before a full window has accumulated', () => {
    expect(trailingAverage([90, 92], 3)).toEqual([90, 91])
  })

  it('returns the values unchanged for a window of 1 or less', () => {
    expect(trailingAverage([80, 82, 84], 1)).toEqual([80, 82, 84])
    expect(trailingAverage([80, 82, 84], 0)).toEqual([80, 82, 84])
  })

  it('handles an empty series', () => {
    expect(trailingAverage([], 3)).toEqual([])
  })
})

describe('isOutlier', () => {
  it('should return false when the new weight is close to the previous weight', () => {
    expect(isOutlier(80, 80.5)).toBe(false)
  })

  it('should return true when the absolute jump exceeds 15kg even if the relative change is small', () => {
    // 100 -> 116 is a 16% relative change (below the 20% threshold) but a 16kg jump
    expect(isOutlier(100, 116)).toBe(true)
  })

  it('should return false when the absolute jump is exactly at the 15kg threshold', () => {
    expect(isOutlier(100, 115)).toBe(false)
  })

  it('should return true when the relative change exceeds 20% even if the absolute jump is under 15kg', () => {
    // 50 -> 61 is an 11kg jump (below 15kg) but a 22% relative change
    expect(isOutlier(50, 61)).toBe(true)
  })

  it('should return false when the relative change is exactly at the 20% threshold', () => {
    expect(isOutlier(50, 60)).toBe(false)
  })

  it('should treat large drops the same as large gains', () => {
    expect(isOutlier(100, 80)).toBe(true)
  })

  it('should return false when there is no meaningful change', () => {
    expect(isOutlier(75, 75)).toBe(false)
  })
})
