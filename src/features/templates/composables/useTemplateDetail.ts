import { computed, onMounted, ref, shallowRef } from 'vue'
import { getTemplatesRepository, getActiveWorkoutRepository } from '@/db'
import { dbToWorkout } from '@/db/converters'
import { tryCatch } from '@/lib/tryCatch'
import type { Exercise } from '@/composables/useExerciseSearch'
import type { DbTemplateBlock, DbWorkoutTemplate } from '@/db/schema'
import type { Workout } from '@/types/workout'
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
// Types
// ============================================

type TemplateDetailState =
  | { status: 'loading' }
  | { status: 'success'; template: DbWorkoutTemplate }
  | { status: 'not-found' }

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Checks if template has been edited compared to original.
 * Compares name and block count/types.
 */
function checkIsEdited(
  template: DbWorkoutTemplate,
  currentName: string,
  currentBlocks: ReadonlyArray<DbTemplateBlock>,
): boolean {
  // Check name change
  if (currentName !== template.name) return true

  // Check block count change
  if (currentBlocks.length !== template.blocks.length) return true

  // Check each block for changes
  for (let i = 0; i < currentBlocks.length; i++) {
    const current = currentBlocks[i]
    const original = template.blocks[i]
    if (!current || !original) return true

    // Fast path: reference equality (same object = no change)
    // Falls back to deep equality when references differ
    if (current !== original && JSON.stringify(current) !== JSON.stringify(original)) {
      return true
    }
  }

  return false
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useTemplateDetail(templateId: string) {
  // Primary State
  const state = ref<TemplateDetailState>({ status: 'loading' })
  const templateName = ref('')
  const blocks = shallowRef<ReadonlyArray<DbTemplateBlock>>([])

  // Operation States
  const isSaving = ref(false)
  const isStarting = ref(false)

  // Computed - derived state
  const isEdited = computed(() => {
    if (state.value.status !== 'success') return false
    return checkIsEdited(state.value.template, templateName.value, blocks.value)
  })

  // Methods
  async function loadTemplate(): Promise<boolean> {
    state.value = { status: 'loading' }

    const [error, loaded] = await tryCatch(getTemplatesRepository().getById(templateId))

    if (error || !loaded) {
      state.value = { status: 'not-found' }
      return false
    }

    state.value = { status: 'success', template: loaded }
    templateName.value = loaded.name
    blocks.value = loaded.blocks

    return true
  }

  async function saveTemplate(): Promise<void> {
    if (state.value.status !== 'success' || isSaving.value) return

    isSaving.value = true
    await tryCatch(
      getTemplatesRepository().update(state.value.template.id, {
        name: templateName.value.trim(),
        blocks: blocks.value,
      }),
    )

    // Reload to get updated data
    await loadTemplate()
    isSaving.value = false
  }

  async function deleteTemplate(): Promise<void> {
    if (state.value.status !== 'success') return
    await tryCatch(getTemplatesRepository().delete(state.value.template.id))
  }

  async function startWorkout(): Promise<{ id: string; workout: Workout } | null> {
    if (state.value.status !== 'success' || isStarting.value) return null

    isStarting.value = true
    const [error, activeWorkout] = await tryCatch(
      getTemplatesRepository().startFromTemplate(state.value.template.id),
    )

    if (error) {
      isStarting.value = false
      return null
    }

    const [saveError] = await tryCatch(getActiveWorkoutRepository().save(activeWorkout))

    if (saveError) {
      isStarting.value = false
      return null
    }

    const inMemoryWorkout = dbToWorkout(activeWorkout)
    isStarting.value = false
    // Return data instead of mutating state - let view coordinate
    return { id: activeWorkout.id, workout: inMemoryWorkout }
  }

  // Block management methods
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

  // Lifecycle Hooks
  onMounted(() => {
    loadTemplate()
  })

  return {
    state,
    templateName,
    blocks,
    isSaving,
    isStarting,
    isEdited,
    loadTemplate,
    saveTemplate,
    deleteTemplate,
    startWorkout,
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
