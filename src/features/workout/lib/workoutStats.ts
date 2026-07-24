import type { DbWorkoutBlock } from '@/blocks'
import { isDbStrengthBlock } from '@/db/schema'

/**
 * Count completed sets across all strength blocks.
 */
export function countCompletedSets(blocks: ReadonlyArray<DbWorkoutBlock>): number {
  return blocks
    .filter(isDbStrengthBlock)
    .reduce(
      (total, block) => total + block.sets.filter((set) => set.status === 'completed').length,
      0,
    )
}
