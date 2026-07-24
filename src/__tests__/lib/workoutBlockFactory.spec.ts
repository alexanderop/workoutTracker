import { describe, expect, it, vi } from 'vitest'
import {
  createCardioWorkoutBlock,
  createTimedWorkoutBlock,
  createWorkoutBlockFromHistory,
  createWorkoutBlockFromTemplate,
} from '@/lib/workoutBlockFactory'
import type { BlockExercise } from '@/blocks'
import { assert } from '@/__tests__/helpers/assert'

const pushUps: BlockExercise = {
  id: 'push-ups',
  name: 'Push-ups',
  prescribedReps: 10,
  load: null,
  image: null,
}

describe('workoutBlockFactory', () => {
  it('creates timed workout blocks with copied exercise arrays and null results', () => {
    const exercises = [pushUps]

    const block = createTimedWorkoutBlock(
      {
        kind: 'amrap',
        config: { durationSeconds: 600 },
        exercises,
      },
      7,
    )

    expect(block).toEqual({
      kind: 'amrap',
      id: 7,
      config: { durationSeconds: 600 },
      exercises: [pushUps],
      result: null,
    })
    assert(block.kind === 'amrap', 'Expected AMRAP block')
    expect(block.exercises).not.toBe(exercises)
  })

  it('keeps tabata singular exercise shape', () => {
    const block = createTimedWorkoutBlock(
      {
        kind: 'tabata',
        config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
        exercise: pushUps,
      },
      3,
    )

    expect(block).toEqual({
      kind: 'tabata',
      id: 3,
      config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
      exercise: pushUps,
      result: null,
    })
    expect('exercises' in block).toBe(false)
  })

  it('creates cardio blocks with copied config and null result', () => {
    const block = createCardioWorkoutBlock(
      {
        activity: 'running',
        targetDurationSeconds: 1800,
        targetDistanceMeters: null,
      },
      5,
    )

    expect(block).toEqual({
      kind: 'cardio',
      id: 5,
      config: {
        activity: 'running',
        targetDurationSeconds: 1800,
        targetDistanceMeters: null,
      },
      result: null,
    })
  })

  it('converts template strength blocks to completed workout sets', () => {
    const block = createWorkoutBlockFromTemplate(
      {
        kind: 'strength',
        exerciseDefinitionId: 'bench',
        name: 'Bench Press',
        equipment: 'barbell',
        targetReps: 8,
        targetDuration: null,
        targetWeight: null,
        defaultSetCount: 2,
        image: null,
      },
      1,
    )

    expect(block).toMatchObject({
      kind: 'strength',
      id: 1,
      exerciseDefinitionId: 'bench',
      name: 'Bench Press',
      targetReps: 8,
      sets: [
        { id: 1, reps: '8', status: 'completed' },
        { id: 2, reps: '8', status: 'completed' },
      ],
    })
  })

  it('converts template timed block exercise ids and generates ids when missing', () => {
    const randomUUID = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-4000-8000-000000000000')

    const block = createWorkoutBlockFromTemplate(
      {
        kind: 'emom',
        config: { minutes: 12, exerciseRotation: 'each-minute' },
        exercises: [
          {
            exerciseDefinitionId: null,
            name: 'Air Squats',
            prescribedReps: 15,
            load: null,
            image: null,
          },
        ],
      },
      2,
    )

    expect(block).toMatchObject({
      kind: 'emom',
      id: 2,
      exercises: [{ id: '00000000-0000-4000-8000-000000000000', name: 'Air Squats' }],
    })

    randomUUID.mockRestore()
  })

  it('converts history blocks while preserving completed set values', () => {
    const block = createWorkoutBlockFromHistory(
      {
        kind: 'strength',
        exerciseDefinitionId: 'squat',
        name: 'Squat',
        equipment: 'barbell',
        targetReps: 5,
        sets: [
          { kg: '100', reps: '5', rir: '2' },
          { kg: '105', reps: '3', rir: '1' },
        ],
        image: null,
      },
      4,
    )

    expect(block).toMatchObject({
      kind: 'strength',
      id: 4,
      sets: [
        { id: 1, kg: '100', reps: '5', rir: '2', status: 'completed' },
        { id: 2, kg: '105', reps: '3', rir: '1', status: 'completed' },
      ],
    })
  })
})
