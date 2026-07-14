import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import type {
  DbCompletedWorkout,
  DbForTimeBlock,
  DbForTimeResult,
  DbWorkoutBlock,
} from '@/db/schema'
import {
  extractSplitTimes,
  findPbWorkout,
  getComparison,
} from '@/features/benchmarks/lib/splitComparison'
import { transformAttempts } from '@/features/benchmarks/lib/attemptStats'
import { createDbForTimeBlock } from '@/__tests__/factories/timedBlock.factory'
import { createDbCompletedWorkout } from '@/__tests__/factories/dbWorkout.factory'
import { tenthsArb } from '@/__tests__/factories/arbitraries'

/**
 * Property-based tests for benchmark statistics helpers.
 *
 * NOTE (scout-flagged, do not "fix" in source): in `attemptStats`,
 * `comparison.isFaster` compares each attempt against the minimum of ALL
 * completion times, so `completionTime < pbTime` can never be true — the
 * flag is dead code in practice. The last property below documents that.
 */

// ============================================
// Shared arbitraries
// ============================================

/** Times on a 0.1s grid to keep float comparisons trivial. */
const splitTimeArb = tenthsArb(36_000)
const splitTimesArb = fc.array(splitTimeArb, { maxLength: 5 })
const pbSplitsArb = fc.option(splitTimesArb, { nil: null })

// ============================================
// splitComparison: getComparison
// ============================================

describe('splitComparison (property-based)', () => {
  it('getComparison returns null exactly when no PB split exists for the index', () => {
    fc.assert(
      fc.property(
        pbSplitsArb,
        fc.integer({ min: 0, max: 8 }),
        splitTimeArb,
        (pbSplits, index, current) => {
          const comparison = getComparison(pbSplits, index, current)
          const hasPbSplit = pbSplits !== null && index < pbSplits.length
          if (comparison === null) {
            expect(hasPbSplit).toBe(false)
            return
          }
          expect(hasPbSplit).toBe(true)
          const pbSplit = pbSplits?.[index]
          if (pbSplit === undefined) {
            throw new Error('unreachable: comparison exists without a PB split')
          }
          expect(comparison.currentSplit).toBe(current)
          expect(comparison.pbSplit).toBe(pbSplit)
          expect(comparison.delta).toBe(current - pbSplit)
          expect(comparison.isFaster).toBe(comparison.delta < 0)
        },
      ),
    )
  })

  it('findPbWorkout finds the matching completed fortime workout among decoys', () => {
    fc.assert(
      fc.property(
        splitTimeArb,
        fc.array(splitTimeArb, { maxLength: 4 }),
        fc.integer({ min: 0, max: 4 }),
        (pbTime, decoyTimes, position) => {
          const decoys = decoyTimes.map((time) => makeDecoyWorkout(time))
          const pbResult: DbForTimeResult = { completionTime: pbTime, completed: true }
          const match = makeWorkout(TARGET_BENCHMARK_ID, [makeForTimeBlock(pbResult)])
          const insertAt = Math.min(position, decoys.length)
          const workouts = [...decoys.slice(0, insertAt), match, ...decoys.slice(insertAt)]

          const found = findPbWorkout(workouts, TARGET_BENCHMARK_ID, pbTime)
          expect(found).not.toBeNull()
          expect(found?.benchmarkId).toBe(TARGET_BENCHMARK_ID)
          const blocks = found?.blocks ?? []
          expect(blocks.some((block) => isPbBlock(block, pbTime))).toBe(true)

          // Decoys belong to a different benchmark, so alone they never match.
          expect(findPbWorkout(decoys, TARGET_BENCHMARK_ID, pbTime)).toBeNull()
        },
      ),
    )
  })

  it('extractSplitTimes returns the fortime splits and [] when none are recorded', () => {
    fc.assert(
      fc.property(splitTimesArb, splitTimeArb, (splits, time) => {
        const withSplits: DbForTimeResult = {
          completionTime: time,
          completed: true,
          splitTimes: splits,
        }
        const workoutWithSplits = makeWorkout(TARGET_BENCHMARK_ID, [makeForTimeBlock(withSplits)])
        expect(extractSplitTimes(workoutWithSplits)).toEqual(splits)

        const withoutSplits: DbForTimeResult = { completionTime: time, completed: true }
        const workoutWithoutSplits = makeWorkout(TARGET_BENCHMARK_ID, [
          makeForTimeBlock(withoutSplits),
        ])
        expect(extractSplitTimes(workoutWithoutSplits)).toEqual([])
      }),
    )
  })

  it('extractSplitTimes returns [] for a workout with no blocks', () => {
    expect(extractSplitTimes(makeWorkout(TARGET_BENCHMARK_ID, []))).toEqual([])
  })
})

