import { describe, expect, it } from 'vitest'
import { countCompletedSets } from '@/lib/workoutStats'
import {
  createDbAmrapBlock,
  createDbPlannedSet,
  createDbSet,
  createDbStrengthBlockWithSets,
} from '@/__tests__/factories'

describe('countCompletedSets', () => {
  it('returns 0 for no blocks', () => {
    expect(countCompletedSets([])).toBe(0)
  })

  it('counts only completed sets within a strength block', () => {
    const block = createDbStrengthBlockWithSets([
      { status: 'completed' },
      { status: 'planned', completedAt: null },
      { status: 'completed' },
    ])

    expect(countCompletedSets([block])).toBe(2)
  })

  it('sums completed sets across multiple strength blocks', () => {
    const squats = createDbStrengthBlockWithSets([{ status: 'completed' }, { status: 'completed' }])
    const bench = createDbStrengthBlockWithSets([{ status: 'completed' }])

    expect(countCompletedSets([squats, bench])).toBe(3)
  })

  it('ignores non-strength blocks', () => {
    const amrap = createDbAmrapBlock()
    const strength = createDbStrengthBlockWithSets([{ status: 'completed' }])

    expect(countCompletedSets([amrap, strength])).toBe(1)
  })

  it('returns 0 when all sets are planned', () => {
    const block = createDbStrengthBlockWithSets([
      { status: 'planned', completedAt: null },
      { status: 'planned', completedAt: null },
    ])

    expect(countCompletedSets([block])).toBe(0)
  })

  it('accepts sets created via the planned-set factory', () => {
    const sets = [createDbSet(), createDbPlannedSet()]
    const block = createDbStrengthBlockWithSets(sets)

    expect(countCompletedSets([block])).toBe(1)
  })
})
