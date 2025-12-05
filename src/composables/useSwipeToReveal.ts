import { animate, useMotionValue } from 'motion-v'
import { shallowRef, toValue, watch, type MaybeRefOrGetter, type ComponentPublicInstance } from 'vue'
import { onClickOutside, useMediaQuery } from '@vueuse/core'
import { useSwipeActionsManager } from '@/composables/useSwipeActionsManager'

type SwipeToRevealOptions = {
  /**
   * Number of action buttons to reveal
   * @default 2
   */
  actionCount?: number

  /**
   * Optional callback when swipe is closed
   */
  onClose?: () => void
}

/**
 * Manages swipe-to-reveal gesture interactions for touch devices.
 * Coordinates with global manager to ensure only one item reveals at a time.
 * Provides motion state, refs, and handlers for implementing swipe gestures.
 */
export function useSwipeToReveal(
  itemId: MaybeRefOrGetter<number>,
  options: SwipeToRevealOptions = {},
) {
  // 1. Initializing
  const { actionCount = 2, onClose } = options
  const { currentRevealedId, setRevealed } = useSwipeActionsManager()

  // Constants for swipe behavior
  const BUTTON_WIDTH = 60 // px - standard touch target size
  const REVEAL_WIDTH = BUTTON_WIDTH * actionCount
  const SNAP_THRESHOLD = BUTTON_WIDTH // snap when dragged past one button
  const SPRING_CONFIG = { type: 'spring' as const, stiffness: 300, damping: 30 }

  // 2. Primary State
  const x = useMotionValue(0)
  const containerRef = shallowRef<HTMLElement | null>(null)

  // Ref setter function for template binding
  function setContainerRef(el: Element | ComponentPublicInstance | null) {
    if (el instanceof HTMLElement) {
      containerRef.value = el
      return
    }
    if (el && '$el' in el && el.$el instanceof HTMLElement) {
      containerRef.value = el.$el
      return
    }
    containerRef.value = null
  }

  // 3. State Metadata
  const isTouchDevice = useMediaQuery('(pointer: coarse)')

  // 4. Computed
  // (none needed)

  // 5. Methods
  /**
   * Animate the swipe to closed position and clear revealed state
   */
  function closeSwipe() {
    animate(x, 0, SPRING_CONFIG)
    setRevealed(null)
    onClose?.()
  }

  /**
   * Handle drag end event to determine snap position
   */
  function handleDragEnd(_event: PointerEvent, info: { offset: { x: number } }) {
    const offset = info.offset.x
    const shouldOpen = offset < -SNAP_THRESHOLD

    animate(x, shouldOpen ? -REVEAL_WIDTH : 0, SPRING_CONFIG)
    setRevealed(shouldOpen ? toValue(itemId) : null)

    if (!shouldOpen) {
      onClose?.()
    }
  }

  // 6. Lifecycle Hooks
  // Close swipe when clicking outside the container
  onClickOutside(containerRef, () => {
    if (x.get() !== 0) {
      closeSwipe()
    }
  })

  // 7. Watchers
  // Close when another item opens
  watch(
    () => currentRevealedId.value,
    (newId) => {
      if (newId !== toValue(itemId) && x.get() !== 0) {
        animate(x, 0, SPRING_CONFIG)
        onClose?.()
      }
    },
  )

  return {
    // State
    x,
    containerRef,
    setContainerRef,
    isTouchDevice,

    // Constants (for template binding)
    BUTTON_WIDTH,
    REVEAL_WIDTH,

    // Methods
    closeSwipe,
    handleDragEnd,
  }
}