const TARGET_BENCHMARK_ID = 'benchmark-under-test'

function makeForTimeBlock(result: DbForTimeResult | null): DbForTimeBlock {
  return createDbForTimeBlock({ exercises: [], result })
}

function makeWorkout(
  benchmarkId: string | null,
  blocks: ReadonlyArray<DbForTimeBlock>,
): DbCompletedWorkout {
  return createDbCompletedWorkout({ blocks: [...blocks], benchmarkId })
}

function makeDecoyWorkout(completionTime: number): DbCompletedWorkout {
  const result: DbForTimeResult = { completionTime, completed: true }
  return makeWorkout('other-benchmark', [makeForTimeBlock(result)])
}

function isPbBlock(block: DbWorkoutBlock, pbTime: number): boolean {
  if (block.kind !== 'fortime') return false
  if (!block.result?.completed) return false
  return Math.abs(block.result.completionTime - pbTime) < 0.1
}

// ============================================
// attemptStats: transformAttempts
// ============================================

type RawAttempt = {
  id: string
  completedAt: number
  completionTime: number
  isPersonalBest: boolean
}

const rawAttemptArb = fc.record({
  id: fc.uuid(),
  completedAt: fc.integer({ min: 0, max: 4_000_000_000 }),
  completionTime: splitTimeArb,
  isPersonalBest: fc.boolean(),
})

const attemptsArb = fc.array(rawAttemptArb, { minLength: 1, maxLength: 6 })

describe('attemptStats (property-based)', () => {
  it('preserves length, order, and every raw attempt field', () => {
    fc.assert(
      fc.property(attemptsArb, (attempts) => {
        const transformed = transformAttempts(attempts)
        expect(transformed).toHaveLength(attempts.length)
        for (const [index, attempt] of attempts.entries()) {
          const output = transformed[index]
          expect(output?.id).toBe(attempt.id)
          expect(output?.completedAt).toBe(attempt.completedAt)
          expect(output?.completionTime).toBe(attempt.completionTime)
          expect(output?.isPersonalBest).toBe(attempt.isPersonalBest)
        }
      }),
    )
  })

  it('delta is null exactly for PB attempts; non-PB deltas measure distance to the fastest time', () => {
    fc.assert(
      fc.property(attemptsArb, (attempts) => {
        const fastest = Math.min(...attempts.map((attempt: RawAttempt) => attempt.completionTime))
        for (const output of transformAttempts(attempts)) {
          if (output.isPersonalBest) {
            expect(output.comparison.delta).toBeNull()
            continue
          }
          expect(output.comparison.delta).toBe(output.completionTime - fastest)
          expect(output.comparison.delta).toBeGreaterThanOrEqual(0)
        }
      }),
    )
  })

  it('isFaster is false for every attempt because pbTime is the minimum (dead branch)', () => {
    fc.assert(
      fc.property(attemptsArb, (attempts) => {
        const transformed = transformAttempts(attempts)
        expect(transformed.every((attempt) => !attempt.comparison.isFaster)).toBe(true)
      }),
    )
  })

  it('returns [] for empty input', () => {
    expect(transformAttempts([])).toEqual([])
  })
})
