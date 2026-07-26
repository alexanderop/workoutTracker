import { computed, ref } from 'vue'
import type { ProgressionsRepository } from '@/db/interfaces'
import type { DbProgression } from '@/db/schema'
import type { Context } from '@/lib/di/context'
import { useRuntimeContext } from '@/lib/di/vue'
import { tryCatch } from '@/lib/tryCatch'
import { ProgressionRepo } from '../services'

// Common kettlebell weights in kg
export const COMMON_KETTLEBELL_WEIGHTS = [8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48] as const

// ============================================
// Composable
// ============================================

/**
 * Form state for creating/editing a progression.
 *
 * Repository injected per ADR 004 (brain/decisions/004-db-in-di.md).
 */
export function useProgressionForm(
  ctx: Context<ProgressionsRepository> = useRuntimeContext<ProgressionsRepository>(),
) {
  const repo = ctx.get(ProgressionRepo)
  // Form state
  const name = ref('')
  const selectedWeights = ref<Array<number>>([])
  const startingWeightIndex = ref(0)

  // Operation states
  const isSaving = ref(false)
  const saveError = ref<Error | null>(null)

  // Validation
  const isNameValid = computed(() => name.value.trim().length > 0)
  const hasWeights = computed(() => selectedWeights.value.length > 0)
  const isSaveDisabled = computed(() => !isNameValid.value || !hasWeights.value || isSaving.value)

  // Sorted weights for display and storage
  const sortedWeights = computed(() => [...selectedWeights.value].toSorted((a, b) => a - b))

  // Starting weight options (based on selected weights)
  const startingWeightOptions = computed(() =>
    sortedWeights.value.map((weight, index) => ({
      value: index,
      label: `${weight}kg`,
    })),
  )

  // Methods
  function toggleWeight(weight: number): void {
    const index = selectedWeights.value.indexOf(weight)

    // Add weight if not present
    if (index === -1) {
      selectedWeights.value = [...selectedWeights.value, weight]
      return
    }

    // Remove weight
    selectedWeights.value = selectedWeights.value.filter((w) => w !== weight)

    // Reset starting weight if it's no longer valid
    if (startingWeightIndex.value >= selectedWeights.value.length) {
      startingWeightIndex.value = 0
    }
  }

  function isWeightSelected(weight: number): boolean {
    return selectedWeights.value.includes(weight)
  }

  function reset(): void {
    name.value = ''
    selectedWeights.value = []
    startingWeightIndex.value = 0
    saveError.value = null
  }

  async function save(): Promise<DbProgression | null> {
    if (isSaveDisabled.value) return null

    isSaving.value = true
    saveError.value = null

    const [error, progression] = await tryCatch(
      repo.create({
        name: name.value.trim(),
        availableWeights: sortedWeights.value,
        startingWeightIndex: startingWeightIndex.value,
      }),
    )

    isSaving.value = false

    if (error) {
      saveError.value = error
      return null
    }

    return progression
  }

  return {
    // State
    name,
    selectedWeights,
    startingWeightIndex,
    isSaving,
    saveError,

    // Computed
    isNameValid,
    hasWeights,
    isSaveDisabled,
    sortedWeights,
    startingWeightOptions,

    // Methods
    toggleWeight,
    isWeightSelected,
    reset,
    save,
  }
}
