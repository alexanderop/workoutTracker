import { afterEach, describe, expect, it } from 'vitest'
import { resetWorkout, useWorkout } from '@/composables/useWorkout'
import type { Set } from '@/composables/useWorkout'
import { workoutBuilder } from '../factories'

function setupExerciseWithSets(sets: ReadonlyArray<Partial<Set>>) {
  const { workout, exercises, completeSet } = useWorkout()
  workout.value = workoutBuilder().withExerciseAndSets(sets).build()
  return { workout, exercises, completeSet }
}

describe('useWorkout', () => {
  afterEach(() => {
    resetWorkout()
  })

  describe('completeSet', () => {
    describe('pre-fill behavior', () => {
      it('pre-fills empty next set with values from completed set', () => {
        const { exercises, completeSet } = setupExerciseWithSets([
          { status: 'active' },
          { kg: '', reps: '', rir: '', status: 'planned' },
        ])

        const firstSet = exercises.value[0]!.sets[0]!
        completeSet(firstSet)

        const secondSet = exercises.value[0]!.sets[1]!
        expect(secondSet.kg).toBe('100')
        expect(secondSet.reps).toBe('8')
        expect(secondSet.rir).toBe('2')
        expect(secondSet.status).toBe('active')
      })

      it('preserves existing values in next set - only fills empty fields', () => {
        const { exercises, completeSet } = setupExerciseWithSets([
          { status: 'active' },
          { kg: '90', reps: '', rir: '3', status: 'planned' },
        ])

        const firstSet = exercises.value[0]!.sets[0]!
        completeSet(firstSet)

        const secondSet = exercises.value[0]!.sets[1]!
        expect(secondSet.kg).toBe('90') // Preserved
        expect(secondSet.reps).toBe('8') // Filled from first set
        expect(secondSet.rir).toBe('3') // Preserved
      })

      it('does not pre-fill when completing last set in exercise', () => {
        const { exercises, completeSet } = setupExerciseWithSets([
          { status: 'completed' },
          { status: 'active' },
        ])

        const lastSet = exercises.value[0]!.sets[1]!
        const result = completeSet(lastSet)

        // Should indicate workout complete (no more sets/exercises)
        expect(result.kind).toBe('completed')
        if (result.kind === 'completed') {
          expect(result.nextAction).toBe('workout-complete')
        }
      })

      it('does not pre-fill when moving to next exercise', () => {
        const { workout, exercises, completeSet } = useWorkout()
        workout.value = workoutBuilder()
          .withExerciseAndSets([{ status: 'active' }], { name: 'Bench Press' })
          .withExerciseAndSets([{ kg: '', reps: '', rir: '', status: 'planned' }], {
            name: 'Squat',
          })
          .build()

        const firstExerciseSet = exercises.value[0]!.sets[0]!
        const result = completeSet(firstExerciseSet)

        // Should move to next block
        expect(result.kind).toBe('completed')
        if (result.kind === 'completed') {
          expect(result.nextAction).toBe('next-block')
        }

        // Second exercise's set should remain empty (no cross-exercise pre-fill)
        const secondExerciseSet = exercises.value[1]!.sets[0]!
        expect(secondExerciseSet.kg).toBe('')
        expect(secondExerciseSet.reps).toBe('')
        expect(secondExerciseSet.rir).toBe('')
      })

      it('pre-fills correctly in second exercise with overlapping set IDs', () => {
        const { workout, exercises, completeSet } = useWorkout()
        workout.value = workoutBuilder()
          .withExerciseAndSets(
            [{ status: 'completed' }, { kg: '', reps: '', rir: '', status: 'planned' }],
            { name: 'Bench Press' },
          )
          .withExerciseAndSets(
            [
              { kg: '140', reps: '5', rir: '1', status: 'active' },
              { kg: '', reps: '', rir: '', status: 'planned' },
            ],
            { name: 'Squat' },
          )
          .selectExercise(2)
          .build()

        // Complete first set of second exercise (Squat)
        const squatFirstSet = exercises.value[1]!.sets[0]!
        const result = completeSet(squatFirstSet)

        expect(result.kind).toBe('completed')
        if (result.kind === 'completed' && result.nextAction === 'next-set') {
          expect(result.blockIndex).toBe(1) // Squat is at block index 1
        }

        // Second set of Squat should be pre-filled with Squat values, not Bench values
        const squatSecondSet = exercises.value[1]!.sets[1]!
        expect(squatSecondSet.kg).toBe('140')
        expect(squatSecondSet.reps).toBe('5')
        expect(squatSecondSet.rir).toBe('1')

        // Bench Press sets should be unchanged
        const benchSecondSet = exercises.value[0]!.sets[1]!
        expect(benchSecondSet.kg).toBe('')
        expect(benchSecondSet.reps).toBe('')
        expect(benchSecondSet.rir).toBe('')
      })
    })

    describe('set completion', () => {
      it('returns uncompleted when set is not ready', () => {
        const { exercises, completeSet } = setupExerciseWithSets([
          { kg: '', reps: '', rir: '', status: 'active' },
        ])

        const set = exercises.value[0]!.sets[0]!
        const result = completeSet(set)

        expect(result.kind).toBe('uncompleted')
        expect(set.status).toBe('active')
      })

      it('toggles completed set back to active', () => {
        const { exercises, completeSet } = setupExerciseWithSets([{ status: 'completed' }])

        const set = exercises.value[0]!.sets[0]!
        const result = completeSet(set)

        expect(result.kind).toBe('uncompleted')
        expect(set.status).toBe('active')
      })
    })
  })
})
