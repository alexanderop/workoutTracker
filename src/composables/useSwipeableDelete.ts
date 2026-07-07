import {
  computed,
  shallowReadonly,
  shallowRef,
  toValue,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from 'vue'
import { getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

type WorkoutLike = { id: string; name: string }

export type UseSwipeableDeleteOptions<T extends WorkoutLike> = {
  /** The workout list to delete from; a ref or getter stays reactive. */
  workouts: MaybeRefOrGetter<ReadonlyArray<T>>
  /**
   * Optional post-delete hook. Not needed when `workouts` is backed by a live
   * query (it updates on its own once the delete lands); provide it when the
   * caller still loads its list manually.
   */
  onDeleted?: () => Promise<void> | void
}

export type UseSwipeableDeleteReturn = {
  openCardId: Readonly<ShallowRef<string | null>>
  /** Writable on purpose: bound via v-model to the confirmation dialog. */
  deleteDialogOpen: Ref<boolean>
  workoutToDelete: Readonly<ShallowRef<WorkoutLike | null>>
  handleCardOpen: (id: string) => void
  handleCardClose: () => void
  handleDeleteRequest: (id: string) => void
  handleDeleteConfirm: () => Promise<void>
  isCardSwiped: ComputedRef<boolean>
}

/**
 * Composable for managing swipeable workout card deletion.
 * Handles swipe state (one card open at a time), delete confirmation dialog,
 * and the actual deletion workflow.
 *
 * @param options
 */
export function useSwipeableDelete<T extends WorkoutLike>(
  options: UseSwipeableDeleteOptions<T>,
): UseSwipeableDeleteReturn {
  const { workouts, onDeleted } = options

  // Swipe state - only one card can be open at a time
  const openCardId = shallowRef<string | null>(null)

  // Delete confirmation dialog state
  const deleteDialogOpen = shallowRef(false)
  const workoutToDelete = shallowRef<{ id: string; name: string } | null>(null)

  function handleCardOpen(id: string): void {
    openCardId.value = id
  }

  function handleCardClose(): void {
    openCardId.value = null
  }

  function handleDeleteRequest(id: string): void {
    const workout = toValue(workouts).find((w) => w.id === id)
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
    openCardId: shallowReadonly(openCardId),
    deleteDialogOpen,
    workoutToDelete: shallowReadonly(workoutToDelete),
    // Methods
    handleCardOpen,
    handleCardClose,
    handleDeleteRequest,
    handleDeleteConfirm,
    // Computed helpers
    isCardSwiped,
  }
}
