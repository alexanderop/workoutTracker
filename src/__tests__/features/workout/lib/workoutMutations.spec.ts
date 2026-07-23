import { describe, expect, it } from 'vitest'
import {
  activateWorkoutSet,
  addSetToBlock,
  duplicateSetInBlock,
  removeSetFromBlock,
  setBlockSetCount,
  updateSetInBlock,
} from '@/features/workout/lib/workoutMutations'
import type { StrengthBlock } from '@/types/blocks'
import type { Set, Workout } from '@/types/workout'

function createSet(id: number, status: Set['status'] = 'planned'): Set {
  return { id, kg: '40', reps: '8', duration: '', rir: '2', status }
}

function createWorkout(sets: Array<Set> = [createSet(1), createSet(2)]): Workout {
  const block: StrengthBlock = {
    kind: 'strength',
    id: 1,
    exerciseDefinitionId: 'squat',
    name: 'Squat',
    equipment: 'barbell',
    targetReps: 8,
    targetDuration: null,
    targetWeight: null,
    image: null,
    sets,
  }

  return {
    id: 1,
    name: 'Workout',
    blocks: [block],
    selectedBlockIndex: 0,
    startedAt: 1,
    mode: 'builder',
    activeSetIndex: null,
  }
}

function strengthSets(workout: Workout): Array<Set> {
  const block = workout.blocks[0]
  if (!block || block.kind !== 'strength') throw new Error('Expected strength block')
  return block.sets
}

describe('workout mutations', () => {
  it('updates a set without mutating the original workout', () => {
    const original = createWorkout()

    const updated = updateSetInBlock(original, 0, 1, (set) => ({ ...set, reps: '10' }))

    expect(strengthSets(updated)[0]?.reps).toBe('10')
    expect(strengthSets(original)[0]?.reps).toBe('8')
    expect(updated.blocks[0]).not.toBe(original.blocks[0])
  })

  it('preserves identity when a mutation target does not exist', () => {
    const original = createWorkout()

    expect(updateSetInBlock(original, 0, 99, (set) => set)).toBe(original)
    expect(removeSetFromBlock(original, 99, 1)).toBe(original)
  })

  it('allocates set IDs from the highest existing ID', () => {
    const original = createWorkout([createSet(2), createSet(7)])

    const updated = addSetToBlock(original, 0)

    expect(strengthSets(updated).map((set) => set.id)).toEqual([2, 7, 8])
  })

  it('never removes the final set from a strength block', () => {
    const original = createWorkout([createSet(1)])

    expect(removeSetFromBlock(original, 0, 1)).toBe(original)
  })

  it('duplicates values as a planned set and shifts a following active index', () => {
    const original = { ...createWorkout(), activeSetIndex: 1 }

    const updated = duplicateSetInBlock(original, 0, 1)

    expect(strengthSets(updated)).toEqual([createSet(1), { ...createSet(1), id: 3 }, createSet(2)])
    expect(updated.activeSetIndex).toBe(2)
  })

  it('shifts the active index down when an earlier set is removed', () => {
    const original = {
      ...createWorkout([createSet(1), createSet(2), createSet(3)]),
      activeSetIndex: 2,
    }

    const updated = removeSetFromBlock(original, 0, 1)

    expect(strengthSets(updated).map((set) => set.id)).toEqual([2, 3])
    expect(updated.activeSetIndex).toBe(1)
  })

  it('clears the active index when the active set itself is removed', () => {
    const original = { ...createWorkout(), activeSetIndex: 1 }

    const updated = removeSetFromBlock(original, 0, 2)

    expect(strengthSets(updated).map((set) => set.id)).toEqual([1])
    expect(updated.activeSetIndex).toBeNull()
  })

  it('leaves the active index alone when removing a set after it', () => {
    const original = {
      ...createWorkout([createSet(1), createSet(2), createSet(3)]),
      activeSetIndex: 0,
    }

    const updated = removeSetFromBlock(original, 0, 3)

    expect(updated.activeSetIndex).toBe(0)
  })

  it('clamps the active index when shrinking below it', () => {
    const original = {
      ...createWorkout([createSet(1), createSet(2), createSet(3), createSet(4)]),
      activeSetIndex: 3,
    }

    const shrunk = setBlockSetCount(original, 0, 2)

    expect(strengthSets(shrunk)).toHaveLength(2)
    expect(shrunk.activeSetIndex).toBe(1)
  })

  it('grows and shrinks set collections while enforcing one set minimum', () => {
    const original = createWorkout()

    const grown = setBlockSetCount(original, 0, 4)
    const shrunk = setBlockSetCount(grown, 0, 0)

    expect(strengthSets(grown).map((set) => set.id)).toEqual([1, 2, 3, 4])
    expect(strengthSets(shrunk)).toHaveLength(1)
  })

  it('activates planned sets but leaves completed sets unchanged', () => {
    const original = createWorkout([createSet(1), createSet(2, 'completed')])

    const active = activateWorkoutSet(original, 0, 0)

    expect(strengthSets(active)[0]?.status).toBe('active')
    expect(active.activeSetIndex).toBe(0)
    expect(activateWorkoutSet(active, 0, 1)).toBe(active)
  })
})
