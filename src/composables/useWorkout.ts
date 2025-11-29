import { computed, ref } from 'vue'
import { popularExercises } from '@/data/popularExercises'
import { useExercisesStore } from '@/stores/exercises'

export type SetStatus = 'completed' | 'active' | 'planned'

export interface Set {
  id: number
  kg: string
  reps: string
  rir: string
  status: SetStatus
}

export interface Exercise {
  id: number
  name: string
  equipment: string
  targetReps: number
  sets: Set[]
  thumbnail: string
}

export interface Workout {
  id: number
  name: string
  exercises: Exercise[]
  selectedExerciseId: number
}

// Singleton state - shared across all components
const workout = ref<Workout>({
  id: 1,
  name: 'New Workout',
  selectedExerciseId: 0,
  exercises: [],
})

export function useWorkout() {

  const selectedExercise = computed(() => {
    return workout.value.exercises.find(
      ex => ex.id === workout.value.selectedExerciseId,
    )
  })

  function selectExercise(exerciseId: number) {
    workout.value.selectedExerciseId = exerciseId
  }

  function toggleSetComplete(set: Set) {
    if (set.status === 'completed') {
      set.status = 'active'
    }
    else if (set.status === 'active') {
      set.status = 'completed'
    }
  }

  function addExercise(name: string) {
    if (!name.trim())
      return

    const exercisesStore = useExercisesStore()
    const popularExercise = popularExercises.find(e => e.name === name)
    const customExercise = exercisesStore.customExercises.find(e => e.name === name)
    const icon = popularExercise?.icon ?? customExercise?.icon ?? '🆕'

    const ids = workout.value.exercises.map(e => e.id)
    const newExercise: Exercise = {
      id: ids.length > 0 ? Math.max(...ids) + 1 : 1,
      name,
      equipment: 'Equipment',
      targetReps: 8,
      thumbnail: icon,
      sets: [
        { id: 1, kg: '', reps: '', rir: '', status: 'planned' },
        { id: 2, kg: '', reps: '', rir: '', status: 'planned' },
        { id: 3, kg: '', reps: '', rir: '', status: 'planned' },
      ],
    }

    workout.value.exercises.push(newExercise)
    workout.value.selectedExerciseId = newExercise.id
  }

  function removeExercise(exerciseId: number) {
    const index = workout.value.exercises.findIndex(e => e.id === exerciseId)
    if (index > -1) {
      workout.value.exercises.splice(index, 1)
      if (workout.value.selectedExerciseId === exerciseId) {
        workout.value.selectedExerciseId = workout.value.exercises[0]?.id || 0
      }
    }
  }

  function updateExercise(updates: Partial<Pick<Exercise, 'name' | 'equipment' | 'targetReps'>>) {
    const exercise = workout.value.exercises.find(
      ex => ex.id === workout.value.selectedExerciseId,
    )
    if (exercise) {
      Object.assign(exercise, updates)
    }
  }

  function addSet(exerciseId: number) {
    const exercise = workout.value.exercises.find(ex => ex.id === exerciseId)
    if (!exercise) return

    const setIds = exercise.sets.map(s => s.id)
    const newId = setIds.length > 0 ? Math.max(...setIds) + 1 : 1
    exercise.sets.push({
      id: newId,
      kg: '',
      reps: '',
      rir: '',
      status: 'planned',
    })
  }

  function removeSet(exerciseId: number, setId: number) {
    const exercise = workout.value.exercises.find(ex => ex.id === exerciseId)
    if (!exercise || exercise.sets.length <= 1) return

    const index = exercise.sets.findIndex(s => s.id === setId)
    if (index > -1) {
      exercise.sets.splice(index, 1)
    }
  }

  function setSetCount(exerciseId: number, count: number) {
    const exercise = workout.value.exercises.find(ex => ex.id === exerciseId)
    if (!exercise) return

    const targetCount = Math.max(1, count)
    const currentCount = exercise.sets.length

    if (targetCount > currentCount) {
      // Add sets
      for (let i = 0; i < targetCount - currentCount; i++) {
        addSet(exerciseId)
      }
    }
    else if (targetCount < currentCount) {
      // Remove sets from the end
      exercise.sets.splice(targetCount)
    }
  }

  function updateSetValue(setId: number, field: 'kg' | 'reps' | 'rir', value: number | undefined) {
    const exercise = selectedExercise.value
    if (!exercise) return

    const set = exercise.sets.find(s => s.id === setId)
    if (set) {
      set[field] = value !== undefined ? String(value) : ''
    }
  }

  return {
    workout,
    selectedExercise,
    selectExercise,
    toggleSetComplete,
    addExercise,
    removeExercise,
    updateExercise,
    addSet,
    removeSet,
    setSetCount,
    updateSetValue,
  }
}
