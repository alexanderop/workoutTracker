import { computed, ref } from 'vue'
import type { Exercise } from '@/composables/useExerciseSearch'

type BenchmarkType = 'fortime' | 'rounds'

export type BenchmarkFormExercise = {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  thumbnail: string
}

type BenchmarkFormState = {
  name: string
  type: BenchmarkType
  rounds: number
  exercises: Array<BenchmarkFormExercise>
}

function createInitialState(): BenchmarkFormState {
  return {
    name: '',
    type: 'fortime',
    rounds: 5,
    exercises: [],
  }
}

export function useBenchmarkForm() {
  const form = ref<BenchmarkFormState>(createInitialState())

  const isNameValid = computed(() => form.value.name.trim().length > 0)
  const hasExercises = computed(() => form.value.exercises.length > 0)
  const isSaveDisabled = computed(() => !isNameValid.value || !hasExercises.value)
  const showRoundsInput = computed(() => form.value.type === 'rounds')

  function reset() {
    form.value = createInitialState()
  }

  function addExercise(exercise: Exercise, reps: number) {
    form.value.exercises.push({
      exerciseDefinitionId: exercise.id ?? null,
      name: exercise.name,
      prescribedReps: reps,
      thumbnail: exercise.icon,
    })
  }

  function removeExercise(index: number) {
    form.value.exercises.splice(index, 1)
  }

  function reorderExercises(fromIndex: number, toIndex: number) {
    const exercises = [...form.value.exercises]
    const [movedExercise] = exercises.splice(fromIndex, 1)
    if (!movedExercise) {
      return
    }
    exercises.splice(toIndex, 0, movedExercise)
    form.value.exercises = exercises
  }

  function getFormData(): BenchmarkFormState {
    return {
      ...form.value,
      name: form.value.name.trim(),
    }
  }

  return {
    form,
    isNameValid,
    hasExercises,
    isSaveDisabled,
    showRoundsInput,
    reset,
    addExercise,
    removeExercise,
    reorderExercises,
    getFormData,
  }
}
