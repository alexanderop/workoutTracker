import type { Ref } from 'vue'
import type { Exercise } from '@/composables/useExerciseSearch'
import type { DbTemplateBlock } from '@/db/schema'
import type {
  AmrapConfig,
  BlockExercise,
  CardioConfig,
  EmomConfig,
  ForTimeConfig,
  TabataConfig,
} from '@/types/blocks'
import {
  createTemplateAmrapBlock,
  createTemplateCardioBlock,
  createTemplateEmomBlock,
  createTemplateForTimeBlock,
  createTemplateStrengthBlock,
  createTemplateTabataBlock,
} from '@/features/templates/lib/templateBlock'

/**
 * Shared block management logic for template composables.
 * Accepts a blocks ref (ShallowRef or WritableComputedRef) and returns methods to manipulate it.
 */
export function useTemplateBlockManagement(
  blocks: Ref<ReadonlyArray<DbTemplateBlock>>,
) {
  function addStrengthBlock(exercise: Exercise): void {
    blocks.value = [...blocks.value, createTemplateStrengthBlock(exercise)]
  }

  function addAmrapBlock(config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>): void {
    blocks.value = [...blocks.value, createTemplateAmrapBlock(config, exercises)]
  }

  function addEmomBlock(config: EmomConfig, exercises: ReadonlyArray<BlockExercise>): void {
    blocks.value = [...blocks.value, createTemplateEmomBlock(config, exercises)]
  }

  function addTabataBlock(config: TabataConfig, exercise: BlockExercise): void {
    blocks.value = [...blocks.value, createTemplateTabataBlock(config, exercise)]
  }

  function addForTimeBlock(config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>): void {
    blocks.value = [...blocks.value, createTemplateForTimeBlock(config, exercises)]
  }

  function addCardioBlock(config: CardioConfig): void {
    blocks.value = [...blocks.value, createTemplateCardioBlock(config)]
  }

  function removeBlock(index: number): void {
    blocks.value = blocks.value.filter((_, index_) => index_ !== index)
  }

  function updateBlocks(updated: ReadonlyArray<DbTemplateBlock>): void {
    blocks.value = updated
  }

  function reorderBlocks(fromIndex: number, toIndex: number): void {
    const updated = [...blocks.value]
    const movedBlock = updated[fromIndex]
    if (!movedBlock) return

    // Remove from source position, insert at destination
    updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, movedBlock)

    blocks.value = updated
  }

  return {
    addStrengthBlock,
    addAmrapBlock,
    addEmomBlock,
    addTabataBlock,
    addForTimeBlock,
    addCardioBlock,
    removeBlock,
    updateBlocks,
    reorderBlocks,
  }
}
