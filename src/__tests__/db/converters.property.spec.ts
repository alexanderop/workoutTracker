import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { dbToWorkout, workoutToDb } from '@/db/converters'
import {
  dbActiveWorkoutArb,
  dbWorkoutBlockArb,
  normalizedWorkoutArb,
} from '@/__tests__/factories/arbitraries'

/**
 * Property-based tests for the active-workout converters.
 *
 * The converters are a *normalizing* round-trip, not naive identity:
 * - block and set ids are re-derived from array position (index + 1)
 * - selectedBlockIndex is clamped into bounds (or -1 when empty)
 * - mode falls back to 'builder' when no blocks exist
 * - blocks are re-sorted by orderIndex
 *
 * These invariants are load-bearing: the project convention is that every
 * schema change requires a converter update for backward compatibility.
 */
describe('db converters (property-based)', () => {
  it('round-trips any normalized workout through workoutToDb -> dbToWorkout', () => {
    fc.assert(
      fc.property(normalizedWorkoutArb, (workout) => {
        const roundTripped = dbToWorkout(workoutToDb(workout))
        expect(roundTripped).toEqual(workout)
      }),
    )
  })

  it('never produces an out-of-bounds selectedBlockIndex, even from corrupted data', () => {
    fc.assert(
      fc.property(dbActiveWorkoutArb, (databaseWorkout) => {
        const workout = dbToWorkout(databaseWorkout)

        expect(workout.selectedBlockIndex).toBe(
          workout.blocks.length === 0 ? -1 : workout.selectedBlockIndex,
        )
        expect(workout.blocks.length === 0 || workout.selectedBlockIndex >= 0).toBe(true)
        expect(
          workout.blocks.length === 0 || workout.selectedBlockIndex < workout.blocks.length,
        ).toBe(true)
      }),
    )
  })

  it('never keeps a non-builder mode when there are no blocks', () => {
    fc.assert(
      fc.property(dbActiveWorkoutArb, (databaseWorkout) => {
        const workout = dbToWorkout(databaseWorkout)

        expect(workout.mode).toBe(workout.blocks.length === 0 ? 'builder' : databaseWorkout.mode)
      }),
    )
  })

  it('normalization is idempotent: a converted workout is a fixed point of the round-trip', () => {
    fc.assert(
      fc.property(dbActiveWorkoutArb, (databaseWorkout) => {
        const once = dbToWorkout(databaseWorkout)
        const twice = dbToWorkout(workoutToDb(once))
        expect(twice).toEqual(once)
      }),
    )
  })

  it('block order is determined by orderIndex, not array position', () => {
    // Built constructively (at least 2 blocks) so no generated value is rejected
    const shuffledPairArb = fc
      .tuple(dbActiveWorkoutArb, fc.array(dbWorkoutBlockArb, { minLength: 2, maxLength: 4 }))
      .map(([databaseWorkout, blocks]) => ({
        ...databaseWorkout,
        // Distinct orderIndex values so sorting is unambiguous
        blocks: blocks.map((block, index) => ({ ...block, orderIndex: index })),
      }))
      .chain((databaseWorkout) =>
        fc
          .shuffledSubarray([...databaseWorkout.blocks], {
            minLength: databaseWorkout.blocks.length,
            maxLength: databaseWorkout.blocks.length,
          })
          .map((shuffledBlocks) => ({
            original: databaseWorkout,
            shuffled: { ...databaseWorkout, blocks: shuffledBlocks },
          })),
      )

    fc.assert(
      fc.property(shuffledPairArb, ({ original, shuffled }) => {
        expect(dbToWorkout(shuffled)).toEqual(dbToWorkout(original))
      }),
    )
  })
})
