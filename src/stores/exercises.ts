import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getExercisesRepository } from '@/db'
import { createDbExercise, dbToExercise } from '@/db/converters'
import { tryCatch } from '@/lib/tryCatch'
import type { CustomExercise } from '@/types/exercises'

export const useExercisesStore = defineStore('exercises', () => {
  const customExercises = ref<Array<CustomExercise>>([])
  const isLoaded = ref(false)
  const isLoading = ref(false)

  /**
   * Load all custom (non-built-in) exercises from the database.
   * Call this on app initialization.
   */
  async function loadFromDb(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    const [error, dbExercises] = await tryCatch(getExercisesRepository().getCustom())
    isLoading.value = false

    if (error) return

    customExercises.value = dbExercises.map(dbToExercise)
    isLoaded.value = true
  }

  /**
   * Add a new custom exercise to both DB and local state.
   */
  async function addExercise(
    exercise: Omit<CustomExercise, 'id' | 'createdAt'>,
  ): Promise<CustomExercise | null> {
    const dbExercise = createDbExercise(exercise)

    // Save to DB first
    const [error] = await tryCatch(getExercisesRepository().add(dbExercise))

    if (error) return null

    // Then update local state
    const newExercise = dbToExercise(dbExercise)
    customExercises.value = [...customExercises.value, newExercise]
    return newExercise
  }

  function getExerciseById(id: string): CustomExercise | undefined {
    return customExercises.value.find((e) => e.id === id)
  }

  function getAllExercises(): Array<CustomExercise> {
    return customExercises.value
  }

  /**
   * Delete a custom exercise from both DB and local state.
   */
  async function deleteExercise(id: string): Promise<void> {
    const [error] = await tryCatch(getExercisesRepository().delete(id))

    if (error) return

    customExercises.value = customExercises.value.filter((e) => e.id !== id)
  }

  return {
    customExercises,
    isLoaded,
    isLoading,
    loadFromDb,
    addExercise,
    getExerciseById,
    getAllExercises,
    deleteExercise,
  }
})
