import { hasWorkoutBlockProgress, isWorkoutBlockComplete } from '@/lib/workoutBlockStatus'
import { isStrengthBlock } from '@/types/blocks'
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

export function startWorkout(workout: Workout, startedAt: number): Workout {
  const firstBlock = workout.blocks[0]
  if (!firstBlock) return workout

  let activeWorkout = updateWorkout(workout, {
    mode: 'active',
    selectedBlockIndex: 0,
    activeSetIndex: null,
    ...(!hasWorkoutStarted(workout) && { startedAt }),
  })

  if (!isStrengthBlock(firstBlock)) return activeWorkout

  const nextSet = findNextIncompleteSet(firstBlock)
  if (!nextSet) return activeWorkout

  const setIndex = firstBlock.sets.findIndex((set) => set.id === nextSet.id)
  activeWorkout = activateWorkoutSet(activeWorkout, 0, setIndex)
  return activeWorkout
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
