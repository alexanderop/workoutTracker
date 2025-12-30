import { computed, ref } from 'vue'
import { useToggle } from '@vueuse/core'
import type { Exercise } from '@/composables/useExerciseSearch'
import { generateId } from '@/db/index'
import type { BlockExercise } from '@/types/blocks'

export function useTimedBlockExercises() {
  const exercises = ref<Array<BlockExercise>>([])
  const [showExercisePicker, toggleShowExercisePicker] = useToggle(false)

  const canConfirm = computed(() => exercises.value.length > 0)

  function handleSelectExercise(exercise: Exercise) {
    const newExercise: BlockExercise = {
      id: generateId(),
      name: exercise.name,
      prescribedReps: 10,
      load: null,
      image: exercise.image ?? null,
    }
    exercises.value = [...exercises.value, newExercise]
    toggleShowExercisePicker(false)
  }

  function removeExercise(index: number) {
    exercises.value = exercises.value.filter((_, index_) => index_ !== index)
  }

  function updateExerciseReps(index: number, reps: number) {
    exercises.value = exercises.value.map((ex, index_) =>
      index_ === index ? { ...ex, prescribedReps: reps } : ex,
    )
  }

  function updateExerciseLoad(index: number, load: string) {
    exercises.value = exercises.value.map((ex, index_) =>
      index_ === index ? { ...ex, load: load || null } : ex,
    )
  }

  function reset() {
    exercises.value = []
    toggleShowExercisePicker(false)
  }

  return {
    exercises,
    showExercisePicker,
    canConfirm,
    handleSelectExercise,
    removeExercise,
    updateExerciseReps,
    updateExerciseLoad,
    reset,
  }
}
