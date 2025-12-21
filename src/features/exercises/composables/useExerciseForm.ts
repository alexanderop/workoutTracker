import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'
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
    getFormData,
  }
}
