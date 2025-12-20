import type { ComputedRef, Ref } from 'vue'
import type { PopularExercise } from '@/data/popularExercises'
import type { Equipment, MovementPattern, Muscle, PatternColor } from '@/types/exercises'

import { computed, ref } from 'vue'
import { useExercisesStore } from '@/stores/exercises'

/**
 * Exercise type that combines PopularExercise and CustomExercise.
 * Equipment and muscle are optional since custom exercises may not have them.
 */
export type Exercise = {
  name: string
  icon: string
  equipment?: PopularExercise['equipment']
  muscle?: PopularExercise['muscle']
  type: PopularExercise['type']
  metrics: PopularExercise['metrics']
  pattern?: MovementPattern
  color?: PatternColor
  id?: string
  createdAt?: number
}

type SearchField = 'name' | 'muscle' | 'equipment'

/**
 * Filters exercises by muscle group.
 * Returns all exercises when muscle is 'all'.
 */
function filterByMuscle(
  exercises: ReadonlyArray<Exercise>,
  muscle: Muscle | 'all',
): Array<Exercise> {
  if (muscle === 'all') return [...exercises]
  return exercises.filter((ex) => ex.muscle === muscle)
}

/**
 * Filters exercises by equipment type.
 * Returns all exercises when equipment is 'all'.
 */
function filterByEquipment(
  exercises: ReadonlyArray<Exercise>,
  equipment: Equipment | 'all',
): Array<Exercise> {
  if (equipment === 'all') return [...exercises]
  return exercises.filter((ex) => ex.equipment === equipment)
}

/**
 * Filters exercises by search query across specified fields.
 * Uses case-insensitive substring matching.
 */
function filterBySearchQuery(
  exercises: ReadonlyArray<Exercise>,
  query: string,
  fields: ReadonlyArray<SearchField>,
): Array<Exercise> {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return [...exercises]

  return exercises.filter((ex) =>
    fields.some((field) => ex[field]?.toLowerCase().includes(trimmed)),
  )
}

type UseExerciseSearchOptions = {
  muscleFilter?: Ref<Muscle | 'all'>
  equipmentFilter?: Ref<Equipment | 'all'>
  searchFields?: ReadonlyArray<SearchField>
}

type UseExerciseSearchReturn = {
  searchQuery: Ref<string>
  filteredExercises: ComputedRef<Array<Exercise>>
  allExercises: ComputedRef<Array<Exercise>>
}

/**
 * Composable that provides search functionality for all exercises.
 * Exercises are loaded from the store (popular exercises are seeded on app init).
 * Returns all exercises sorted alphabetically when searchQuery is empty.
 *
 * @param options.muscleFilter - Optional ref to filter by muscle group
 * @param options.searchFields - Fields to search (default: ['name'])
 */
export function useExerciseSearch(options?: UseExerciseSearchOptions): UseExerciseSearchReturn {
  const exercisesStore = useExercisesStore()
  const searchQuery = ref('')

  const searchFields = options?.searchFields ?? ['name']

  const allExercises = computed<Array<Exercise>>(() => {
    return [...exercisesStore.customExercises].toSorted((a, b) => a.name.localeCompare(b.name))
  })

  const filteredExercises = computed(() => {
    let result = allExercises.value

    if (options?.muscleFilter) {
      result = filterByMuscle(result, options.muscleFilter.value)
    }

    if (options?.equipmentFilter) {
      result = filterByEquipment(result, options.equipmentFilter.value)
    }

    result = filterBySearchQuery(result, searchQuery.value, searchFields)

    return result
  })

  return {
    searchQuery,
    filteredExercises,
    allExercises,
  }
}
