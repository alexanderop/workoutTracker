import { computed, ref } from 'vue'
import { getTemplatesRepository } from '@/db'
import { popularExercises } from '@/data/popularExercises'
import { tryCatch } from '@/lib/tryCatch'
import type { DbWorkoutTemplate } from '@/db/schema'
import type { TemplateExercise } from '@/features/templates/components/TemplateExerciseList.vue'

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Generates a unique exercise ID for template creation.
 */
function generateExerciseId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Finds a popular exercise by name and creates a template exercise from it.
 */
function createTemplateExercise(exerciseName: string): TemplateExercise | null {
  const popularExercise = popularExercises.find((ex) => ex.name === exerciseName)
  if (!popularExercise) return null

  return {
    exerciseId: generateExerciseId(),
    name: exerciseName,
    equipment: popularExercise.equipment,
    thumbnail: popularExercise.icon,
    defaultSetCount: 3,
  }
}

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
  function addExercise(exercise: { name: string; icon: string }): void {
    const templateExercise = createTemplateExercise(exercise.name)
    if (!templateExercise) return

    exercises.value = [...exercises.value, templateExercise]
  }

  function removeExercise(exerciseId: string): void {
    exercises.value = exercises.value.filter((ex) => ex.exerciseId !== exerciseId)
  }

  function updateExercises(updated: ReadonlyArray<TemplateExercise>): void {
    exercises.value = updated
  }

  async function save(): Promise<DbWorkoutTemplate | null> {
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
