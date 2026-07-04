import { computed, ref, readonly, type ComputedRef, type Ref } from 'vue'
import { getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

type WorkoutLike = { id: string; name: string }

type UseSwipeableDeleteOptions<T extends WorkoutLike> = {
  workouts: Ref<ReadonlyArray<T>> | ComputedRef<ReadonlyArray<T>>
  /**
   * Optional post-delete hook. Not needed when `workouts` is backed by a live
   * query (it updates on its own once the delete lands); provide it when the
   * caller still loads its list manually.
   */
  onDeleted?: () => Promise<void> | void
}

/**
 * Composable for managing swipeable workout card deletion.
 * Handles swipe state (one card open at a time), delete confirmation dialog,
 * and the actual deletion workflow.
 */
export function useSwipeableDelete<T extends WorkoutLike>(options: UseSwipeableDeleteOptions<T>) {
  const { workouts, onDeleted } = options

  // Swipe state - only one card can be open at a time
  const openCardId = ref<string | null>(null)

  // Delete confirmation dialog state
  const deleteDialogOpen = ref(false)
  const workoutToDelete = ref<{ id: string; name: string } | null>(null)

  function handleCardOpen(id: string): void {
    openCardId.value = id
  }

  function handleCardClose(): void {
    openCardId.value = null
  }

  function handleDeleteRequest(id: string): void {
    const workout = workouts.value.find((w) => w.id === id)
    if (!workout) return

    workoutToDelete.value = { id: workout.id, name: workout.name }
    deleteDialogOpen.value = true
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!workoutToDelete.value) return

    const [error] = await tryCatch(getWorkoutsRepository().delete(workoutToDelete.value.id))
    if (error) {
      console.error('Failed to delete workout:', error)
      return
    }

    workoutToDelete.value = null
    openCardId.value = null

    await onDeleted?.()
  }

  /**
   * Check if any card is currently swiped open.
   * Use this to block navigation when a card is open.
   */
  const isCardSwiped = computed(() => openCardId.value !== null)

  return {
    // State (readonly where appropriate)
    openCardId: readonly(openCardId),
    deleteDialogOpen,
    workoutToDelete: readonly(workoutToDelete),
    // Methods
    handleCardOpen,
    handleCardClose,
    handleDeleteRequest,
    handleDeleteConfirm,
    // Computed helpers
    isCardSwiped,
  }
}
