import { ref } from 'vue'

/**
 * Singleton manager for swipe-to-reveal actions.
 * Ensures only one item can be revealed at a time across the app.
 */
const currentRevealedId = ref<number | null>(null)

export function useSwipeActionsManager() {
  /**
   * Set the currently revealed item ID
   */
  function setRevealed(id: number | null) {
    currentRevealedId.value = id
  }

  /**
   * Close any other revealed item when opening a new one
   */
  function closeOthers(id: number): void {
    if (currentRevealedId.value !== null && currentRevealedId.value !== id) {
      currentRevealedId.value = null
    }
  }

  /**
   * Close the currently revealed item
   */
  function closeAll() {
    currentRevealedId.value = null
  }

  /**
   * Check if a specific item is currently revealed
   */
  function isRevealed(id: number): boolean {
    return currentRevealedId.value === id
  }

  return {
    currentRevealedId,
    setRevealed,
    closeOthers,
    closeAll,
    isRevealed,
  }
}
