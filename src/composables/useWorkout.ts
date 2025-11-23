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

// Initialize workout with multiple exercises
const initialWorkout: Workout = {
  id: 1,
  name: 'Full Body',
  selectedExerciseId: 1,
  exercises: [
    {
      id: 1,
      name: 'Einarmige Cleans',
      equipment: 'Kettlebells',
      targetReps: 10,
      thumbnail: '🏋️',
      sets: [
        { id: 1, kg: '16', reps: '8', rir: '3', status: 'completed' },
        { id: 2, kg: '18', reps: '11', rir: '1', status: 'active' },
        { id: 3, kg: '16', reps: '8', rir: '', status: 'planned' },
        { id: 4, kg: '', reps: '8', rir: '', status: 'planned' },
        { id: 5, kg: '', reps: '8', rir: '', status: 'planned' },
      ],
    },
    {
      id: 2,
      name: 'Push Press',
      equipment: 'Kettlebells',
      targetReps: 8,
      thumbnail: '💪',
      sets: [
        { id: 1, kg: '20', reps: '8', rir: '2', status: 'completed' },
        { id: 2, kg: '22', reps: '6', rir: '0', status: 'active' },
        { id: 3, kg: '20', reps: '8', rir: '', status: 'planned' },
      ],
    },
    {
      id: 3,
      name: 'Goblet Squats',
      equipment: 'Kettlebells',
      targetReps: 12,
      thumbnail: '🦵',
      sets: [
        { id: 1, kg: '32', reps: '12', rir: '1', status: 'planned' },
        { id: 2, kg: '32', reps: '12', rir: '', status: 'planned' },
      ],
    },
    {
      id: 4,
      name: 'Bench Press',
      equipment: 'Barbell',
      targetReps: 6,
      thumbnail: '🪑',
      sets: [
        { id: 1, kg: '80', reps: '6', rir: '2', status: 'completed' },
        { id: 2, kg: '85', reps: '5', rir: '1', status: 'planned' },
        { id: 3, kg: '80', reps: '6', rir: '', status: 'planned' },
        { id: 4, kg: '75', reps: '8', rir: '', status: 'planned' },
      ],
    },
    {
      id: 5,
      name: 'Deadlift',
      equipment: 'Barbell',
      targetReps: 5,
      thumbnail: '💀',
      sets: [
        { id: 1, kg: '100', reps: '5', rir: '3', status: 'planned' },
        { id: 2, kg: '110', reps: '3', rir: '1', status: 'planned' },
        { id: 3, kg: '100', reps: '5', rir: '', status: 'planned' },
      ],
    },
    {
      id: 6,
      name: 'Barbell Rows',
      equipment: 'Barbell',
      targetReps: 8,
      thumbnail: '📦',
      sets: [
        { id: 1, kg: '70', reps: '8', rir: '2', status: 'planned' },
        { id: 2, kg: '75', reps: '6', rir: '1', status: 'planned' },
        { id: 3, kg: '70', reps: '8', rir: '', status: 'planned' },
      ],
    },
    {
      id: 7,
      name: 'Pull-ups',
      equipment: 'Pull-up Bar',
      targetReps: 10,
      thumbnail: '🤸',
      sets: [
        { id: 1, kg: '0', reps: '8', rir: '2', status: 'planned' },
        { id: 2, kg: '0', reps: '8', rir: '1', status: 'planned' },
        { id: 3, kg: '0', reps: '6', rir: '', status: 'planned' },
      ],
    },
  ],
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
