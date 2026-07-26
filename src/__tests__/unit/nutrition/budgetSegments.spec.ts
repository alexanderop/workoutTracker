import { describe, expect, it } from 'vitest'
import { budgetSegments } from '@/features/nutrition/lib/nutritionCalculations'

describe('budgetSegments', () => {
  it('lays committed and staged out against the target while under it', () => {
    expect(budgetSegments(1100, 550, 2200)).toEqual({
      committedPct: 50,
      stagedPct: 25,
      tickPct: 100,
      overflow: false,
    })
  })

  it('rescales past the target instead of clamping, so overflow stays legible', () => {
    const barelyOver = budgetSegments(2200, 10, 2200)
    const wildlyOver = budgetSegments(2200, 1800, 2200)

    expect(barelyOver.tickPct).toBeCloseTo(99.55, 2)
    expect(wildlyOver.tickPct).toBeCloseTo(55, 10)
    // The defect this exists to close: a clamped bar renders these identically.
    expect(barelyOver.tickPct).not.toBeCloseTo(wildlyOver.tickPct, 1)
  })

  it('fills the bar exactly when the total sits on the target', () => {
    const segments = budgetSegments(1200, 1000, 2200)

    expect(segments.committedPct + segments.stagedPct).toBeCloseTo(100, 10)
    expect(segments.tickPct).toBe(100)
    expect(segments.overflow).toBe(false)
  })

  it('flags overflow only once the total passes the target', () => {
    expect(budgetSegments(2200, 0, 2200).overflow).toBe(false)
    expect(budgetSegments(2201, 0, 2200).overflow).toBe(true)
    expect(budgetSegments(0, 2201, 2200).overflow).toBe(true)
  })

  it('never lets committed plus staged exceed the bar', () => {
    const segments = budgetSegments(3000, 1000, 2200)

    expect(segments.committedPct + segments.stagedPct).toBeCloseTo(100, 10)
  })

  it('treats a zero or negative target as unmeasurable rather than dividing by it', () => {
    expect(budgetSegments(500, 0, 0)).toEqual({
      committedPct: 0,
      stagedPct: 0,
      tickPct: 0,
      overflow: true,
    })
    expect(budgetSegments(0, 0, 0).overflow).toBe(false)
  })

  it('floors negative inputs at zero rather than drawing backwards', () => {
    expect(budgetSegments(-100, 1100, 2200)).toMatchObject({ committedPct: 0, stagedPct: 50 })
  })
})
