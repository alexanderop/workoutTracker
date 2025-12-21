import type { ShallowRef } from 'vue'
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
 * Accepts a blocks ref and returns methods to manipulate it.
 */
export function useTemplateBlockManagement(
  blocks: ShallowRef<ReadonlyArray<DbTemplateBlock>>,
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
    blocks.value = blocks.value.filter((_, i) => i !== index)
  }

  function updateBlocks(updated: ReadonlyArray<DbTemplateBlock>): void {
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
  }
}
