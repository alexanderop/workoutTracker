import {
  findFirstIncompleteWorkoutBlockIndex,
  hasWorkoutBlockProgress,
  isWorkoutBlockComplete,
} from '@/features/workout/lib/workoutBlockStatus'
import { isStrengthBlock } from '@/blocks'
import type { Workout } from '@/types/workout'
import { activateWorkoutSet, updateWorkout } from './workoutMutations'
import { findNextIncompleteSet } from './workoutSetCompletion'

export interface WorkoutNavigationTransition {
  workout: Workout
  moved: boolean
}

export function hasWorkoutStarted(workout: Workout): boolean {
  return workout.blocks.some(hasWorkoutBlockProgress)
}

// A resumed workout re-enters where the user left off; a fresh one starts at
// block 0. If the block the user left is already complete, fall back to the
// first incomplete block so resume never lands on finished work.
function resolveStartBlockIndex(workout: Workout, started: boolean): number {
  if (!started) return 0

  const currentBlock = workout.blocks[workout.selectedBlockIndex]
  if (currentBlock && !isWorkoutBlockComplete(currentBlock)) return workout.selectedBlockIndex

  const firstIncompleteBlockIndex = findFirstIncompleteWorkoutBlockIndex(workout.blocks)
  if (firstIncompleteBlockIndex !== -1) return firstIncompleteBlockIndex

  return currentBlock ? workout.selectedBlockIndex : 0
}

export function startWorkout(workout: Workout, startedAt: number): Workout {
  if (workout.blocks.length === 0) return workout

  const started = hasWorkoutStarted(workout)
  const startBlockIndex = resolveStartBlockIndex(workout, started)
  const startBlock = workout.blocks[startBlockIndex]

  const activeWorkout = updateWorkout(workout, {
    mode: 'active',
    selectedBlockIndex: startBlockIndex,
    activeSetIndex: null,
    ...(!started && { startedAt }),
  })

  if (!startBlock || !isStrengthBlock(startBlock)) return activeWorkout

  const nextSet = findNextIncompleteSet(startBlock)
  if (!nextSet) return activeWorkout

  const setIndex = startBlock.sets.findIndex((set) => set.id === nextSet.id)
  return activateWorkoutSet(activeWorkout, startBlockIndex, setIndex)
}

export function returnToWorkoutBuilder(workout: Workout): Workout {
  return updateWorkout(workout, { mode: 'builder', activeSetIndex: null })
}

export function enterWorkoutCompletion(workout: Workout): Workout {
  return updateWorkout(workout, { mode: 'completed' })
}

export function advanceToNextIncompleteBlock(workout: Workout): WorkoutNavigationTransition {
  const nextBlockIndex = workout.blocks.findIndex(
    (block, index) => index > workout.selectedBlockIndex && !isWorkoutBlockComplete(block),
  )
  if (nextBlockIndex === -1) return { workout, moved: false }

  const nextBlock = workout.blocks[nextBlockIndex]
  let advancedWorkout = updateWorkout(workout, {
    selectedBlockIndex: nextBlockIndex,
    activeSetIndex: null,
  })

  if (nextBlock && isStrengthBlock(nextBlock)) {
    const nextSet = findNextIncompleteSet(nextBlock)
    if (nextSet) {
      const setIndex = nextBlock.sets.findIndex((set) => set.id === nextSet.id)
      advancedWorkout = activateWorkoutSet(advancedWorkout, nextBlockIndex, setIndex)
    }
  }

  return { workout: advancedWorkout, moved: true }
}

export function goToPreviousWorkoutBlock(workout: Workout): WorkoutNavigationTransition {
  const previousBlockIndex = workout.selectedBlockIndex - 1
  const previousBlock = workout.blocks[previousBlockIndex]
  if (!previousBlock) return { workout, moved: false }

  let activeSetIndex: number | null = null
  if (isStrengthBlock(previousBlock)) {
    const incompleteSetIndex = previousBlock.sets.findIndex(
      (set) => set.status === 'planned' || set.status === 'active',
    )
    activeSetIndex = Math.max(incompleteSetIndex, 0)
  }

  return {
    workout: updateWorkout(workout, {
      selectedBlockIndex: previousBlockIndex,
      activeSetIndex,
    }),
    moved: true,
  }
}

export function selectActiveWorkoutSet(workout: Workout, setIndex: number): Workout {
  const block = workout.blocks[workout.selectedBlockIndex]
  if (!block || !isStrengthBlock(block)) return workout
  if (setIndex < 0 || setIndex >= block.sets.length) return workout

  return updateWorkout(workout, { activeSetIndex: setIndex })
}
