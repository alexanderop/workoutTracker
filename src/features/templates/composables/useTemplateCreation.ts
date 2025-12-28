import { computed, ref, shallowRef } from 'vue'
import { watchIgnorable } from '@vueuse/core'
import { getTemplatesRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { DbTemplateBlock, DbWorkoutTemplate } from '@/db/schema'
import { useTemplateBlockManagement } from './useTemplateBlockManagement'

// ============================================
// Types
// ============================================

export type TemplateFormState = {
  name: string
  blocks: Array<DbTemplateBlock>
}

// ============================================
// Composable
// ============================================

export function useTemplateCreation() {
  // Primary State
  const templateName = ref('')
  const blocks = shallowRef<ReadonlyArray<DbTemplateBlock>>([])

  // Form state for draft persistence (combines templateName and blocks)
  const formState = ref<TemplateFormState>({
    name: '',
    blocks: [],
  })

  // Use watchIgnorable to prevent infinite loops during bidirectional sync
  // ignoreUpdates() wraps changes that shouldn't trigger the watcher

  // Sync formState.name ↔ templateName
  const { ignoreUpdates: ignoreNameUpdates } = watchIgnorable(
    () => formState.value.name,
    (v) => {
      ignoreTemplateNameUpdates(() => {
        templateName.value = v
      })
    },
  )
  const { ignoreUpdates: ignoreTemplateNameUpdates } = watchIgnorable(
    templateName,
    (v) => {
      ignoreNameUpdates(() => {
        formState.value.name = v
      })
    },
  )

  // Sync formState.blocks ↔ blocks
  const { ignoreUpdates: ignoreFormBlocksUpdates } = watchIgnorable(
    () => formState.value.blocks,
    (v) => {
      ignoreBlocksUpdates(() => {
        blocks.value = v
      })
    },
    { deep: true },
  )
  const { ignoreUpdates: ignoreBlocksUpdates } = watchIgnorable(
    blocks,
    (v) => {
      ignoreFormBlocksUpdates(() => {
        formState.value.blocks = Array.from(v)
      })
    },
    { deep: true },
  )

  // Operation State
  const isSaving = ref(false)

  // Computed
  const isValid = computed(
    () => templateName.value.trim().length > 0 && blocks.value.length > 0,
  )

  // Compose block management
  const blockManagement = useTemplateBlockManagement(blocks)

  function reset(): void {
    templateName.value = ''
    blocks.value = []
    formState.value.name = ''
    formState.value.blocks = []
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
    formState,
    isSaving,
    // Computed
    isValid,
    // Block Management
    ...blockManagement,
    // Methods
    reset,
    save,
  }
}
