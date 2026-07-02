import { describe, expect, it } from 'vitest'
import { createStrengthBlockWithSets } from '../factories/block.factory'
import { createDbBlockExercise } from '../factories/timedBlock.factory'
import { createCardioWorkoutBlock, createTimedWorkoutBlock } from '@/lib/workoutBlockFactory'
import {
  findFirstIncompleteWorkoutBlockIndex,
  hasWorkoutBlockProgress,
  isWorkoutBlockComplete,
} from '@/lib/workoutBlockStatus'

const pushUps = createDbBlockExercise({ id: 'push-ups', name: 'Push-ups', prescribedReps: 10 })

describe('workoutBlockStatus', () => {
  it('treats strength blocks as complete only when every set is completed', () => {
    const complete = createStrengthBlockWithSets([{ status: 'completed' }, { status: 'completed' }])
    const incomplete = createStrengthBlockWithSets([{ status: 'completed' }, { status: 'planned' }])

    expect(isWorkoutBlockComplete(complete)).toBe(true)
    expect(isWorkoutBlockComplete(incomplete)).toBe(false)
  })

  it('treats non-strength blocks as complete when they have a result', () => {
    const amrap = createTimedWorkoutBlock(
      {
        kind: 'amrap',
        config: { durationSeconds: 600 },
        exercises: [pushUps],
      },
      1,
    )
    const cardio = createCardioWorkoutBlock(
      {
        activity: 'running',
        targetDurationSeconds: 1200,
        targetDistanceMeters: null,
      },
      2,
    )
    if (amrap.kind !== 'amrap') {
      throw new Error('Expected AMRAP block')
    }

    expect(isWorkoutBlockComplete(amrap)).toBe(false)
    expect(
      isWorkoutBlockComplete({
        ...amrap,
        result: { rounds: 4, partialReps: 12, actualDuration: 600 },
      }),
    ).toBe(true)
    expect(isWorkoutBlockComplete(cardio)).toBe(false)
    expect(
      isWorkoutBlockComplete({
        ...cardio,
        result: {
          actualDurationSeconds: 1200,
          distanceMeters: null,
          avgPaceSecondsPerKm: null,
          calories: null,
          notes: null,
        },
      }),
    ).toBe(true)
  })

  it('reports progress for partially completed strength blocks and completed result blocks', () => {
    const untouchedStrength = createStrengthBlockWithSets([
      { status: 'planned' },
      { status: 'planned' },
    ])
    const startedStrength = createStrengthBlockWithSets([
      { status: 'completed' },
      { status: 'planned' },
    ])
    const tabata = createTimedWorkoutBlock(
      {
        kind: 'tabata',
        config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
        exercise: pushUps,
      },
      3,
    )
    if (tabata.kind !== 'tabata') {
      throw new Error('Expected Tabata block')
    }

    expect(hasWorkoutBlockProgress(untouchedStrength)).toBe(false)
    expect(hasWorkoutBlockProgress(startedStrength)).toBe(true)
    expect(hasWorkoutBlockProgress(tabata)).toBe(false)
    expect(hasWorkoutBlockProgress({ ...tabata, result: { repsPerRound: [10, 9, 8] } })).toBe(true)
  })

  it('finds the first incomplete block', () => {
    const completeStrength = createStrengthBlockWithSets([{ status: 'completed' }], { id: 1 })
    const incompleteStrength = createStrengthBlockWithSets([{ status: 'planned' }], { id: 2 })
    const completeCardio = createCardioWorkoutBlock(
      {
        activity: 'rowing',
        targetDurationSeconds: null,
        targetDistanceMeters: 1000,
      },
      3,
    )

    expect(
      findFirstIncompleteWorkoutBlockIndex([
        completeStrength,
        {
          ...completeCardio,
          result: {
            actualDurationSeconds: 300,
            distanceMeters: 1000,
            avgPaceSecondsPerKm: null,
            calories: null,
            notes: null,
          },
        },
        incompleteStrength,
      ]),
    ).toBe(2)
    expect(findFirstIncompleteWorkoutBlockIndex([completeStrength])).toBe(-1)
  })
})
