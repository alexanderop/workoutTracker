import { describe, expect, it } from 'vitest'
import {
  completeWorkoutSet,
  findNextIncompleteSet,
} from '@/features/workout/lib/workoutSetCompletion'
import type { StrengthBlock } from '@/types/blocks'
import type { Set, Workout } from '@/types/workout'

function createSet(id: number, status: Set['status'] = 'planned', values: Partial<Set> = {}): Set {
  return { id, kg: '40', reps: '8', duration: '', rir: '2', status, ...values }
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

function createWorkout(blocks: Array<StrengthBlock>, selectedBlockIndex = 0): Workout {
  return {
    id: 1,
    name: 'Workout',
    blocks,
    selectedBlockIndex,
    startedAt: 1,
    mode: 'active',
    activeSetIndex: 0,
  }
}

function strengthBlock(workout: Workout, index: number): StrengthBlock {
  const block = workout.blocks[index]
  if (!block || block.kind !== 'strength') throw new Error('Expected strength block')
  return block
}

describe('workout set completion', () => {
  it('finds planned and active sets while skipping completed sets', () => {
    const block = createBlock(1, [createSet(1, 'completed'), createSet(2, 'active'), createSet(3)])

    expect(findNextIncompleteSet(block)?.id).toBe(2)
  })

  it('preserves the workout when the set is not ready', () => {
    const set = createSet(1, 'active')
    const workout = createWorkout([createBlock(1, [set])])

    const transition = completeWorkoutSet(workout, set, false)

    expect(transition).toEqual({ workout, result: { kind: 'uncompleted' } })
    expect(transition.workout).toBe(workout)
  })

  it('toggles a completed set back to active', () => {
    const set = createSet(1, 'completed')
    const workout = createWorkout([createBlock(1, [set])])

    const transition = completeWorkoutSet(workout, set, true)

    expect(strengthBlock(transition.workout, 0).sets[0]?.status).toBe('active')
    expect(transition.result).toEqual({ kind: 'uncompleted' })
  })

  it('completes a set, prefills blanks, and activates the next set', () => {
    const completed = createSet(1, 'active', { kg: '60', reps: '5', rir: '1' })
    const next = createSet(2, 'planned', { kg: '', reps: '10', rir: '' })
    const workout = createWorkout([createBlock(1, [completed, next])])

    const transition = completeWorkoutSet(workout, completed, true)
    const sets = strengthBlock(transition.workout, 0).sets

    expect(sets[0]?.status).toBe('completed')
    expect(sets[1]).toMatchObject({ kg: '60', reps: '10', rir: '1', status: 'active' })
    expect(transition.workout.activeSetIndex).toBe(1)
    expect(transition.result).toEqual({
      kind: 'completed',
      nextAction: 'next-set',
      blockIndex: 0,
      setId: 2,
    })
  })

  it('advances to the actual first incomplete set in the next block', () => {
    const current = createSet(1, 'active')
    const nextBlock = createBlock(2, [
      createSet(1, 'completed'),
      createSet(2, 'completed'),
      createSet(3),
    ])
    const workout = createWorkout([createBlock(1, [current]), nextBlock])

    const transition = completeWorkoutSet(workout, current, true)

    expect(transition.workout.selectedBlockIndex).toBe(1)
    expect(transition.workout.activeSetIndex).toBe(2)
    expect(strengthBlock(transition.workout, 1).sets[2]?.status).toBe('active')
    expect(transition.result).toEqual({
      kind: 'completed',
      nextAction: 'next-block',
      blockIndex: 1,
    })
  })

  it('skips an already-complete next block and lands on the first incomplete one', () => {
    const current = createSet(1, 'active')
    const completeBlock = createBlock(2, [createSet(1, 'completed')])
    const incompleteBlock = createBlock(3, [createSet(1)])
    const workout = createWorkout([createBlock(1, [current]), completeBlock, incompleteBlock])

    const transition = completeWorkoutSet(workout, current, true)

    expect(transition.workout.selectedBlockIndex).toBe(2)
    expect(transition.workout.activeSetIndex).toBe(0)
    expect(strengthBlock(transition.workout, 2).sets[0]?.status).toBe('active')
    expect(transition.result).toEqual({
      kind: 'completed',
      nextAction: 'next-block',
      blockIndex: 2,
    })
  })

  it('reports workout completion when no incomplete work remains', () => {
    const set = createSet(1, 'active')
    const workout = createWorkout([createBlock(1, [set])])

    const transition = completeWorkoutSet(workout, set, true)

    expect(transition.result).toEqual({
      kind: 'completed',
      nextAction: 'workout-complete',
    })
    expect(strengthBlock(transition.workout, 0).sets[0]?.status).toBe('completed')
  })
})
