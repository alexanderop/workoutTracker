import { computed, ref, toRaw, type WritableComputedRef } from 'vue'
import { getTemplatesRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { DbWorkoutTemplate } from '@/db/schema'
import type { DbTemplateBlock } from '@/blocks'
import { useTemplateBlockManagement } from './useTemplateBlockManagement'

// ============================================
// Types
// ============================================

type TemplateFormState = {
  name: string
  blocks: Array<DbTemplateBlock>
}

// ============================================
// Composable
// ============================================

export function useTemplateCreation() {
  // Single source of truth for form state
  const formState = ref<TemplateFormState>({
    name: '',
    blocks: [],
  })

  // Computed with getter/setter for backward compatibility with existing API
  const templateName = computed({
    get: () => formState.value.name,
    set: (v: string) => {
      formState.value.name = v
    },
  })

  // Blocks computed - Array<T> is assignable to ReadonlyArray<T>
  const blocks: WritableComputedRef<ReadonlyArray<DbTemplateBlock>> = computed({
    get: () => formState.value.blocks,
    set: (v: ReadonlyArray<DbTemplateBlock>) => {
      formState.value.blocks = [...v]
    },
  })

  // Operation State
  const isSaving = ref(false)

  // Computed
  const isValid = computed(() => templateName.value.trim().length > 0 && blocks.value.length > 0)

  // Compose block management
  const blockManagement = useTemplateBlockManagement(blocks)

  function reset(): void {
    formState.value = { name: '', blocks: [] }
  }

  async function save(): Promise<DbWorkoutTemplate | null> {
    if (!isValid.value || isSaving.value) return null

    isSaving.value = true
    // Deep clone to strip Vue reactivity - required for IndexedDB storage
    // eslint-disable-next-line unicorn/prefer-structured-clone -- structuredClone fails on Vue reactive objects
    const plainBlocks = JSON.parse(JSON.stringify(toRaw(formState.value.blocks)))
    const [error, template] = await tryCatch(
      getTemplatesRepository().create({
        name: templateName.value.trim(),
        blocks: plainBlocks,
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
