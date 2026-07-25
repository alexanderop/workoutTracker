import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { PopularExercise } from './catalog'
import type { Equipment, Muscle } from './types'

import { computed, ref, toValue } from 'vue'
import { useExercisesStore } from './store'

/**
 * Exercise type that combines PopularExercise and CustomExercise.
 * Equipment and muscle are optional since custom exercises may not have them.
 */
export type Exercise = {
  name: string
  image?: Blob
  equipment?: PopularExercise['equipment']
  muscle?: PopularExercise['muscle']
  type: PopularExercise['type']
  metrics: PopularExercise['metrics']
  id?: string
  createdAt?: number
}

type SearchField = 'name' | 'muscle' | 'equipment'

const exerciseNameCollator = new Intl.Collator()

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

export type UseExerciseSearchOptions = {
  /** Filter by muscle group; a ref or getter re-filters reactively. @default undefined */
  muscleFilter?: MaybeRefOrGetter<Muscle | 'all'>
  /** Filter by equipment type; a ref or getter re-filters reactively. @default undefined */
  equipmentFilter?: MaybeRefOrGetter<Equipment | 'all'>
  /**
   * Fields to match the search query against.
   * @default ['name']
   */
  searchFields?: ReadonlyArray<SearchField>
}

export type UseExerciseSearchReturn = {
  /** Writable on purpose: bound via v-model to the search input. */
  searchQuery: Ref<string>
  filteredExercises: ComputedRef<Array<Exercise>>
  allExercises: ComputedRef<Array<Exercise>>
}

/**
 * Composable that provides search functionality for all exercises.
 * Exercises are loaded from the store (popular exercises are seeded on app init).
 * Returns all exercises sorted alphabetically when searchQuery is empty.
 *
 * @param options
 */
export function useExerciseSearch(options: UseExerciseSearchOptions = {}): UseExerciseSearchReturn {
  const exercisesStore = useExercisesStore()
  const searchQuery = ref('')

  const searchFields = options.searchFields ?? ['name']

  const allExercises = computed<Array<Exercise>>(() => {
    return [...exercisesStore.customExercises].toSorted((a, b) =>
      exerciseNameCollator.compare(a.name, b.name),
    )
  })

  const filteredExercises = computed(() => {
    let result = allExercises.value

    if (options.muscleFilter) {
      result = filterByMuscle(result, toValue(options.muscleFilter))
    }

    if (options.equipmentFilter) {
      result = filterByEquipment(result, toValue(options.equipmentFilter))
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
