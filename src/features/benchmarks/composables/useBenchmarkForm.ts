import { computed, ref } from 'vue'
import type { Exercise } from '@/composables/useExerciseSearch'
import type { DbBenchmark } from '@/db/schema'
import type { BenchmarkType } from '@/types/benchmark'

export type BenchmarkFormExercise = {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  thumbnail: string
  equipment?: string
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
      equipment: exercise.equipment,
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
      name: form.value.name.trim(),
      type: form.value.type,
      rounds: form.value.rounds,
      exercises: form.value.exercises.map((ex) => ({ ...ex })),
    }
  }

  function initialize(benchmark: DbBenchmark) {
    form.value = {
      name: benchmark.name,
      type: benchmark.type,
      rounds: benchmark.rounds,
      exercises: benchmark.exercises.map((ex) => ({
        exerciseDefinitionId: ex.exerciseDefinitionId,
        name: ex.name,
        prescribedReps: ex.prescribedReps,
        thumbnail: ex.thumbnail,
      })),
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
    initialize,
  }
}
