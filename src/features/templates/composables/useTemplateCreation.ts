import { computed, ref } from 'vue'
import { getTemplatesRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { Exercise } from '@/composables/useExerciseSearch'
import type { DbTemplateHeader } from '@/db/schema'
import type { TemplateExercise } from '@/features/templates/components/TemplateExerciseList.vue'
import { createTemplateExercise } from '@/features/templates/lib/templateExercise'

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Converts template exercises to strength blocks for database storage.
 */
function exercisesToBlocks(exercises: ReadonlyArray<TemplateExercise>) {
  return exercises.map((ex) => ({
    kind: 'strength' as const,
    exerciseDefinitionId: null,
    name: ex.name,
    equipment: ex.equipment,
    targetReps: 8,
    thumbnail: ex.thumbnail,
    defaultSetCount: ex.defaultSetCount,
  }))
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useTemplateCreation() {
  // Primary State
  const templateName = ref('')
  const exercises = ref<ReadonlyArray<TemplateExercise>>([])

  // UI State
  const isAddExerciseOpen = ref(false)

  // Operation State
  const isSaving = ref(false)

  // Computed
  const isValid = computed(
    () => templateName.value.trim().length > 0 && exercises.value.length > 0,
  )

  // Methods
  function addExercise(exercise: Exercise): void {
    const templateExercise = createTemplateExercise(exercise)
    exercises.value = [...exercises.value, templateExercise]
  }

  function removeExercise(exerciseId: string): void {
    exercises.value = exercises.value.filter((ex) => ex.exerciseId !== exerciseId)
  }

  function updateExercises(updated: ReadonlyArray<TemplateExercise>): void {
    exercises.value = updated
  }

  async function save(): Promise<DbTemplateHeader | null> {
    if (!isValid.value || isSaving.value) return null

    isSaving.value = true
    const [error, template] = await tryCatch(
      getTemplatesRepository().create({
        name: templateName.value.trim(),
        blocks: exercisesToBlocks(exercises.value),
      }),
    )

    isSaving.value = false

    if (error) return null
    return template
  }

  return {
    // State
    templateName,
    exercises,
    isAddExerciseOpen,
    isSaving,
    // Computed
    isValid,
    // Methods
    addExercise,
    removeExercise,
    updateExercises,
    save,
  }
}
