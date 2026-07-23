import { isStrengthBlock } from '@/types/blocks'
import type { WorkoutBlock } from '@/types/blocks'
import type { Set, Workout } from '@/types/workout'

export function updateWorkout(workout: Workout, updates: Partial<Workout>): Workout {
  return { ...workout, ...updates }
}

export function updateBlockAtIndex(
  workout: Workout,
  blockIndex: number,
  updater: (block: WorkoutBlock) => WorkoutBlock,
): Workout {
  const block = workout.blocks[blockIndex]
  if (!block) return workout

  const updatedBlock = updater(block)
  if (updatedBlock === block) return workout

  return {
    ...workout,
    blocks: workout.blocks.map((candidate, index) =>
      index === blockIndex ? updatedBlock : candidate,
    ),
  }
}

export function updateSetInBlock(
  workout: Workout,
  blockIndex: number,
  setId: number,
  updater: (set: Set) => Set,
): Workout {
  return updateBlockAtIndex(workout, blockIndex, (block) => {
    if (!isStrengthBlock(block)) return block

    const setIndex = block.sets.findIndex((set) => set.id === setId)
    const set = block.sets[setIndex]
    if (!set) return block

    const updatedSet = updater(set)
    if (updatedSet === set) return block

    return {
      ...block,
      sets: block.sets.map((candidate, index) => (index === setIndex ? updatedSet : candidate)),
    }
  })
}

export function addSetToBlock(workout: Workout, blockIndex: number): Workout {
  return updateBlockAtIndex(workout, blockIndex, (block) => {
    if (!isStrengthBlock(block)) return block

    const nextId = block.sets.reduce((highestId, set) => Math.max(highestId, set.id), 0) + 1
    return {
      ...block,
      sets: [
        ...block.sets,
        { id: nextId, kg: '', reps: '', duration: '', rir: '', status: 'planned' },
      ],
    }
  })
}

export function removeSetFromBlock(workout: Workout, blockIndex: number, setId: number): Workout {
  return updateBlockAtIndex(workout, blockIndex, (block) => {
    if (!isStrengthBlock(block) || block.sets.length <= 1) return block
    if (block.sets.every((set) => set.id !== setId)) return block

    return { ...block, sets: block.sets.filter((set) => set.id !== setId) }
  })
}

export function duplicateSetInBlock(workout: Workout, blockIndex: number, setId: number): Workout {
  const block = workout.blocks[blockIndex]
  if (!block || !isStrengthBlock(block)) return workout

  const setIndex = block.sets.findIndex((set) => set.id === setId)
  const originalSet = block.sets[setIndex]
  if (!originalSet) return workout

  const nextId = block.sets.reduce((highestId, set) => Math.max(highestId, set.id), 0) + 1
  const duplicate: Set = {
    ...originalSet,
    id: nextId,
    status: 'planned',
  }
  const sets = [...block.sets]
  sets.splice(setIndex + 1, 0, duplicate)

  const activeSetIndex = workout.activeSetIndex
  const nextActiveSetIndex =
    blockIndex === workout.selectedBlockIndex &&
    activeSetIndex !== null &&
    activeSetIndex > setIndex
      ? activeSetIndex + 1
      : activeSetIndex

  return {
    ...workout,
    activeSetIndex: nextActiveSetIndex,
    blocks: workout.blocks.map((candidate, index) =>
      index === blockIndex ? { ...block, sets } : candidate,
    ),
  }
}

export function setBlockSetCount(
  workout: Workout,
  blockIndex: number,
  requestedCount: number,
): Workout {
  const block = workout.blocks[blockIndex]
  if (!block || !isStrengthBlock(block)) return workout

  const targetCount = Math.max(1, requestedCount)
  if (targetCount === block.sets.length) return workout

  if (targetCount < block.sets.length) {
    return updateBlockAtIndex(workout, blockIndex, (candidate) => {
      if (!isStrengthBlock(candidate)) return candidate
      return { ...candidate, sets: candidate.sets.slice(0, targetCount) }
    })
  }

  let updatedWorkout = workout
  for (let index = block.sets.length; index < targetCount; index++) {
    updatedWorkout = addSetToBlock(updatedWorkout, blockIndex)
  }
  return updatedWorkout
}

export function activateWorkoutSet(
  workout: Workout,
  blockIndex: number,
  setIndex: number,
): Workout {
  const block = workout.blocks[blockIndex]
  if (!block || !isStrengthBlock(block)) return workout

  const set = block.sets[setIndex]
  if (!set || set.status === 'completed') return workout

  const withActiveSet = updateSetInBlock(workout, blockIndex, set.id, (candidate) => ({
    ...candidate,
    status: 'active',
  }))
  return updateWorkout(withActiveSet, { activeSetIndex: setIndex })
}
