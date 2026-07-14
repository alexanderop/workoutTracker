import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { formatWeight, kgToLbs, lbsToKg } from '@/lib/unitConversion'

/**
 * Property-based tests for kg <-> lbs conversion.
 *
 * Storage is always kg; lbs only exists at the display boundary. The
 * conversion pair must be a (floating-point-tolerant) bijection on the
 * realistic weight range so no data drifts when users switch units.
 */

const weightArb = fc.double({
  min: 0,
  max: 1000,
  noNaN: true,
  noDefaultInfinity: true,
})

describe('unit conversion (property-based)', () => {
  it('round-trips kg -> lbs -> kg within floating-point tolerance', () => {
    fc.assert(
      fc.property(weightArb, (kg) => {
        const roundTripped = lbsToKg(kgToLbs(kg))
        expect(roundTripped).toBeCloseTo(kg, 9)
      }),
    )
  })

  it('round-trips lbs -> kg -> lbs within floating-point tolerance', () => {
    fc.assert(
      fc.property(weightArb, (lbs) => {
        const roundTripped = kgToLbs(lbsToKg(lbs))
        expect(roundTripped).toBeCloseTo(lbs, 9)
      }),
    )
  })

  it('is strictly monotonic: more kg is always more lbs', () => {
    fc.assert(
      fc.property(weightArb, weightArb, (a, b) => {
        // Below ~1e-6 kg apart, float rounding could legitimately collapse
        // the converted values; no real weight input is that granular
        fc.pre(Math.abs(a - b) > 1e-6)
        const [lighter, heavier] = a < b ? [a, b] : [b, a]
        expect(kgToLbs(lighter)).toBeLessThan(kgToLbs(heavier))
      }),
    )
  })

  it('preserves zero and never produces negative weights from non-negative input', () => {
    expect(kgToLbs(0)).toBe(0)
    expect(lbsToKg(0)).toBe(0)
    fc.assert(
      fc.property(weightArb, (kg) => {
        expect(kgToLbs(kg)).toBeGreaterThanOrEqual(0)
        expect(lbsToKg(kg)).toBeGreaterThanOrEqual(0)
      }),
    )
  })

  it('formatWeight agrees with the raw conversion in both units', () => {
    fc.assert(
      fc.property(weightArb, fc.integer({ min: 0, max: 3 }), (kg, decimals) => {
        expect(formatWeight(kg, 'kg', decimals)).toBe(kg.toFixed(decimals))
        expect(formatWeight(kg, 'lbs', decimals)).toBe(kgToLbs(kg).toFixed(decimals))
      }),
    )
  })
})
