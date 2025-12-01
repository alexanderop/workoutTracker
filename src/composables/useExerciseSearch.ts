import type { ComputedRef, Ref } from 'vue'
import type { PopularExercise } from '@/data/popularExercises'

import { computed, ref } from 'vue'
import { popularExercises } from '@/data/popularExercises'

/**
 * Filters exercises by name using case-insensitive search.
 */
function filterExercisesByName(
  exercises: ReadonlyArray<PopularExercise>,
  query: string,
): Array<PopularExercise> {
  const normalizedQuery = query.toLowerCase()
  return exercises.filter((exercise) => exercise.name.toLowerCase().includes(normalizedQuery))
}

type UseExerciseSearchReturn = {
  searchQuery: Ref<string>
  filteredExercises: ComputedRef<Array<PopularExercise>>
}

/**
 * Composable that provides search functionality for popular exercises.
 * Returns all exercises when searchQuery is empty or whitespace.
 */
export function useExerciseSearch(): UseExerciseSearchReturn {
  // 2. Primary State
  const searchQuery = ref('')

  // 4. Computed
  const filteredExercises = computed(() => {
    const trimmedQuery = searchQuery.value.trim()
    if (!trimmedQuery) {
      return popularExercises
    }
    return filterExercisesByName(popularExercises, trimmedQuery)
  })

  return {
    searchQuery,
    filteredExercises,
  }
}
