import { page, userEvent } from 'vitest/browser'
import type { CommonPO } from './CommonPO'

/**
 * Page Object for the workout queue dialog.
 * Provides methods to open the queue and query its items.
 */
export class QueuePO {
  constructor(private common: CommonPO) {}

  /**
   * Opens the workout queue dialog by clicking the queue button.
   * Waits for the dialog to appear before returning.
   */
  async open(): Promise<void> {
    await page.getByRole('button', { name: /open workout queue/i }).click()
    await this.common.waitForDialog()
  }

  /**
   * Retrieves all queue item elements from the dialog.
   * @returns Array of queue item elements marked with data-queue-item attribute
   */
  getItems(): ReadonlyArray<HTMLElement> {
    const dialog = page.getByRole('dialog').query()
    if (!dialog) {
      return []
    }
    // eslint-disable-next-line no-restricted-syntax -- Finding by data attribute, no accessible equivalent
    const items = dialog.querySelectorAll('[data-queue-item]')
    return [...items].filter((item): item is HTMLElement => item instanceof HTMLElement)
  }

  /**
   * Finds the currently active item in the queue.
   * @returns The active queue item element, or null if none is active
   */
  getActiveItem(): HTMLElement | null {
    const items = this.getItems()
    return items.find((item) => item.textContent?.includes('(Active)')) ?? null
  }

  /**
   * Gets the remove button for a queue item at the given index.
   * @param index - Zero-based index of the queue item
   * @returns The remove button element
   */
  getRemoveButton(index: number): HTMLElement | null {
    const items = this.getItems()
    const item = items[index]
    if (!item) return null
    // eslint-disable-next-line no-restricted-syntax -- Scoped search within queue item element
    const button = item.querySelector(
      'button[aria-label*="remove" i], button[aria-label*="Remove" i]',
    )
    if (button instanceof HTMLElement) {
      return button
    }
    return null
  }

  /**
   * Removes a block from the queue by clicking its remove button.
   * The dialog stays open to allow further queue management.
   * @param index - Zero-based index of the block to remove
   */
  async removeBlock(index: number): Promise<void> {
    const removeButton = this.getRemoveButton(index)
    if (!removeButton) {
      throw new Error(`Remove button not found for queue item at index ${index}`)
    }
    await userEvent.click(removeButton)
  }

  /**
   * Closes the queue drawer by clicking the close button.
   */
  async close(): Promise<void> {
    await page.getByRole('button', { name: /close/i }).click()
    await this.common.waitForDialogClose()
  }

  /**
   * Reorders blocks in the queue by calling the underlying reorderBlocks function.
   * This simulates what would happen when a user completes a drag operation.
   * Note: Actual drag simulation doesn't work with Sortable.js synthetic events.
   * @param fromIndex - Zero-based index of the block to move
   * @param toIndex - Zero-based index of the target position
   */
  async reorderBlocks(fromIndex: number, toIndex: number): Promise<void> {
    // Call the reorderBlocks function exposed on window by the test app
    // This is what Sortable.js's onEnd handler calls
    const { useWorkout } = await import('@/features/workout/composables/useWorkout')
    const { reorderBlocks } = useWorkout()
    reorderBlocks(fromIndex, toIndex)
    // Callers should use expect.poll() to verify DOM updates
  }

  /**
   * Gets the block names in current order from the queue.
   * @returns Array of block names in display order
   */
  getBlockNames(): Array<string> {
    const items = this.getItems()
    return items.map((item) => {
      // Get the block name from the font-medium span
      // eslint-disable-next-line no-restricted-syntax -- Finding element by CSS class, no accessible equivalent
      const nameSpan = item.querySelector('.font-medium.truncate')
      return nameSpan?.textContent?.trim() ?? ''
    })
  }

  /**
   * Gets the "move up"/"move down" button for a queue item at the given index.
   * Keyboard/screen-reader-reachable alternative to drag-and-drop reordering --
   * see Finding "No way to reorder exercises in the workout queue drawer",
   * July 2026 UX review.
   * @param index - Zero-based index of the queue item
   */
  private getMoveButton(index: number, direction: 'up' | 'down'): HTMLElement | null {
    const items = this.getItems()
    const item = items[index]
    if (!item) return null
    // eslint-disable-next-line no-restricted-syntax -- Scoped search within queue item element
    const button = item.querySelector(
      `button[aria-label*="move" i][aria-label*="${CSS.escape(direction)}" i]`,
    )
    return button instanceof HTMLElement ? button : null
  }

  /**
   * Clicks the "move up"/"move down" button for the queue item at the given index.
   * @param index - Zero-based index of the block to move
   */
  private async move(index: number, direction: 'up' | 'down'): Promise<void> {
    const button = this.getMoveButton(index, direction)
    if (!button) {
      throw new Error(`Move ${direction} button not found for queue item at index ${index}`)
    }
    await userEvent.click(button)
  }

  getMoveUpButton(index: number): HTMLElement | null {
    return this.getMoveButton(index, 'up')
  }

  getMoveDownButton(index: number): HTMLElement | null {
    return this.getMoveButton(index, 'down')
  }

  moveUp(index: number): Promise<void> {
    return this.move(index, 'up')
  }

  moveDown(index: number): Promise<void> {
    return this.move(index, 'down')
  }
}
