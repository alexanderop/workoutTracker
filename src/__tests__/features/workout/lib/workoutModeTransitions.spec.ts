import { describe, expect, it } from 'vitest'
import {
  advanceToNextIncompleteBlock,
  enterWorkoutCompletion,
  goToPreviousWorkoutBlock,
  hasWorkoutStarted,
  returnToWorkoutBuilder,
  selectActiveWorkoutSet,
  startWorkout,
} from '@/features/workout/lib/workoutModeTransitions'
import type { StrengthBlock } from '@/blocks'
import type { Set, Workout } from '@/types/workout'

function createSet(id: number, status: Set['status'] = 'planned'): Set {
  return { id, kg: '40', reps: '8', duration: '', rir: '2', status }
}

function createBlock(id: number, sets: Array<Set>): StrengthBlock {
  return {
    kind: 'strength',
    id,
    exerciseDefinitionId: `exercise-${id}`,
    name: `Exercise ${id}`,
    equipment: 'barbell',
    targetReps: 8,
    targetDuration: null,
    targetWeight: null,
    image: null,
    sets,
  }
}

function createWorkout(blocks: Array<StrengthBlock> = []): Workout {
  return {
    id: 1,
    name: 'Workout',
    blocks,
    selectedBlockIndex: blocks.length > 0 ? 0 : -1,
    startedAt: 100,
    mode: 'builder',
    activeSetIndex: null,
  }
}

function strengthBlock(workout: Workout, index: number): StrengthBlock {
  const block = workout.blocks[index]
  if (!block || block.kind !== 'strength') throw new Error('Expected strength block')
  return block
}

describe('workout mode transitions', () => {
  it('does not start an empty workout', () => {
    const workout = createWorkout()

    expect(startWorkout(workout, 200)).toBe(workout)
  })

  it('starts fresh workouts and activates their first set', () => {
    const workout = createWorkout([createBlock(1, [createSet(1), createSet(2), createSet(3)])])

    const started = startWorkout(workout, 200)

    expect(started).toMatchObject({
      mode: 'active',
      selectedBlockIndex: 0,
      activeSetIndex: 0,
      startedAt: 200,
    })
    expect(strengthBlock(started, 0).sets[0]?.status).toBe('active')
  })

  it('preserves the original start time when workout progress exists', () => {
    const workout = createWorkout([createBlock(1, [createSet(1, 'completed'), createSet(2)])])

    const resumed = startWorkout(workout, 200)

    expect(hasWorkoutStarted(workout)).toBe(true)
    expect(resumed.startedAt).toBe(100)
    expect(resumed.activeSetIndex).toBe(1)
    expect(strengthBlock(resumed, 0).sets[1]?.status).toBe('active')
  })

  it('resumes on the block the user left instead of resetting to block 0', () => {
    const workout = {
      ...createWorkout([
        createBlock(1, [createSet(1, 'completed')]),
        createBlock(2, [createSet(1, 'completed'), createSet(2)]),
      ]),
      selectedBlockIndex: 1,
    }

    const resumed = startWorkout(workout, 200)

    expect(resumed.selectedBlockIndex).toBe(1)
    expect(resumed.activeSetIndex).toBe(1)
    expect(strengthBlock(resumed, 1).sets[1]?.status).toBe('active')
  })

  it('falls back to the first incomplete block when the resumed block is complete', () => {
    const workout = {
      ...createWorkout([
        createBlock(1, [createSet(1)]),
        createBlock(2, [createSet(1, 'completed')]),
      ]),
      selectedBlockIndex: 1,
    }

    const resumed = startWorkout(workout, 200)

    expect(resumed.selectedBlockIndex).toBe(0)
    expect(resumed.activeSetIndex).toBe(0)
    expect(strengthBlock(resumed, 0).sets[0]?.status).toBe('active')
  })

  it('moves between builder and completion modes', () => {
    const workout = { ...createWorkout([createBlock(1, [createSet(1)])]), mode: 'active' as const }

    const builder = returnToWorkoutBuilder(workout)
    const completed = enterWorkoutCompletion(builder)

    expect(builder).toMatchObject({ mode: 'builder', activeSetIndex: null })
    expect(completed.mode).toBe('completed')
  })

  it('skips completed blocks and activates the next incomplete set', () => {
    const workout = {
      ...createWorkout([
        createBlock(1, [createSet(1, 'active')]),
        createBlock(2, [createSet(1, 'completed')]),
        createBlock(3, [createSet(1, 'completed'), createSet(2)]),
      ]),
      mode: 'active' as const,
      activeSetIndex: 0,
    }

    const transition = advanceToNextIncompleteBlock(workout)

    expect(transition.moved).toBe(true)
    expect(transition.workout.selectedBlockIndex).toBe(2)
    expect(transition.workout.activeSetIndex).toBe(1)
    expect(strengthBlock(transition.workout, 2).sets[1]?.status).toBe('active')
  })

  it('preserves identity when no incomplete block remains', () => {
    const workout = createWorkout([
      createBlock(1, [createSet(1, 'active')]),
      createBlock(2, [createSet(1, 'completed')]),
    ])

    expect(advanceToNextIncompleteBlock(workout)).toEqual({ workout, moved: false })
  })

  it('returns to the previous block and restores its incomplete set index', () => {
    const workout = {
      ...createWorkout([
        createBlock(1, [createSet(1, 'completed'), createSet(2)]),
        createBlock(2, [createSet(1, 'active')]),
      ]),
      selectedBlockIndex: 1,
      activeSetIndex: 0,
    }

    const transition = goToPreviousWorkoutBlock(workout)

    expect(transition.moved).toBe(true)
    expect(transition.workout.selectedBlockIndex).toBe(0)
    expect(transition.workout.activeSetIndex).toBe(1)
  })

  it('only selects set indexes that belong to the current strength block', () => {
    const workout = createWorkout([createBlock(1, [createSet(1), createSet(2)])])

    expect(selectActiveWorkoutSet(workout, 1).activeSetIndex).toBe(1)
    expect(selectActiveWorkoutSet(workout, 2)).toBe(workout)
    expect(selectActiveWorkoutSet(workout, -1)).toBe(workout)
  })
})
