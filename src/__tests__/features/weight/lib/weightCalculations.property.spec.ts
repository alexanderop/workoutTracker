import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { isOutlier } from '@/features/weight/lib/weightCalculations'

/**
 * Property-based tests for the bodyweight outlier detector.
 *
 * `isOutlier` flags a new entry when the absolute change exceeds 15kg or,
 * for a positive previous weight, the relative change exceeds 20%. All
 * weights are generated on a 0.1kg grid (integers scaled by 10) so float
 * rounding stays far from the thresholds; exact-boundary equality cases
 * are skipped with fc.pre.
 */

// Scaled tenths of a kg: 1..3000 -> 0.1kg..300kg
const previousTenthsArb = fc.integer({ min: 1, max: 3000 })
const deltaTenthsArb = fc.integer({ min: 0, max: 3000 })

function applyChange(previous: number, delta: number, gain: boolean): number {
  return gain ? previous + delta : previous - delta
}

describe('isOutlier (property-based)', () => {
  it('is symmetric in the direction of change for positive previous weights', () => {
    fc.assert(
      fc.property(previousTenthsArb, deltaTenthsArb, (previousTenths, deltaTenths) => {
        fc.pre(deltaTenths !== 150) // exact 15kg absolute boundary
        fc.pre(deltaTenths * 5 !== previousTenths) // exact 20% relative boundary
        const previous = previousTenths / 10
        const delta = deltaTenths / 10
        expect(isOutlier(previous, previous + delta)).toBe(isOutlier(previous, previous - delta))
      }),
    )
  })

  it('flags every change whose absolute difference exceeds 15kg', () => {
    fc.assert(
      fc.property(
        previousTenthsArb,
        fc.integer({ min: 151, max: 3000 }),
        fc.boolean(),
        (previousTenths, deltaTenths, gain) => {
          const previous = previousTenths / 10
          const next = applyChange(previous, deltaTenths / 10, gain)
          expect(isOutlier(previous, next)).toBe(true)
        },
      ),
    )
  })

  it('flags relative changes above 20% for positive previous weights', () => {
    fc.assert(
      fc.property(
        previousTenthsArb,
        deltaTenthsArb,
        fc.boolean(),
        (previousTenths, deltaTenths, gain) => {
          fc.pre(deltaTenths * 5 > previousTenths) // strictly above the 20% boundary
          const previous = previousTenths / 10
          const next = applyChange(previous, deltaTenths / 10, gain)
          expect(isOutlier(previous, next)).toBe(true)
        },
      ),
    )
  })

  it('accepts changes that are small in both the absolute and the relative sense', () => {
    fc.assert(
      fc.property(
        previousTenthsArb,
        fc.integer({ min: 0, max: 149 }), // strictly below the 15kg boundary
        fc.boolean(),
        (previousTenths, deltaTenths, gain) => {
          fc.pre(deltaTenths * 5 < previousTenths) // strictly below the 20% boundary
          const previous = previousTenths / 10
          const next = applyChange(previous, deltaTenths / 10, gain)
          expect(isOutlier(previous, next)).toBe(false)
        },
      ),
    )
  })

  it('flags changes above 15kg but not below when the previous weight is non-positive', () => {
    // Same shape as the positive-weight properties: assert the verdict on
    // either side of the threshold instead of re-computing the formula.
    const nonPositivePreviousArb = fc.integer({ min: -3000, max: 0 })
    fc.assert(
      fc.property(
        nonPositivePreviousArb,
        fc.integer({ min: 151, max: 3000 }), // strictly above the 15kg boundary
        fc.boolean(),
        (previousTenths, deltaTenths, gain) => {
          const previous = previousTenths / 10
          expect(isOutlier(previous, applyChange(previous, deltaTenths / 10, gain))).toBe(true)
        },
      ),
    )
    fc.assert(
      fc.property(
        nonPositivePreviousArb,
        fc.integer({ min: 0, max: 149 }), // strictly below the 15kg boundary
        fc.boolean(),
        (previousTenths, deltaTenths, gain) => {
          const previous = previousTenths / 10
          expect(isOutlier(previous, applyChange(previous, deltaTenths / 10, gain))).toBe(false)
        },
      ),
    )
  })

  // The properties above fc.pre-skip the exact boundaries, so pin their
  // inclusivity here: both thresholds are strict (> not >=).
  it('accepts changes landing exactly on the 15kg or 20% boundary', () => {
    expect(isOutlier(100, 115)).toBe(false) // exactly 15kg, 15% relative
    expect(isOutlier(100, 85)).toBe(false)
    expect(isOutlier(70, 84)).toBe(false) // exactly 20%, 14kg absolute
    expect(isOutlier(70, 56)).toBe(false)
    expect(isOutlier(100, 115.5)).toBe(true) // just above absolute
    expect(isOutlier(70, 84.5)).toBe(true) // just above relative
  })

  it('is monotonic in distance: anything strictly between an accepted pair is accepted', () => {
    fc.assert(
      fc.property(
        previousTenthsArb,
        fc.integer({ min: 1, max: 160 }),
        fc.integer({ min: 0, max: 2999 }),
        fc.boolean(),
        (previousTenths, deltaTenths, closerSeed, gain) => {
          const closerTenths = closerSeed % deltaTenths // 0 <= closer < delta
          const previous = previousTenths / 10
          const next = applyChange(previous, deltaTenths / 10, gain)
          fc.pre(!isOutlier(previous, next))
          const closer = applyChange(previous, closerTenths / 10, gain)
          expect(isOutlier(previous, closer)).toBe(false)
        },
      ),
    )
  })
})
