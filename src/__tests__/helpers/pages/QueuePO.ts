import { page } from 'vitest/browser'
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
}
