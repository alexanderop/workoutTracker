import type { WorkoutBlock } from '@/types/blocks'

export type BlockListUpdate = {
  blocks: Array<WorkoutBlock>
  selectedBlockIndex: number
}

export function getNextWorkoutBlockId(blocks: ReadonlyArray<WorkoutBlock>): number {
  const ids = blocks.map((block) => block.id)
  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

export function appendWorkoutBlock(
  blocks: ReadonlyArray<WorkoutBlock>,
  block: WorkoutBlock,
): BlockListUpdate {
  const nextBlocks = [...blocks, block]
  return {
    blocks: nextBlocks,
    selectedBlockIndex: nextBlocks.length - 1,
  }
}

export function removeWorkoutBlockAtIndex(
  blocks: ReadonlyArray<WorkoutBlock>,
  blockIndex: number,
  currentSelectedIndex: number,
): BlockListUpdate | null {
  if (blockIndex < 0 || blockIndex >= blocks.length) return null

  const nextBlocks = blocks.filter((_, index) => index !== blockIndex)

  return {
    blocks: nextBlocks,
    selectedBlockIndex: getSelectedIndexAfterRemoval(
      nextBlocks.length,
      currentSelectedIndex,
      blockIndex,
    ),
  }
}

export function reorderWorkoutBlocks(
  blocks: ReadonlyArray<WorkoutBlock>,
  fromIndex: number,
  toIndex: number,
  currentSelectedIndex: number,
): BlockListUpdate | null {
  const movedBlock = blocks[fromIndex]
  if (!movedBlock || toIndex < 0 || toIndex >= blocks.length) return null

  const nextBlocks = [...blocks]
  nextBlocks.splice(fromIndex, 1)
  nextBlocks.splice(toIndex, 0, movedBlock)

  return {
    blocks: nextBlocks,
    selectedBlockIndex: getSelectedIndexAfterReorder(
      currentSelectedIndex,
      fromIndex,
      toIndex,
    ),
  }
}

function getSelectedIndexAfterRemoval(
  newLength: number,
  currentSelectedIndex: number,
  removedIndex: number,
): number {
  if (newLength === 0) return -1
  if (currentSelectedIndex >= newLength) return Math.max(0, newLength - 1)
  if (currentSelectedIndex > removedIndex) return currentSelectedIndex - 1
  return currentSelectedIndex
}

function getSelectedIndexAfterReorder(
  currentSelectedIndex: number,
  fromIndex: number,
  toIndex: number,
): number {
  if (currentSelectedIndex === fromIndex) return toIndex
  if (fromIndex < currentSelectedIndex && toIndex >= currentSelectedIndex) {
    return currentSelectedIndex - 1
  }
  if (fromIndex > currentSelectedIndex && toIndex <= currentSelectedIndex) {
    return currentSelectedIndex + 1
  }
  return currentSelectedIndex
}
