import { computed, ref, shallowRef } from 'vue'
import { getTemplatesRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { Exercise } from '@/composables/useExerciseSearch'
import type { DbTemplateBlock, DbWorkoutTemplate } from '@/db/schema'
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

// ============================================
// Composable
// ============================================

export function useTemplateCreation() {
  // Primary State
  const templateName = ref('')
  const blocks = shallowRef<ReadonlyArray<DbTemplateBlock>>([])

  // Operation State
  const isSaving = ref(false)

  // Computed
  const isValid = computed(
    () => templateName.value.trim().length > 0 && blocks.value.length > 0,
  )

  // Block Management Methods
  function addStrengthBlock(exercise: Exercise): void {
    const block = createTemplateStrengthBlock(exercise)
    blocks.value = [...blocks.value, block]
  }

  function addAmrapBlock(config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>): void {
    const block = createTemplateAmrapBlock(config, exercises)
    blocks.value = [...blocks.value, block]
  }

  function addEmomBlock(config: EmomConfig, exercises: ReadonlyArray<BlockExercise>): void {
    const block = createTemplateEmomBlock(config, exercises)
    blocks.value = [...blocks.value, block]
  }

  function addTabataBlock(config: TabataConfig, exercise: BlockExercise): void {
    const block = createTemplateTabataBlock(config, exercise)
    blocks.value = [...blocks.value, block]
  }

  function addForTimeBlock(config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>): void {
    const block = createTemplateForTimeBlock(config, exercises)
    blocks.value = [...blocks.value, block]
  }

  function addCardioBlock(config: CardioConfig): void {
    const block = createTemplateCardioBlock(config)
    blocks.value = [...blocks.value, block]
  }

  function removeBlock(index: number): void {
    blocks.value = blocks.value.filter((_, i) => i !== index)
  }

  function updateBlocks(updated: ReadonlyArray<DbTemplateBlock>): void {
    blocks.value = updated
  }

  async function save(): Promise<DbWorkoutTemplate | null> {
    if (!isValid.value || isSaving.value) return null

    isSaving.value = true
    const [error, template] = await tryCatch(
      getTemplatesRepository().create({
        name: templateName.value.trim(),
        blocks: blocks.value,
      }),
    )

    isSaving.value = false

    if (error) return null
    return template
  }

  return {
    // State
    templateName,
    blocks,
    isSaving,
    // Computed
    isValid,
    // Methods
    addStrengthBlock,
    addAmrapBlock,
    addEmomBlock,
    addTabataBlock,
    addForTimeBlock,
    addCardioBlock,
    removeBlock,
    updateBlocks,
    save,
  }
}
