import { computed, onMounted, ref, shallowRef } from 'vue'
import { getTemplatesRepository, getActiveWorkoutRepository } from '@/db'
import { dbToWorkout } from '@/db/converters'
import { restoreWorkout } from '@/stores/workoutState'
import { tryCatch } from '@/lib/tryCatch'
import type { Exercise } from '@/composables/useExerciseSearch'
import type { DbNormalizedTemplateBlock, DbTemplateBlock } from '@/db/schema'
import type { TemplateWithBlocks } from '@/db/interfaces'
import { createTemplateExercise } from '@/features/templates/lib/templateExercise'

// ============================================
// Types
// ============================================

type TemplateExercise = {
  exerciseId: string
  name: string
  equipment: string
  thumbnail: string
  defaultSetCount: number
}

type TemplateDetailState =
  | { status: 'loading' }
  | { status: 'success'; template: TemplateWithBlocks }
  | { status: 'not-found' }

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Extracts template exercises from normalized strength blocks.
 */
function extractExercisesFromNormalizedBlocks(
  blocks: ReadonlyArray<DbNormalizedTemplateBlock>,
): ReadonlyArray<TemplateExercise> {
  return blocks
    .filter((block) => block.kind === 'strength')
    .map((block) => ({
      exerciseId: block.exerciseName ?? '',
      name: block.exerciseName ?? '',
      equipment: block.equipment ?? '',
      thumbnail: block.thumbnail ?? '',
      defaultSetCount: block.defaultSetCount ?? 3,
    }))
}

/**
 * Converts exercises back to template blocks for saving.
 */
function exercisesToBlocks(
  exercises: ReadonlyArray<TemplateExercise>,
): ReadonlyArray<DbTemplateBlock> {
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

/**
 * Checks if template has been edited compared to original.
 * Compares name, exercise count, order, and set counts.
 */
function checkIsEdited(
  template: TemplateWithBlocks,
  currentName: string,
  currentExercises: ReadonlyArray<TemplateExercise>,
): boolean {
  // Check name change
  if (currentName !== template.name) return true

  const originalBlocks = template.blocks.filter((b) => b.kind === 'strength')

  // Check exercise count change
  if (currentExercises.length !== originalBlocks.length) return true

  // Check exercise order and set count changes
  for (let i = 0; i < currentExercises.length; i++) {
    const current = currentExercises[i]
    const original = originalBlocks[i]
    if (!current || !original) return true

    // Check if exercise changed (order change) or set count changed
    if (
      current.name !== original.exerciseName ||
      current.defaultSetCount !== original.defaultSetCount
    ) {
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
  const exercises = shallowRef<ReadonlyArray<TemplateExercise>>([])

  // Operation States
  const isSaving = ref(false)
  const isStarting = ref(false)

  // Computed - derived state
  const isEdited = computed(() => {
    if (state.value.status !== 'success') return false
    return checkIsEdited(state.value.template, templateName.value, exercises.value)
  })

  // Methods
  async function loadTemplate(): Promise<boolean> {
    state.value = { status: 'loading' }

    const [error, loaded] = await tryCatch(getTemplatesRepository().getByIdWithBlocks(templateId))

    if (error || !loaded) {
      state.value = { status: 'not-found' }
      return false
    }

    state.value = { status: 'success', template: loaded }
    templateName.value = loaded.name

    exercises.value = extractExercisesFromNormalizedBlocks(loaded.blocks)

    return true
  }

  async function saveTemplate(): Promise<void> {
    if (state.value.status !== 'success' || isSaving.value) return

    isSaving.value = true
    await tryCatch(
      getTemplatesRepository().updateWithBlocks(
        state.value.template.id,
        templateName.value.trim(),
        exercisesToBlocks(exercises.value),
      ),
    )

    // Reload to get updated data
    await loadTemplate()
    isSaving.value = false
  }

  async function deleteTemplate(): Promise<void> {
    if (state.value.status !== 'success') return
    await tryCatch(getTemplatesRepository().delete(state.value.template.id))
  }

  async function startWorkout(): Promise<boolean> {
    if (state.value.status !== 'success' || isStarting.value) return false

    isStarting.value = true
    const [error, activeWorkout] = await tryCatch(
      getTemplatesRepository().startFromTemplate(state.value.template.id),
    )

    if (error) {
      isStarting.value = false
      return false
    }

    const [saveError] = await tryCatch(getActiveWorkoutRepository().save(activeWorkout))

    if (saveError) {
      isStarting.value = false
      return false
    }

    const inMemoryWorkout = dbToWorkout(activeWorkout)
    restoreWorkout(inMemoryWorkout)
    isStarting.value = false
    return true
  }

  // Exercise manipulation
  function addExercise(exercise: Exercise): void {
    const newExercise = createTemplateExercise(exercise)
    exercises.value = [...exercises.value, newExercise]
  }

  function removeExercise(exerciseId: string): void {
    exercises.value = exercises.value.filter((ex) => ex.exerciseId !== exerciseId)
  }

  function updateExercises(updated: ReadonlyArray<TemplateExercise>): void {
    exercises.value = updated
  }

  // Lifecycle Hooks
  onMounted(() => {
    loadTemplate()
  })

  return {
    state,
    templateName,
    exercises,
    isSaving,
    isStarting,
    isEdited,
    loadTemplate,
    saveTemplate,
    deleteTemplate,
    startWorkout,
    addExercise,
    removeExercise,
    updateExercises,
  }
}
