import { createGlobalState } from '@vueuse/core'
import { reactive, ref } from 'vue'
import { getCustomExercisesRepository } from '@/db'
import { createDbCustomExercise, dbToCustomExercise } from '@/db/converters'
import { buildPartialUpdate } from '@/db/partialUpdate'
import { tryCatch } from '@/lib/tryCatch'
import type { CustomExercise } from '@/types/exercises'

/** Fields in DbCustomExercise that use null instead of undefined */
const NULLABLE_EXERCISE_FIELDS = ['equipment', 'muscle', 'image'] as const

export const useExercisesStore = createGlobalState(() => {
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
   * Only updates fields that are explicitly provided in the updates object.
   */
  async function updateExercise(
    id: string,
    updates: Partial<Omit<CustomExercise, 'id' | 'createdAt'>>,
  ): Promise<boolean> {
    // Build partial update with only the fields that were provided
    // Nullable fields (equipment, muscle, image) get undefined → null conversion
    const dbUpdates = buildPartialUpdate(updates, NULLABLE_EXERCISE_FIELDS)

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

  /** Reset state to defaults (for test isolation) */
  function $reset(): void {
    customExercises.value = []
    isLoaded.value = false
    isLoading.value = false
  }

  return reactive({
    customExercises,
    isLoaded,
    isLoading,
    loadFromDb,
    addExercise,
    updateExercise,
    getExerciseById,
    getAllExercises,
    deleteExercise,
    $reset,
  })
})
