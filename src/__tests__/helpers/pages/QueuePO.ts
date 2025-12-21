import { page, userEvent } from 'vitest/browser'
import type { TestContext } from '../types'
import type { CommonPO } from './CommonPO'

/**
 * Page Object for the workout queue dialog.
 * Provides methods to open the queue and query its items.
 */
export class QueuePO {
  constructor(
    private ctx: TestContext,
    private common: CommonPO,
  ) {}

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
    const items = dialog.querySelectorAll('[data-queue-item]')
    return Array.from(items).filter((item): item is HTMLElement => item instanceof HTMLElement)
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
    const btn = item.querySelector('button[aria-label*="remove" i], button[aria-label*="Remove" i]')
    if (btn instanceof HTMLElement) {
      return btn
    }
    return null
  }

  /**
   * Removes a block from the queue by clicking its remove button.
   * The dialog stays open to allow further queue management.
   * @param index - Zero-based index of the block to remove
   */
  async removeBlock(index: number): Promise<void> {
    const removeBtn = this.getRemoveButton(index)
    if (!removeBtn) {
      throw new Error(`Remove button not found for queue item at index ${index}`)
    }
    await userEvent.click(removeBtn)
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
      const nameSpan = item.querySelector('.font-medium.truncate')
      return nameSpan?.textContent?.trim() ?? ''
    })
  }
}
