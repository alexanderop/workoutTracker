import { describe, expect, it, vi } from 'vitest'
import {
  createCardioWorkoutBlock,
  createTimedWorkoutBlock,
  createWorkoutBlockFromHistory,
  createWorkoutBlockFromTemplate,
} from '@/lib/workoutBlockFactory'
import type { BlockExercise } from '@/types/blocks'

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
    if (block.kind !== 'amrap') {
      throw new Error('Expected AMRAP block')
    }
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

  it('applies template strength defaults: 3 sets, 8 target reps, no exercise definition', () => {
    const block = createWorkoutBlockFromTemplate(
      {
        kind: 'strength',
        name: 'Overhead Press',
        equipment: 'barbell',
        image: null,
      },
      9,
    )

    expect(block).toMatchObject({
      kind: 'strength',
      exerciseDefinitionId: null,
      targetReps: 8,
      targetDuration: null,
      targetWeight: null,
    })
    if (block.kind !== 'strength') {
      throw new Error('Expected strength block')
    }
    expect(block.sets).toHaveLength(3)
    expect(block.sets.every((set) => set.reps === '')).toBe(true)
  })

  it('converts template amrap and fortime blocks preserving exercise definition ids', () => {
    const templateExercise = {
      exerciseDefinitionId: 'push-ups',
      name: 'Push-ups',
      prescribedReps: 10,
      load: null,
      image: null,
    }

    const amrap = createWorkoutBlockFromTemplate(
      {
        kind: 'amrap',
        config: { durationSeconds: 900 },
        exercises: [templateExercise],
      },
      1,
    )
    const fortime = createWorkoutBlockFromTemplate(
      {
        kind: 'fortime',
        config: { timeCapSeconds: 600 },
        exercises: [templateExercise],
      },
      2,
    )

    expect(amrap).toMatchObject({
      kind: 'amrap',
      config: { durationSeconds: 900 },
      exercises: [{ id: 'push-ups', name: 'Push-ups', prescribedReps: 10 }],
      result: null,
    })
    expect(fortime).toMatchObject({
      kind: 'fortime',
      config: { timeCapSeconds: 600 },
      exercises: [{ id: 'push-ups' }],
      result: null,
    })
  })

  it('converts template tabata and cardio blocks', () => {
    const tabata = createWorkoutBlockFromTemplate(
      {
        kind: 'tabata',
        config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
        exercise: {
          exerciseDefinitionId: 'burpees',
          name: 'Burpees',
          prescribedReps: 0,
          load: null,
          image: null,
        },
      },
      3,
    )
    const cardio = createWorkoutBlockFromTemplate(
      {
        kind: 'cardio',
        config: { activity: 'rowing', targetDurationSeconds: null, targetDistanceMeters: 2000 },
      },
      4,
    )

    expect(tabata).toMatchObject({
      kind: 'tabata',
      exercise: { id: 'burpees', name: 'Burpees' },
      result: null,
    })
    expect(cardio).toMatchObject({
      kind: 'cardio',
      config: { activity: 'rowing', targetDistanceMeters: 2000 },
      result: null,
    })
  })

  it('converts history timed blocks reusing the stored exercise ids', () => {
    const historyExercise = {
      id: 'stored-id',
      name: 'Thrusters',
      prescribedReps: 21,
      load: '42.5kg',
      image: null,
    }

    const amrap = createWorkoutBlockFromHistory(
      {
        kind: 'amrap',
        config: { durationSeconds: 600 },
        exercises: [historyExercise],
      },
      1,
    )
    const emom = createWorkoutBlockFromHistory(
      {
        kind: 'emom',
        config: { minutes: 10, exerciseRotation: 'full-round' },
        exercises: [historyExercise],
      },
      2,
    )
    const fortime = createWorkoutBlockFromHistory(
      {
        kind: 'fortime',
        config: { timeCapSeconds: null },
        exercises: [historyExercise],
      },
      3,
    )

    expect(amrap).toMatchObject({
      kind: 'amrap',
      exercises: [{ id: 'stored-id', load: '42.5kg' }],
      result: null,
    })
    expect(emom).toMatchObject({
      kind: 'emom',
      config: { minutes: 10, exerciseRotation: 'full-round' },
      exercises: [{ id: 'stored-id' }],
    })
    expect(fortime).toMatchObject({
      kind: 'fortime',
      config: { timeCapSeconds: null },
      exercises: [{ id: 'stored-id' }],
    })
  })

  it('converts history tabata and cardio blocks', () => {
    const tabata = createWorkoutBlockFromHistory(
      {
        kind: 'tabata',
        config: { rounds: 6, workSeconds: 30, restSeconds: 15 },
        exercise: {
          id: 'air-squats',
          name: 'Air Squats',
          prescribedReps: 0,
          load: null,
          image: null,
        },
      },
      5,
    )
    const cardio = createWorkoutBlockFromHistory(
      {
        kind: 'cardio',
        config: { activity: 'running', targetDurationSeconds: 1800, targetDistanceMeters: null },
      },
      6,
    )

    expect(tabata).toMatchObject({
      kind: 'tabata',
      config: { rounds: 6, workSeconds: 30, restSeconds: 15 },
      exercise: { id: 'air-squats' },
      result: null,
    })
    expect(cardio).toMatchObject({
      kind: 'cardio',
      config: { activity: 'running', targetDurationSeconds: 1800 },
      result: null,
    })
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
