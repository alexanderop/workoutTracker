import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSwipeableDelete } from '@/composables/useSwipeableDelete'
import { getWorkoutsRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'
import { createDbCompletedWorkout } from '../factories'
import { seedCompletedWorkout } from '../helpers/dbAssertions'

describe('useSwipeableDelete', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should be defined', () => {
    expect(useSwipeableDelete).toBeDefined()
  })

  it('tracks one open card at a time', () => {
    const { openCardId, isCardSwiped, handleCardOpen, handleCardClose } = useSwipeableDelete({
      workouts: [],
    })

    expect(isCardSwiped.value).toBe(false)

    handleCardOpen('w-1')
    expect(openCardId.value).toBe('w-1')
    expect(isCardSwiped.value).toBe(true)

    handleCardOpen('w-2')
    expect(openCardId.value).toBe('w-2')

    handleCardClose()
    expect(openCardId.value).toBeNull()
  })

  it('opens the confirmation dialog for a known workout passed as a plain array', () => {
    const { deleteDialogOpen, workoutToDelete, handleDeleteRequest } = useSwipeableDelete({
      workouts: [{ id: 'w-1', name: 'Leg Day' }],
    })

    handleDeleteRequest('w-1')

    expect(deleteDialogOpen.value).toBe(true)
    expect(workoutToDelete.value).toEqual({ id: 'w-1', name: 'Leg Day' })
  })

  it('ignores a delete request for an unknown id', () => {
    const { deleteDialogOpen, handleDeleteRequest } = useSwipeableDelete({
      workouts: () => [{ id: 'w-1', name: 'Leg Day' }],
    })

    handleDeleteRequest('nope')

    expect(deleteDialogOpen.value).toBe(false)
  })

  it('deletes the workout from the repository on confirm and fires onDeleted', async () => {
    const workout = createDbCompletedWorkout({ name: 'Push Day' })
    await seedCompletedWorkout(workout)
    const onDeleted = vi.fn()

    const { handleDeleteRequest, handleDeleteConfirm, workoutToDelete, openCardId } =
      useSwipeableDelete({
        workouts: () => [{ id: workout.id, name: workout.name }],
        onDeleted,
      })

    handleDeleteRequest(workout.id)
    await handleDeleteConfirm()

    const remaining = await getWorkoutsRepository().getHistory()
    expect(remaining.find((w) => w.id === workout.id)).toBeUndefined()
    expect(onDeleted).toHaveBeenCalledOnce()
    expect(workoutToDelete.value).toBeNull()
    expect(openCardId.value).toBeNull()
  })
})
