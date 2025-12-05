import { computed, onMounted, ref } from 'vue'
import { templatesRepository } from '@/db/repositories/templates'
import { activeWorkoutRepository } from '@/db/repositories/activeWorkout'
import { dbToWorkout } from '@/db/converters'
import { restoreWorkout } from '@/stores/workoutState'
import { popularExercises } from '@/data/popularExercises'
import type { DbWorkoutTemplate, DbTemplateStrengthBlock } from '@/db/schema'

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
  | { status: 'success'; template: DbWorkoutTemplate }
  | { status: 'not-found' }

// ============================================
// Pure Functions (Functional Core)
// ============================================

/**
 * Extracts template exercises from strength blocks.
 */
function extractExercisesFromBlocks(
  blocks: ReadonlyArray<DbTemplateStrengthBlock>,
): ReadonlyArray<TemplateExercise> {
  return blocks.map((block) => ({
    exerciseId: block.name,
    name: block.name,
    equipment: block.equipment,
    thumbnail: block.thumbnail,
    defaultSetCount: block.defaultSetCount,
  }))
}

/**
 * Converts exercises back to template blocks for saving.
 */
function exercisesToBlocks(
  exercises: ReadonlyArray<TemplateExercise>,
): ReadonlyArray<DbTemplateStrengthBlock> {
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
 */
function checkIsEdited(
  template: DbWorkoutTemplate,
  currentName: string,
  currentExerciseCount: number,
): boolean {
  const strengthBlocks = template.blocks.filter((b) => b.kind === 'strength')
  return currentName !== template.name || currentExerciseCount !== strengthBlocks.length
}

// ============================================
// Composable (Imperative Shell)
// ============================================

export function useTemplateDetail(templateId: string) {
  // Primary State
  const state = ref<TemplateDetailState>({ status: 'loading' })
  const templateName = ref('')
  const exercises = ref<ReadonlyArray<TemplateExercise>>([])

  // Operation States
  const isSaving = ref(false)
  const isStarting = ref(false)

  // Computed - derived state
  const isEdited = computed(() => {
    if (state.value.status !== 'success') return false
    return checkIsEdited(state.value.template, templateName.value, exercises.value.length)
  })

  // Methods
  async function loadTemplate(): Promise<boolean> {
    state.value = { status: 'loading' }

    const loaded = await templatesRepository.getById(templateId)
    if (!loaded) {
      state.value = { status: 'not-found' }
      return false
    }

    state.value = { status: 'success', template: loaded }
    templateName.value = loaded.name

    const strengthBlocks = loaded.blocks.filter(
      (b): b is DbTemplateStrengthBlock => b.kind === 'strength',
    )
    exercises.value = extractExercisesFromBlocks(strengthBlocks)

    return true
  }

  async function saveTemplate(): Promise<void> {
    if (state.value.status !== 'success' || isSaving.value) return

    isSaving.value = true
    try {
      await templatesRepository.update(state.value.template.id, {
        name: templateName.value.trim(),
        blocks: exercisesToBlocks(exercises.value),
      })

      // Reload to get updated data
      await loadTemplate()
    } finally {
      isSaving.value = false
    }
  }

  async function deleteTemplate(): Promise<void> {
    if (state.value.status !== 'success') return
    await templatesRepository.delete(state.value.template.id)
  }

  async function startWorkout(): Promise<boolean> {
    if (state.value.status !== 'success' || isStarting.value) return false

    isStarting.value = true
    try {
      const activeWorkout = await templatesRepository.startFromTemplate(state.value.template.id)
      await activeWorkoutRepository.save(activeWorkout)
      const inMemoryWorkout = dbToWorkout(activeWorkout)
      restoreWorkout(inMemoryWorkout)
      return true
    } finally {
      isStarting.value = false
    }
  }

  // Exercise manipulation
  function addExercise(exerciseName: string): void {
    const popularExercise = popularExercises.find((ex) => ex.name === exerciseName)
    if (!popularExercise) return

    const newExercise: TemplateExercise = {
      exerciseId: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: exerciseName,
      equipment: popularExercise.equipment,
      thumbnail: popularExercise.icon,
      defaultSetCount: 3,
    }

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
