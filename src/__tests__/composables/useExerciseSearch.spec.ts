import { describe, expect, it } from 'vitest'
import { useExerciseSearch } from '@/composables/useExerciseSearch'
import { popularExercises } from '@/data/popularExercises'

describe('useExerciseSearch', () => {
  it('returns all exercises when searchQuery is empty', () => {
    const { searchQuery, filteredExercises } = useExerciseSearch()

    expect(searchQuery.value).toBe('')
    expect(filteredExercises.value.length).toBe(popularExercises.length)
  })

  it('returns all exercises when searchQuery is only whitespace', () => {
    const { searchQuery, filteredExercises } = useExerciseSearch()

    searchQuery.value = '   '

    expect(filteredExercises.value.length).toBe(popularExercises.length)
  })

  it('filters exercises by name (case-insensitive)', () => {
    const { searchQuery, filteredExercises } = useExerciseSearch()

    searchQuery.value = 'bench'

    expect(filteredExercises.value.length).toBe(1)
    expect(filteredExercises.value[0]!.name).toBe('Bench Press')
  })

  it('partial name matches work', () => {
    const { searchQuery, filteredExercises } = useExerciseSearch()

    searchQuery.value = 'kettlebell'

    expect(filteredExercises.value.length).toBeGreaterThan(0)
    expect(
      filteredExercises.value.every((ex) => ex.name.toLowerCase().includes('kettlebell')),
    ).toBe(true)
  })

  it('case-insensitive matching works', () => {
    const { searchQuery, filteredExercises } = useExerciseSearch()

    searchQuery.value = 'SQUAT'

    expect(filteredExercises.value.length).toBeGreaterThan(0)
    expect(filteredExercises.value.every((ex) => ex.name.toLowerCase().includes('squat'))).toBe(
      true,
    )
  })

  it('returns empty array when no exercises match the query', () => {
    const { searchQuery, filteredExercises } = useExerciseSearch()

    searchQuery.value = 'zzz-nonexistent-exercise'

    expect(filteredExercises.value.length).toBe(0)
  })
})
