import { describe, expect, it } from 'vitest'
import { useTimedBlockExercises } from '@/blocks/ui/useTimedBlockExercises'
import type { Exercise } from '@/composables/useExerciseSearch'

const pushUps: Exercise = { name: 'Push-ups', type: 'compound', metrics: 'reps-only' }
const squats: Exercise = { name: 'Air Squats', type: 'compound', metrics: 'reps-only' }

describe('useTimedBlockExercises', () => {
  it('should be defined', () => {
    expect(useTimedBlockExercises).toBeDefined()
  })

  it('starts empty and cannot confirm', () => {
    const { exercises, canConfirm } = useTimedBlockExercises()

    expect(exercises.value).toEqual([])
    expect(canConfirm.value).toBe(false)
  })

  it('adds a selected exercise with default reps and closes the picker', () => {
    const { exercises, canConfirm, showExercisePicker, handleSelectExercise } =
      useTimedBlockExercises()

    showExercisePicker.value = true
    handleSelectExercise(pushUps)

    expect(exercises.value).toHaveLength(1)
    expect(exercises.value[0]).toMatchObject({ name: 'Push-ups', prescribedReps: 10, load: null })
    expect(canConfirm.value).toBe(true)
    expect(showExercisePicker.value).toBe(false)
  })

  it('removes an exercise by index', () => {
    const { exercises, handleSelectExercise, removeExercise } = useTimedBlockExercises()
    handleSelectExercise(pushUps)
    handleSelectExercise(squats)

    removeExercise(0)

    expect(exercises.value.map((e) => e.name)).toEqual(['Air Squats'])
  })

  it('updates reps and load immutably', () => {
    const { exercises, handleSelectExercise, updateExerciseReps, updateExerciseLoad } =
      useTimedBlockExercises()
    handleSelectExercise(pushUps)

    updateExerciseReps(0, 15)
    updateExerciseLoad(0, '24kg')

    expect(exercises.value[0]).toMatchObject({ prescribedReps: 15, load: '24kg' })

    updateExerciseLoad(0, '')
    expect(exercises.value[0]?.load).toBeNull()
  })

  it('reset clears the list and closes the picker', () => {
    const { exercises, showExercisePicker, handleSelectExercise, reset } = useTimedBlockExercises()
    handleSelectExercise(pushUps)
    showExercisePicker.value = true

    reset()

    expect(exercises.value).toEqual([])
    expect(showExercisePicker.value).toBe(false)
  })
})
