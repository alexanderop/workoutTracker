/**
 * Helper to simulate a swipe left gesture on an element.
 * Uses touch events since useSwipe listens to TouchEvents.
 */
export async function simulateSwipeLeft(element: Element, distance = 100): Promise<void> {
  const rect = element.getBoundingClientRect()
  const startX = rect.left + rect.width / 2
  const startY = rect.top + rect.height / 2

  // Dispatch touch events
  element.dispatchEvent(
    new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [
        new Touch({
          identifier: 0,
          target: element,
          clientX: startX,
          clientY: startY,
        }),
      ],
    }),
  )

  // Move left
  element.dispatchEvent(
    new TouchEvent('touchmove', {
      bubbles: true,
      cancelable: true,
      touches: [
        new Touch({
          identifier: 0,
          target: element,
          clientX: startX - distance,
          clientY: startY,
        }),
      ],
    }),
  )

  // End touch
  element.dispatchEvent(
    new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [
        new Touch({
          identifier: 0,
          target: element,
          clientX: startX - distance,
          clientY: startY,
        }),
      ],
    }),
  )

  // Wait for state update
  await new Promise((resolve) => setTimeout(resolve, 50))
}

/**
 * Helper to get the swipeable container for a workout card.
 * Throws if not found (feature not implemented yet).
 */
export function getSwipeableContainer(element: Element): Element {
  const container = element.closest('[data-swipeable]')
  if (!container) {
    throw new Error('Swipeable container not found - feature not implemented yet')
  }
  return container
}
