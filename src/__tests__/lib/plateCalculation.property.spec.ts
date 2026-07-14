import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { PLATE_CONFIG, calculatePlates, getBarWeight } from '@/lib/plateCalculation'
import type { WeightUnit } from '@/types/settings'

/**
 * Property-based tests for barbell plate calculation.
 *
 * Targets are generated in quarter-step (0.25) increments from the bar
 * weight; all plate denominations are exact binary fractions, so sums are
 * compared after rounding to 2 decimals to match the module's own rounding.
 *
 * Properties (each run for both kg and lbs):
 * 1. Constructive achievability: any target built as bar + 2 * (sum of a
 *    random multiset of available plates) is reported achievable and the
 *    returned plates reconstruct exactly that target. This verifies the
 *    greedy algorithm is complete for the configured denominations.
 * 2. Returned plates are sorted descending and drawn from availablePlates.
 * 3. Never exceeds: the reconstructed weight never exceeds the target,
 *    achievable or not.
 * 4. Below the bar is unachievable with no plates; exactly the bar is
 *    achievable with no plates.
 */

const unitArb = fc.constantFrom<WeightUnit>('kg', 'lbs')
const kgPlateArb = fc.constantFrom(...PLATE_CONFIG.kg.availablePlates)
const lbsPlateArb = fc.constantFrom(...PLATE_CONFIG.lbs.availablePlates)
const kgLoadoutArb = fc.record({
  unit: fc.constant<WeightUnit>('kg'),
  plates: fc.array(kgPlateArb, { maxLength: 8 }),
})
const lbsLoadoutArb = fc.record({
  unit: fc.constant<WeightUnit>('lbs'),
  plates: fc.array(lbsPlateArb, { maxLength: 8 }),
})
const loadoutArb = fc.oneof(kgLoadoutArb, lbsLoadoutArb)

// 0..200 in 0.25 steps above the bar weight
const quarterStepsArb = fc.integer({ min: 0, max: 800 })
const targetCaseArb = fc.record({ unit: unitArb, quarterSteps: quarterStepsArb })
// Stays >= 0 for the kg bar (20kg) when subtracted as quarter steps
const belowBarQuarterStepsArb = fc.integer({ min: 1, max: 80 })

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100
}

function sumPlates(plates: ReadonlyArray<number>): number {
  let total = 0
  for (const plate of plates) {
    total += plate
  }
  return total
}

/** Total bar weight when loading the given plates per side. */
function totalWeight(unit: WeightUnit, plates: ReadonlyArray<number>): number {
  return roundTo2(getBarWeight(unit) + 2 * sumPlates(plates))
}

function expectSortedDescending(plates: ReadonlyArray<number>): void {
  for (let index = 1; index < plates.length; index++) {
    const previous = plates[index - 1] ?? NaN
    const current = plates[index] ?? NaN
    expect(previous).toBeGreaterThanOrEqual(current)
  }
}

describe('plateCalculation (property-based)', () => {
  it('achieves every target constructible from available plates', () => {
    fc.assert(
      fc.property(loadoutArb, ({ unit, plates }) => {
        const target = totalWeight(unit, plates)

        const result = calculatePlates(target, unit)

        expect(result.isAchievable).toBe(true)
        expect(totalWeight(unit, result.plates)).toBe(target)
      }),
    )
  })

  it('returns plates sorted descending, each from the available set', () => {
    fc.assert(
      fc.property(targetCaseArb, ({ unit, quarterSteps }) => {
        const target = getBarWeight(unit) + quarterSteps / 4

        const result = calculatePlates(target, unit)

        const available: ReadonlyArray<number> = PLATE_CONFIG[unit].availablePlates
        for (const plate of result.plates) {
          expect(available).toContain(plate)
        }
        expectSortedDescending(result.plates)
      }),
    )
  })

  it('never exceeds the target weight', () => {
    fc.assert(
      fc.property(targetCaseArb, ({ unit, quarterSteps }) => {
        const target = getBarWeight(unit) + quarterSteps / 4

        const result = calculatePlates(target, unit)

        expect(totalWeight(unit, result.plates)).toBeLessThanOrEqual(roundTo2(target))
      }),
    )
  })

  it('rejects any target below the bar weight', () => {
    fc.assert(
      fc.property(unitArb, belowBarQuarterStepsArb, (unit, quarterSteps) => {
        const barWeight = getBarWeight(unit)

        expect(calculatePlates(barWeight - quarterSteps / 4, unit)).toEqual({
          plates: [],
          isAchievable: false,
        })
      }),
    )
  })

  it('exactly the bar weight is achievable with no plates', () => {
    for (const unit of ['kg', 'lbs'] as const) {
      expect(calculatePlates(getBarWeight(unit), unit)).toEqual({
        plates: [],
        isAchievable: true,
      })
    }
  })
})
