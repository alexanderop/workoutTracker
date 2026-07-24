/* eslint-disable vitest/no-conditional-expect, vitest/expect-expect -- fast-check callbacks contain property assertions and model guards. */
import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  appendWorkoutBlock,
  getNextWorkoutBlockId,
  removeWorkoutBlockAtIndex,
  reorderWorkoutBlocks,
} from '@/lib/workoutBlockList'
import { createCardioWorkoutBlock } from '@/blocks'
import type { WorkoutBlock } from '@/blocks'

/**
 * Property-based tests for the pure workout block list operations.
 *
 * The strong invariants here are about IDENTITY, not index arithmetic: which
 * block the user has selected must survive appends, removals of other blocks,
 * and reorders — the selected index may shift, but it must keep pointing at
 * the same block id. A model-based sequence property replays random op
 * sequences against a naive id-array model to catch interaction bugs the
 * single-op properties would miss.
 */

function makeBlock(id: number): WorkoutBlock {
  return createCardioWorkoutBlock(
    { activity: 'running', targetDurationSeconds: null, targetDistanceMeters: null },
    id,
  )
}

function idOf(block: WorkoutBlock): number {
  return block.id
}

function idsToBlocks(ids: ReadonlyArray<number>): Array<WorkoutBlock> {
  return ids.map(makeBlock)
}

function compareNumbers(a: number, b: number): number {
  return a - b
}

function isOutOfBounds(index: number, length: number): boolean {
  return index < 0 || index >= length
}

const uniqueIdArb = fc.integer({ min: 1, max: 1000 })
const idListArb = fc.uniqueArray(uniqueIdArb, { maxLength: 6 })
const nonEmptyIdListArb = fc.uniqueArray(uniqueIdArb, { minLength: 1, maxLength: 6 })
const blocksArb = idListArb.map(idsToBlocks)
const nonEmptyBlocksArb = nonEmptyIdListArb.map(idsToBlocks)
const indexSeedArb = fc.nat(100)
const rawIndexArb = fc.integer({ min: -5, max: 20 })

// --- Model-based sequence machinery -----------------------------------------

type RealState = { blocks: Array<WorkoutBlock>; selectedIndex: number }
type ModelState = { ids: Array<number>; selectedId: number | null }
type SequenceOp =
  | { type: 'append' }
  | { type: 'remove'; seed: number }
  | { type: 'reorder'; fromSeed: number; toSeed: number }

const appendOpArb = fc.record({ type: fc.constant('append' as const) })
const removeOpArb = fc.record({ type: fc.constant('remove' as const), seed: fc.nat(100) })
const reorderOpArb = fc.record({
  type: fc.constant('reorder' as const),
  fromSeed: fc.nat(100),
  toSeed: fc.nat(100),
})
const opArb = fc.oneof(appendOpArb, removeOpArb, reorderOpArb)
const opsArb = fc.array(opArb, { maxLength: 15 })

function initialSequenceState(): { real: RealState; model: ModelState } {
  return {
    real: { blocks: [], selectedIndex: -1 },
    model: { ids: [], selectedId: null },
  }
}

