import { isStrengthBlock } from '@/blocks'
import type { WorkoutBlock } from '@/blocks'
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

// activeSetIndex is positional and only meaningful for the selected block, so
// any mutation that shifts set positions there must reconcile it or the index
// silently points at a different (or missing) set.
function reconcileActiveSetIndex(
  workout: Workout,
  blockIndex: number,
  reconcile: (activeSetIndex: number) => number | null,
): number | null {
  const activeSetIndex = workout.activeSetIndex
  if (blockIndex !== workout.selectedBlockIndex || activeSetIndex === null) return activeSetIndex
  return reconcile(activeSetIndex)
}

export function removeSetFromBlock(workout: Workout, blockIndex: number, setId: number): Workout {
  const block = workout.blocks[blockIndex]
  if (!block || !isStrengthBlock(block) || block.sets.length <= 1) return workout

  const removedSetIndex = block.sets.findIndex((set) => set.id === setId)
  if (removedSetIndex === -1) return workout

  const removedWorkout = updateBlockAtIndex(workout, blockIndex, (candidate) => {
    if (!isStrengthBlock(candidate)) return candidate
    return { ...candidate, sets: candidate.sets.filter((set) => set.id !== setId) }
  })

  return {
    ...removedWorkout,
    activeSetIndex: reconcileActiveSetIndex(workout, blockIndex, (activeSetIndex) => {
      if (activeSetIndex === removedSetIndex) return null
      if (activeSetIndex > removedSetIndex) return activeSetIndex - 1
      return activeSetIndex
    }),
  }
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

  const nextActiveSetIndex = reconcileActiveSetIndex(workout, blockIndex, (activeSetIndex) =>
    activeSetIndex > setIndex ? activeSetIndex + 1 : activeSetIndex,
  )

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

  const targetCount = Math.max(1, Math.trunc(requestedCount))
  if (targetCount === block.sets.length) return workout

  if (targetCount < block.sets.length) {
    const shrunkWorkout = updateBlockAtIndex(workout, blockIndex, (candidate) => {
      if (!isStrengthBlock(candidate)) return candidate
      return { ...candidate, sets: candidate.sets.slice(0, targetCount) }
    })
    return {
      ...shrunkWorkout,
      activeSetIndex: reconcileActiveSetIndex(workout, blockIndex, (activeSetIndex) =>
        Math.min(activeSetIndex, targetCount - 1),
      ),
    }
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
