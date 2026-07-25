import { describe, expect, it } from 'vitest'
import { createStrengthBlock } from '../factories/block.factory'
import {
  appendWorkoutBlock,
  getNextWorkoutBlockId,
  removeWorkoutBlockAtIndex,
  reorderWorkoutBlocks,
} from '@/blocks/list'

describe('blocks/list', () => {
  it('generates the first id and increments from the current max id', () => {
    expect(getNextWorkoutBlockId([])).toBe(1)
    expect(
      getNextWorkoutBlockId([
        createStrengthBlock({ id: 2 }),
        createStrengthBlock({ id: 7 }),
        createStrengthBlock({ id: 4 }),
      ]),
    ).toBe(8)
  })

  it('appends a block and selects it', () => {
    const first = createStrengthBlock({ id: 1 })
    const second = createStrengthBlock({ id: 2 })

    const update = appendWorkoutBlock([first], second)

    expect(update.blocks).toEqual([first, second])
    expect(update.selectedBlockIndex).toBe(1)
  })

  it('removes a block and keeps selection valid', () => {
    const blocks = [
      createStrengthBlock({ id: 1 }),
      createStrengthBlock({ id: 2 }),
      createStrengthBlock({ id: 3 }),
    ]

    expect(removeWorkoutBlockAtIndex(blocks, 1, 2)).toMatchObject({
      blocks: [blocks[0], blocks[2]],
      selectedBlockIndex: 1,
    })
    expect(removeWorkoutBlockAtIndex(blocks, 2, 2)).toMatchObject({
      blocks: [blocks[0], blocks[1]],
      selectedBlockIndex: 1,
    })
    expect(removeWorkoutBlockAtIndex([blocks[0]], 0, 0)).toMatchObject({
      blocks: [],
      selectedBlockIndex: -1,
    })
  })

  it('rejects invalid remove indexes', () => {
    const blocks = [createStrengthBlock({ id: 1 })]

    expect(removeWorkoutBlockAtIndex(blocks, -1, 0)).toBeNull()
    expect(removeWorkoutBlockAtIndex(blocks, 1, 0)).toBeNull()
  })

  it('reorders blocks and tracks the selected block through the move', () => {
    const blocks = [
      createStrengthBlock({ id: 1 }),
      createStrengthBlock({ id: 2 }),
      createStrengthBlock({ id: 3 }),
    ]

    expect(reorderWorkoutBlocks(blocks, 0, 2, 0)).toMatchObject({
      blocks: [blocks[1], blocks[2], blocks[0]],
      selectedBlockIndex: 2,
    })
    expect(reorderWorkoutBlocks(blocks, 0, 2, 1)).toMatchObject({
      blocks: [blocks[1], blocks[2], blocks[0]],
      selectedBlockIndex: 0,
    })
    expect(reorderWorkoutBlocks(blocks, 2, 0, 1)).toMatchObject({
      blocks: [blocks[2], blocks[0], blocks[1]],
      selectedBlockIndex: 2,
    })
  })

  it('rejects invalid reorder indexes', () => {
    const blocks = [createStrengthBlock({ id: 1 })]

    expect(reorderWorkoutBlocks(blocks, -1, 0, 0)).toBeNull()
    expect(reorderWorkoutBlocks(blocks, 0, 1, 0)).toBeNull()
  })
})
