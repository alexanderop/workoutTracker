import { computed, ref, shallowRef } from 'vue'
import { getTemplatesRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { DbTemplateBlock, DbWorkoutTemplate } from '@/db/schema'
import { useTemplateBlockManagement } from './useTemplateBlockManagement'

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

  // Compose block management
  const blockManagement = useTemplateBlockManagement(blocks)

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
    // Block Management
    ...blockManagement,
    // Methods
    save,
  }
}
