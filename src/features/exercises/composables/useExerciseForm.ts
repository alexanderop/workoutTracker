import type {
  Equipment,
  ExerciseType,
  Metrics,
  MovementPattern,
  Muscle,
  PatternColor,
} from '@/types/exercises'
import { computed, ref } from 'vue'

type ExerciseFormState = {
  icon: string
  name: string
  equipment: Equipment | undefined
  muscle: Muscle | undefined
  type: ExerciseType
  metrics: Metrics
  pattern: MovementPattern | undefined
  color: PatternColor | undefined
}

function createInitialState(): ExerciseFormState {
  return {
    icon: '💪',
    name: '',
    equipment: undefined,
    muscle: undefined,
    type: 'isolation',
    metrics: 'weight-reps',
    pattern: undefined,
    color: undefined,
  }
}

export function useExerciseForm() {
  const form = ref<ExerciseFormState>(createInitialState())

  const isNameValid = computed(() => form.value.name.trim().length > 0)
  const isSaveDisabled = computed(() => !isNameValid.value)

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
    isSaveDisabled,
    reset,
    getFormData,
  }
}