/** Naive reimplementation of the next-id rule for the model. */
function nextModelId(ids: ReadonlyArray<number>): number {
  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

function applyOp(
  real: RealState,
  model: ModelState,
  op: SequenceOp,
): { real: RealState; model: ModelState } {
  if (op.type === 'append') {
    const newId = nextModelId(model.ids)
    return {
      real: applyAppendReal(real, newId),
      model: { ids: [...model.ids, newId], selectedId: newId },
    }
  }
  const count = real.blocks.length
  if (count === 0) {
    expectNoOpOnEmpty(real, op)
    return { real, model }
  }
  if (op.type === 'remove') {
    const index = op.seed % count
    return { real: applyRemoveReal(real, index), model: applyRemoveModel(model, index) }
  }
  const from = op.fromSeed % count
  const to = op.toSeed % count
  return { real: applyReorderReal(real, from, to), model: applyReorderModel(model, from, to) }
}

function applyAppendReal(state: RealState, newId: number): RealState {
  // The real next-id must agree with the model's naive max+1 rule
  expect(getNextWorkoutBlockId(state.blocks)).toBe(newId)
  const update = appendWorkoutBlock(state.blocks, makeBlock(newId))
  return { blocks: update.blocks, selectedIndex: update.selectedBlockIndex }
}

function applyRemoveReal(state: RealState, index: number): RealState {
  const update = removeWorkoutBlockAtIndex(state.blocks, index, state.selectedIndex)
  if (!update) throw new Error('removeWorkoutBlockAtIndex returned null for a valid index')
  return { blocks: update.blocks, selectedIndex: update.selectedBlockIndex }
}

function applyRemoveModel(model: ModelState, index: number): ModelState {
  const removedId = model.ids[index]
  const ids = model.ids.filter((_, position) => position !== index)
  if (ids.length === 0) return { ids, selectedId: null }
  if (model.selectedId !== removedId) return { ids, selectedId: model.selectedId }
  // The selected block was removed: selection stays at the same position,
  // clamped to the new last block
  const nextIndex = Math.min(index, ids.length - 1)
  return { ids, selectedId: ids[nextIndex] ?? null }
}

function applyReorderReal(state: RealState, from: number, to: number): RealState {
  const update = reorderWorkoutBlocks(state.blocks, from, to, state.selectedIndex)
  if (!update) throw new Error('reorderWorkoutBlocks returned null for valid indices')
  return { blocks: update.blocks, selectedIndex: update.selectedBlockIndex }
}

function applyReorderModel(model: ModelState, from: number, to: number): ModelState {
  const ids = [...model.ids]
  const [movedId] = ids.splice(from, 1)
  if (movedId === undefined) throw new Error('invalid from index in model')
  ids.splice(to, 0, movedId)
  return { ids, selectedId: model.selectedId }
}

function expectNoOpOnEmpty(real: RealState, op: { type: 'remove' | 'reorder' }): void {
  const result =
    op.type === 'remove'
      ? removeWorkoutBlockAtIndex(real.blocks, 0, real.selectedIndex)
      : reorderWorkoutBlocks(real.blocks, 0, 0, real.selectedIndex)
  expect(result).toBeNull()
}

function expectMatchesModel(real: RealState, model: ModelState): void {
  expect(real.blocks.map(idOf)).toEqual(model.ids)
  if (model.selectedId === null) {
    expect(real.selectedIndex).toBe(-1)
    return
  }
  const selected = real.blocks[real.selectedIndex]
  expect(selected).toBeDefined()
  expect(selected?.id).toBe(model.selectedId)
}

describe('workoutBlockList (property-based)', () => {
  describe('getNextWorkoutBlockId', () => {
    it('returns 1 for an empty list', () => {
      expect(getNextWorkoutBlockId([])).toBe(1)
    })

    it('is strictly greater than every existing block id', () => {
      fc.assert(
        fc.property(nonEmptyBlocksArb, (blocks) => {
          const nextId = getNextWorkoutBlockId(blocks)
          for (const block of blocks) {
            expect(nextId).toBeGreaterThan(block.id)
          }
        }),
      )
    })
  })

  describe('appendWorkoutBlock', () => {
    it('appends the block and selects it', () => {
      fc.assert(
        fc.property(blocksArb, fc.integer({ min: 2000, max: 3000 }), (blocks, newId) => {
          const block = makeBlock(newId)
          const result = appendWorkoutBlock(blocks, block)
          expect(result.blocks.map(idOf)).toEqual([...blocks.map(idOf), newId])
          expect(result.blocks[result.selectedBlockIndex]).toBe(block)
        }),
      )
    })
  })

  describe('removeWorkoutBlockAtIndex', () => {
    it('returns null for out-of-bounds indices', () => {
      fc.assert(
        fc.property(blocksArb, rawIndexArb, indexSeedArb, (blocks, index, selected) => {
          fc.pre(isOutOfBounds(index, blocks.length))
          expect(removeWorkoutBlockAtIndex(blocks, index, selected)).toBeNull()
        }),
      )
    })

    it('drops exactly the indexed block; selection follows a surviving selected block', () => {
      fc.assert(
        fc.property(
          nonEmptyBlocksArb,
          indexSeedArb,
          indexSeedArb,
          (blocks, removeSeed, selectedSeed) => {
            const removeIndex = removeSeed % blocks.length
            const selected = selectedSeed % blocks.length
            const result = removeWorkoutBlockAtIndex(blocks, removeIndex, selected)
            expect(result).not.toBeNull()
            if (!result) return

            expect(result.blocks).toHaveLength(blocks.length - 1)
            const survivingIds = blocks.filter((_, index) => index !== removeIndex).map(idOf)
            expect(result.blocks.map(idOf)).toEqual(survivingIds)

            // Identity: removing a DIFFERENT block never changes which block is selected
            if (selected === removeIndex) return
            const selectedAfter = result.blocks[result.selectedBlockIndex]
            expect(selectedAfter?.id).toBe(blocks[selected]?.id)
          },
        ),
      )
    })

    it('keeps the selection in bounds when the selected block itself is removed', () => {
      fc.assert(
        fc.property(nonEmptyBlocksArb, indexSeedArb, (blocks, seed) => {
          const removeIndex = seed % blocks.length
          const result = removeWorkoutBlockAtIndex(blocks, removeIndex, removeIndex)
          expect(result).not.toBeNull()
          if (!result) return

          if (result.blocks.length === 0) {
            expect(result.selectedBlockIndex).toBe(-1)
            return
          }
          expect(result.selectedBlockIndex).toBeGreaterThanOrEqual(0)
          expect(result.selectedBlockIndex).toBeLessThan(result.blocks.length)
        }),
      )
    })
  })

  describe('reorderWorkoutBlocks', () => {
    it('returns null for out-of-bounds indices', () => {
      fc.assert(
        fc.property(blocksArb, rawIndexArb, rawIndexArb, (blocks, from, to) => {
          fc.pre(isOutOfBounds(from, blocks.length) || isOutOfBounds(to, blocks.length))
          expect(reorderWorkoutBlocks(blocks, from, to, 0)).toBeNull()
        }),
      )
    })

    it('preserves ids, moves the block to toIndex, keeps others in relative order, and never deselects', () => {
      fc.assert(
        fc.property(
          nonEmptyBlocksArb,
          indexSeedArb,
          indexSeedArb,
          indexSeedArb,
          (blocks, fromSeed, toSeed, selectedSeed) => {
            const from = fromSeed % blocks.length
            const to = toSeed % blocks.length
            const selected = selectedSeed % blocks.length
            const result = reorderWorkoutBlocks(blocks, from, to, selected)
            expect(result).not.toBeNull()
            if (!result) return

            const oldIds = blocks.map(idOf)
            const newIds = result.blocks.map(idOf)
            // Same id multiset (ids are unique, so sorted arrays suffice)
            expect(newIds.toSorted(compareNumbers)).toEqual(oldIds.toSorted(compareNumbers))
            // The moved block lands at toIndex
            const movedId = oldIds[from]
            expect(newIds[to]).toBe(movedId)
            // Every other block keeps its relative order
            expect(newIds.filter((id) => id !== movedId)).toEqual(
              oldIds.filter((id) => id !== movedId),
            )
            // Identity: reorder never changes which block is selected
            const selectedAfter = result.blocks[result.selectedBlockIndex]
            expect(selectedAfter?.id).toBe(blocks[selected]?.id)
          },
        ),
      )
    })

    it('moving the selected block keeps it selected at its new position', () => {
      fc.assert(
        fc.property(nonEmptyBlocksArb, indexSeedArb, indexSeedArb, (blocks, fromSeed, toSeed) => {
          const from = fromSeed % blocks.length
          const to = toSeed % blocks.length
          const result = reorderWorkoutBlocks(blocks, from, to, from)
          expect(result).not.toBeNull()
          if (!result) return

          expect(result.selectedBlockIndex).toBe(to)
          expect(result.blocks[to]?.id).toBe(blocks[from]?.id)
        }),
      )
    })
  })

  describe('model-based op sequences', () => {
    it('matches a naive id-array model after every op in a random sequence', () => {
      fc.assert(
        fc.property(opsArb, (ops) => {
          const state = initialSequenceState()
          for (const op of ops) {
            const next = applyOp(state.real, state.model, op)
            state.real = next.real
            state.model = next.model
            expectMatchesModel(state.real, state.model)
          }
        }),
      )
    })
  })
})
