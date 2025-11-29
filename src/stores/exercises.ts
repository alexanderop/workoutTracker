import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell' | 'band' | 'ez-bar' | 'hex-bar'
export type Muscle = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core'
export type ExerciseType = 'compound' | 'isolation' | 'stability' | 'cardio'
export type Metrics = 'weight-reps' | 'reps-only' | 'duration' | 'distance-duration' | 'weight-distance'

export type CustomExercise = {
  id: string
  icon: string
  name: string
  equipment?: Equipment
  muscle?: Muscle
  type: ExerciseType
  metrics: Metrics
  createdAt: number
}

export const useExercisesStore = defineStore('exercises', () => {
  const customExercises = ref<Array<CustomExercise>>([])

  function addExercise(exercise: Omit<CustomExercise, 'id' | 'createdAt'>): CustomExercise {
    const newExercise: CustomExercise = {
      ...exercise,
      id: `exercise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }
    customExercises.value = [...customExercises.value, newExercise]
    return newExercise
  }

  function getExerciseById(id: string): CustomExercise | undefined {
    return customExercises.value.find(e => e.id === id)
  }

  function getAllExercises(): Array<CustomExercise> {
    return customExercises.value
  }

  function deleteExercise(id: string): void {
    customExercises.value = customExercises.value.filter(e => e.id !== id)
  }

  return {
    customExercises,
    addExercise,
    getExerciseById,
    getAllExercises,
    deleteExercise,
  }
})
