import { beforeEach, describe, expect, it } from 'vitest'
import { shallowRef } from 'vue'
import { useExerciseSearch } from '@/composables/useExerciseSearch'
import { useExercisesStore } from '@/stores/exercises'
import { createCustomExercise } from '../factories'

function seedExercises() {
  useExercisesStore().customExercises = [
    createCustomExercise({
      id: 'ex-1',
      name: 'Bench Press',
      muscle: 'chest',
      equipment: 'barbell',
    }),
    createCustomExercise({ id: 'ex-2', name: 'Squat', muscle: 'legs', equipment: 'barbell' }),
    createCustomExercise({ id: 'ex-3', name: 'Cable Fly', muscle: 'chest', equipment: 'cable' }),
  ]
}

describe('useExerciseSearch', () => {
  beforeEach(() => {
    useExercisesStore().$reset()
    seedExercises()
  })

  it('should be defined', () => {
    expect(useExerciseSearch).toBeDefined()
  })

  it('returns all exercises sorted alphabetically when the query is empty', () => {
    const { filteredExercises } = useExerciseSearch()

    expect(filteredExercises.value.map((e) => e.name)).toEqual([
      'Bench Press',
      'Cable Fly',
      'Squat',
    ])
  })

  it('filters by a case-insensitive substring of the name', () => {
    const { searchQuery, filteredExercises } = useExerciseSearch()

    searchQuery.value = 'press'

    expect(filteredExercises.value.map((e) => e.name)).toEqual(['Bench Press'])
  })

  it('applies a reactive muscle filter passed as a ref', () => {
    const muscleFilter = shallowRef<'all' | 'chest' | 'legs'>('chest')
    const { filteredExercises } = useExerciseSearch({ muscleFilter })

    expect(filteredExercises.value.map((e) => e.name)).toEqual(['Bench Press', 'Cable Fly'])

    muscleFilter.value = 'legs'
    expect(filteredExercises.value.map((e) => e.name)).toEqual(['Squat'])

    muscleFilter.value = 'all'
    expect(filteredExercises.value).toHaveLength(3)
  })

  it('applies an equipment filter passed as a getter', () => {
    const { filteredExercises } = useExerciseSearch({ equipmentFilter: () => 'cable' })

    expect(filteredExercises.value.map((e) => e.name)).toEqual(['Cable Fly'])
  })

  it('combines filters with the search query', () => {
    const { searchQuery, filteredExercises } = useExerciseSearch({
      muscleFilter: () => 'chest',
    })

    searchQuery.value = 'fly'

    expect(filteredExercises.value.map((e) => e.name)).toEqual(['Cable Fly'])
  })
})
