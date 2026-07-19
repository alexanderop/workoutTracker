import type { CustomExercise, Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

type ExerciseFormState = {
  name: string
  equipment: Equipment | undefined
  muscle: Muscle | undefined
  type: ExerciseType
  metrics: Metrics
  image: Blob | undefined
  imageError: string | undefined
}

function createInitialState(): ExerciseFormState {
  return {
    name: '',
    equipment: undefined,
    muscle: undefined,
    type: 'isolation',
    metrics: 'weight-reps',
    image: undefined,
    imageError: undefined,
  }
}

/**
 * Pure check for whether two form snapshots represent the same data, for
 * dirty-tracking. `imageError` is transient validation state, not user
 * input, so it's intentionally excluded from the comparison.
 */
function isFormStateEqual(a: ExerciseFormState, b: ExerciseFormState): boolean {
  return (
    a.name === b.name &&
    a.equipment === b.equipment &&
    a.muscle === b.muscle &&
    a.type === b.type &&
    a.metrics === b.metrics &&
    a.image === b.image
  )
}

/**
 * Pure check for whether `name` collides with an existing exercise, other
 * than the one identified by `excludeId` (used so editing an exercise
 * doesn't flag its own unchanged name as a duplicate).
 * Comparison is whitespace-trimmed and case-insensitive.
 */
function isDuplicateExerciseName(
  name: string,
  existing: ReadonlyArray<Pick<CustomExercise, 'id' | 'name'>>,
  excludeId: string | undefined,
): boolean {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return false
  return existing.some(
    (exercise) => exercise.id !== excludeId && exercise.name.trim().toLowerCase() === normalized,
  )
}

export function useExerciseForm(
  existingExercises: MaybeRefOrGetter<ReadonlyArray<CustomExercise>> = [],
) {
  const form = ref<ExerciseFormState>(createInitialState())
  // Snapshot the form compares against to detect unsaved changes. Reset on
  // load/populate and after a successful save so the unsaved-changes guard
  // doesn't fire for data that's already persisted.
  const initialForm = ref<ExerciseFormState>(createInitialState())
  const editingId = ref<string | undefined>(undefined)

  const isNameValid = computed(() => form.value.name.trim().length > 0)
  const isDuplicateName = computed(() =>
    isDuplicateExerciseName(form.value.name, toValue(existingExercises), editingId.value),
  )
  const hasImageError = computed(() => form.value.imageError !== undefined)
  // A muscle group is required (not just equipment) because the exercise
  // library's muscle filter uses strict equality against a concrete value --
  // an exercise with `muscle: undefined` is invisible in every filtered tab
  // except "All". Equipment has the same filter risk but is left optional.
  const isMuscleValid = computed(() => form.value.muscle !== undefined)
  const isSaveDisabled = computed(
    () =>
      !isNameValid.value || !isMuscleValid.value || hasImageError.value || isDuplicateName.value,
  )
  const isDirty = computed(() => !isFormStateEqual(form.value, initialForm.value))

  function reset() {
    form.value = createInitialState()
    initialForm.value = createInitialState()
    editingId.value = undefined
  }

  function populateFromExercise(exercise: CustomExercise) {
    editingId.value = exercise.id
    const populated: ExerciseFormState = {
      name: exercise.name,
      equipment: exercise.equipment,
      muscle: exercise.muscle,
      type: exercise.type,
      metrics: exercise.metrics,
      image: exercise.image,
      imageError: undefined,
    }
    form.value = populated
    initialForm.value = { ...populated }
  }

  function getFormData(): ExerciseFormState {
    return {
      ...form.value,
      name: form.value.name.trim(),
    }
  }

  /** Marks the current form state as the new saved baseline (no longer dirty). */
  function markSaved(): void {
    initialForm.value = { ...form.value }
  }

  return {
    form,
    isNameValid,
    isDuplicateName,
    hasImageError,
    isMuscleValid,
    isSaveDisabled,
    isDirty,
    reset,
    populateFromExercise,
    getFormData,
    markSaved,
  }
}
