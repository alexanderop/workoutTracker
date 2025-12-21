import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCustomExercisesRepository } from '@/db'
import { createDbCustomExercise, dbToCustomExercise } from '@/db/converters'
import { tryCatch } from '@/lib/tryCatch'
import type { CustomExercise } from '@/types/exercises'

export const useExercisesStore = defineStore('exercises', () => {
  const customExercises = ref<Array<CustomExercise>>([])
  const isLoaded = ref(false)
  const isLoading = ref(false)

  /**
   * Load all custom exercises from the database.
   * Call this on app initialization.
   */
  async function loadFromDb(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    const [error, dbExercises] = await tryCatch(getCustomExercisesRepository().getAll())
    isLoading.value = false

    if (error) return

    customExercises.value = dbExercises.map(dbToCustomExercise)
    isLoaded.value = true
  }

  /**
   * Add a new custom exercise to both DB and local state.
   */
  async function addExercise(
    exercise: Omit<CustomExercise, 'id' | 'createdAt'>,
  ): Promise<CustomExercise | null> {
    const dbExercise = createDbCustomExercise(exercise)

    // Save to DB first
    const [error] = await tryCatch(getCustomExercisesRepository().add(dbExercise))

    if (error) return null

    // Then update local state
    const newExercise = dbToCustomExercise(dbExercise)
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
   * Update an existing exercise in both DB and local state.
   */
  async function updateExercise(
    id: string,
    updates: Partial<Omit<CustomExercise, 'id' | 'createdAt'>>,
  ): Promise<boolean> {
    // Convert domain types (undefined) to database types (null)
    const dbUpdates = {
      name: updates.name,
      equipment: updates.equipment ?? null,
      muscle: updates.muscle ?? null,
      type: updates.type,
      metrics: updates.metrics,
      image: updates.image ?? null,
    }

    const [error] = await tryCatch(getCustomExercisesRepository().update(id, dbUpdates))

    if (error) return false

    // Update local state
    customExercises.value = customExercises.value.map((e) =>
      e.id === id ? { ...e, ...updates } : e,
    )
    return true
  }

  /**
   * Delete a custom exercise from both DB and local state.
   */
  async function deleteExercise(id: string): Promise<void> {
    const [error] = await tryCatch(getCustomExercisesRepository().delete(id))

    if (error) return

    customExercises.value = customExercises.value.filter((e) => e.id !== id)
  }

  return {
    customExercises,
    isLoaded,
    isLoading,
    loadFromDb,
    addExercise,
    updateExercise,
    getExerciseById,
    getAllExercises,
    deleteExercise,
  }
})
