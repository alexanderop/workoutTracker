import {
  findFirstIncompleteWorkoutBlockIndex,
  isWorkoutBlockComplete,
} from '@/features/workout/lib/workoutBlockStatus'
import { isStrengthBlock } from '@/blocks'
import type { StrengthBlock } from '@/blocks'
import type { PrefillableSetFields, Set, Workout } from '@/types/workout'
import { updateSetInBlock, updateWorkout } from './workoutMutations'

type CompleteSetResult =
  | { kind: 'completed'; nextAction: 'next-set'; blockIndex: number; setId: number }
  | { kind: 'completed'; nextAction: 'next-block'; blockIndex: number }
  | { kind: 'completed'; nextAction: 'workout-complete' }
  | { kind: 'uncompleted' }

export interface SetCompletionTransition {
  workout: Workout
  result: CompleteSetResult
}

export function findNextIncompleteSet(block: StrengthBlock): Set | undefined {
  return block.sets.find((set) => set.status === 'planned' || set.status === 'active')
}

function applyPrefillToSet(target: Readonly<Set>, source: Readonly<Set>): PrefillableSetFields {
  return {
    kg: target.kg || source.kg,
    reps: target.reps || source.reps,
    duration: target.duration || source.duration,
    rir: target.rir || source.rir,
  } satisfies PrefillableSetFields
}

function activateNextSetInBlock(
  workout: Workout,
  blockIndex: number,
  block: StrengthBlock,
  completedSet: Set,
): SetCompletionTransition | null {
  const nextSet = findNextIncompleteSet(block)
  if (!nextSet) return null

  const nextSetIndex = block.sets.findIndex((set) => set.id === nextSet.id)
  const withActiveSet = updateSetInBlock(workout, blockIndex, nextSet.id, (set) => ({
    ...set,
    ...applyPrefillToSet(set, completedSet),
    status: 'active',
  }))

  return {
    workout: updateWorkout(withActiveSet, { activeSetIndex: nextSetIndex }),
    result: {
      kind: 'completed',
      nextAction: 'next-set',
      blockIndex,
      setId: nextSet.id,
    },
  }
}

function advanceToBlock(workout: Workout, blockIndex: number): SetCompletionTransition | null {
  const block = workout.blocks[blockIndex]
  // Refusing complete blocks lets the caller fall through to the
  // first-incomplete-block search instead of landing on finished work.
  if (!block || isWorkoutBlockComplete(block)) return null

  let updatedWorkout = updateWorkout(workout, {
    selectedBlockIndex: blockIndex,
    activeSetIndex: null,
  })
  if (isStrengthBlock(block)) {
    const nextSet = findNextIncompleteSet(block)
    if (nextSet) {
      const setIndex = block.sets.findIndex((set) => set.id === nextSet.id)
      updatedWorkout = updateSetInBlock(updatedWorkout, blockIndex, nextSet.id, (set) => ({
        ...set,
        status: 'active',
      }))
      updatedWorkout = updateWorkout(updatedWorkout, { activeSetIndex: setIndex })
    }
  }

  return {
    workout: updatedWorkout,
    result: { kind: 'completed', nextAction: 'next-block', blockIndex },
  }
}

function navigateAfterSetCompletion(
  workout: Workout,
  blockIndex: number,
  block: StrengthBlock,
  completedSet: Set,
): SetCompletionTransition {
  const nextSetTransition = activateNextSetInBlock(workout, blockIndex, block, completedSet)
  if (nextSetTransition) return nextSetTransition

  const nextBlockTransition = advanceToBlock(workout, blockIndex + 1)
  if (nextBlockTransition) return nextBlockTransition

  const firstIncompleteBlockIndex = findFirstIncompleteWorkoutBlockIndex(workout.blocks)
  if (firstIncompleteBlockIndex !== -1) {
    const incompleteBlockTransition = advanceToBlock(workout, firstIncompleteBlockIndex)
    if (incompleteBlockTransition) return incompleteBlockTransition
  }

  return {
    workout,
    result: { kind: 'completed', nextAction: 'workout-complete' },
  }
}

export function completeWorkoutSet(
  workout: Workout,
  set: Set,
  isReady: boolean,
): SetCompletionTransition {
  const blockIndex = workout.selectedBlockIndex

  if (set.status === 'completed') {
    return {
      workout: updateSetInBlock(workout, blockIndex, set.id, (candidate) => ({
        ...candidate,
        status: 'active',
      })),
      result: { kind: 'uncompleted' },
    }
  }

  if (!isReady) return { workout, result: { kind: 'uncompleted' } }

  const withCompletedSet = updateSetInBlock(workout, blockIndex, set.id, (candidate) => ({
    ...candidate,
    status: 'completed',
  }))
  const updatedBlock = withCompletedSet.blocks[blockIndex]
  if (!updatedBlock || !isStrengthBlock(updatedBlock)) {
    return {
      workout: withCompletedSet,
      result: { kind: 'completed', nextAction: 'workout-complete' },
    }
  }

  return navigateAfterSetCompletion(withCompletedSet, blockIndex, updatedBlock, set)
}
