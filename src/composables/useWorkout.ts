import { computed, ref } from 'vue'

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

// Initialize with empty workout
const initialWorkout: Workout = {
  id: 1,
  name: 'New Workout',
  selectedExerciseId: 0,
  exercises: [],
}

export function useWorkout() {
  const workout = ref<Workout>(initialWorkout)

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

    const newExercise: Exercise = {
      id: Math.max(...workout.value.exercises.map(e => e.id)) + 1,
      name,
      equipment: 'Equipment',
      targetReps: 8,
      thumbnail: '🆕',
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

  return {
    workout,
    selectedExercise,
    selectExercise,
    toggleSetComplete,
    addExercise,
    removeExercise,
  }
}
