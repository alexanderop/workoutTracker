import type { CustomExercise, Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'
import { computed, ref } from 'vue'

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

export function useExerciseForm() {
  const form = ref<ExerciseFormState>(createInitialState())

  const isNameValid = computed(() => form.value.name.trim().length > 0)
  const hasImageError = computed(() => form.value.imageError !== undefined)
  const isSaveDisabled = computed(() => !isNameValid.value || hasImageError.value)

  function reset() {
    form.value = createInitialState()
  }

  function populateFromExercise(exercise: CustomExercise) {
    form.value = {
      name: exercise.name,
      equipment: exercise.equipment,
      muscle: exercise.muscle,
      type: exercise.type,
      metrics: exercise.metrics,
      image: exercise.image,
      imageError: undefined,
    }
  }

  function getFormData(): ExerciseFormState {
    return {
      ...form.value,
      name: form.value.name.trim(),
    }
  }

  return {
    form,
    isNameValid,
    hasImageError,
    isSaveDisabled,
    reset,
    populateFromExercise,
    getFormData,
  }
}
