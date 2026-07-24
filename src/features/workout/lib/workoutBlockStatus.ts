import type { WorkoutBlock } from '@/blocks'
import { isStrengthBlock } from '@/blocks'

export function isWorkoutBlockComplete(block: WorkoutBlock): boolean {
  if (isStrengthBlock(block)) {
    return block.sets.every((set) => set.status === 'completed')
  }

  return block.result !== null
}

export function hasWorkoutBlockProgress(block: WorkoutBlock): boolean {
  if (isStrengthBlock(block)) {
    return block.sets.some((set) => set.status === 'completed')
  }

  return block.result !== null
}

export function findFirstIncompleteWorkoutBlockIndex(blocks: ReadonlyArray<WorkoutBlock>): number {
  return blocks.findIndex((block) => !isWorkoutBlockComplete(block))
}
