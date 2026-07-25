import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { generateStructureHash } from '@/db/structureHash'
import type { DbBenchmarkRound } from '@/db/schema'

/**
 * Property-based tests for the benchmark structure hash.
 *
 * The hash must depend only on the logical structure (exercise identity,
 * name, prescribed reps, and relative order of rounds/exercises), never on
 * storage order, on the concrete orderKey values, or on images.
 *
 * Properties:
 * 1. Storage-order invariance: permuting the rounds array and each round's
 *    exercises array (orderKeys untouched) does not change the hash.
 * 2. OrderKey-relabel invariance: rewriting all orderKeys with a different
 *    labeling scheme that preserves relative order does not change the hash.
 * 3. Image invariance: attaching or nulling exercise images does not change
 *    the hash.
 * 4. Determinism: hashing two independently built but structurally equal
 *    inputs yields the same hash.
 *
 * Deliberately NOT asserted: "different structure implies different hash" —
 * the underlying djb2 hash admits collisions, so that property is flaky.
 */

type ExerciseCore = {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
}

/** A labeling scheme mapping sorted position -> orderKey, order-preserving. */
type Labeling = {
  prefix: string
  offset: number
  stride: number
}

const definitionIdArb = fc.option(fc.uuid(), { nil: null })
const exerciseCoreArb = fc.record({
  exerciseDefinitionId: definitionIdArb,
  name: fc.string({ minLength: 1, maxLength: 12 }),
  prescribedReps: fc.integer({ min: 1, max: 100 }),
})
const roundCoreArb = fc.array(exerciseCoreArb, { minLength: 1, maxLength: 4 })
const structureCoreArb = fc.array(roundCoreArb, { minLength: 1, maxLength: 4 })

const labelingArb = fc.record({
  prefix: fc.constantFrom('a', 'b', 'k', 'x'),
  offset: fc.integer({ min: 0, max: 50 }),
  stride: fc.integer({ min: 1, max: 9 }),
})

const shuffleSeedsArb = fc.array(fc.nat(), { minLength: 4, maxLength: 12 })

/** Index-derived orderKey; fixed width keeps localeCompare order == index order. */
function orderKeyFor(labeling: Labeling, index: number): string {
  const value = labeling.offset + index * labeling.stride
  return labeling.prefix + String(value).padStart(3, '0')
}

function buildRounds(
  core: ReadonlyArray<ReadonlyArray<ExerciseCore>>,
  roundLabeling: Labeling,
  exerciseLabeling: Labeling,
  image: Blob | null,
): Array<DbBenchmarkRound> {
  return core.map((exercises, roundIndex) => ({
    orderKey: orderKeyFor(roundLabeling, roundIndex),
    exercises: exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      orderKey: orderKeyFor(exerciseLabeling, exerciseIndex),
      image,
    })),
  }))
}

/** Seeded Fisher-Yates shuffle so permutations come from fc, not Math.random. */
function permuteWithSeeds<T>(
  items: ReadonlyArray<T>,
  seeds: ReadonlyArray<number>,
  salt: number,
): Array<T> {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const seed = seeds[(salt + index) % seeds.length] ?? 0
    const swapIndex = seed % (index + 1)
    const left = result[index]
    const right = result[swapIndex]
    if (left === undefined || right === undefined) throw new Error('shuffle out of bounds')
    result[index] = right
    result[swapIndex] = left
  }
  return result
}

/** Permute rounds and each round's exercises without touching orderKeys. */
function shuffleStorageOrder(
  rounds: ReadonlyArray<DbBenchmarkRound>,
  seeds: ReadonlyArray<number>,
): Array<DbBenchmarkRound> {
  const shuffledRounds = permuteWithSeeds(rounds, seeds, 0)
  return shuffledRounds.map((round, roundIndex) => ({
    orderKey: round.orderKey,
    exercises: permuteWithSeeds(round.exercises, seeds, roundIndex + 1),
  }))
}

describe('structureHash (property-based)', () => {
  it('is invariant to the storage order of rounds and exercises', () => {
    fc.assert(
      fc.property(
        structureCoreArb,
        labelingArb,
        labelingArb,
        shuffleSeedsArb,
        (core, roundLabeling, exerciseLabeling, seeds) => {
          const rounds = buildRounds(core, roundLabeling, exerciseLabeling, null)
          const shuffled = shuffleStorageOrder(rounds, seeds)

          expect(generateStructureHash(shuffled)).toBe(generateStructureHash(rounds))
        },
      ),
    )
  })

  it('is invariant to relabeling orderKeys while preserving relative order', () => {
    fc.assert(
      fc.property(
        structureCoreArb,
        labelingArb,
        labelingArb,
        labelingArb,
        labelingArb,
        (core, roundLabelingA, exerciseLabelingA, roundLabelingB, exerciseLabelingB) => {
          const roundsA = buildRounds(core, roundLabelingA, exerciseLabelingA, null)
          const roundsB = buildRounds(core, roundLabelingB, exerciseLabelingB, null)

          expect(generateStructureHash(roundsB)).toBe(generateStructureHash(roundsA))
        },
      ),
    )
  })

  it('ignores exercise images', () => {
    fc.assert(
      fc.property(
        structureCoreArb,
        labelingArb,
        labelingArb,
        fc.string({ maxLength: 20 }),
        (core, roundLabeling, exerciseLabeling, imageContent) => {
          const withoutImages = buildRounds(core, roundLabeling, exerciseLabeling, null)
          const withImages = buildRounds(
            core,
            roundLabeling,
            exerciseLabeling,
            new Blob([imageContent]),
          )

          expect(generateStructureHash(withImages)).toBe(generateStructureHash(withoutImages))
        },
      ),
    )
  })

  it('is deterministic for structurally equal inputs', () => {
    fc.assert(
      fc.property(
        structureCoreArb,
        labelingArb,
        labelingArb,
        (core, roundLabeling, exerciseLabeling) => {
          const first = buildRounds(core, roundLabeling, exerciseLabeling, null)
          const second = buildRounds(core, roundLabeling, exerciseLabeling, null)

          const hash = generateStructureHash(first)
          expect(generateStructureHash(first)).toBe(hash)
          expect(generateStructureHash(second)).toBe(hash)
        },
      ),
    )
  })
})
