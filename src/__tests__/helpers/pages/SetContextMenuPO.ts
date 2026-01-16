import { page } from 'vitest/browser'
import { expect } from 'vitest'

const LONG_PRESS_DELAY = 500

/**
 * Simulates a long press (pointerdown followed by delay then pointerup).
 * @param element - The element to long press on
 * @param duration - How long to hold in ms (default: LONG_PRESS_DELAY)
 */
async function simulateLongPress(element: Element, duration = LONG_PRESS_DELAY): Promise<void> {
  const rect = element.getBoundingClientRect()
  const clientX = rect.left + rect.width / 2
  const clientY = rect.top + rect.height / 2

  // Pointer down
  element.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
    }),
  )

  // Wait for the long press duration plus a small buffer
  await new Promise(resolve => setTimeout(resolve, duration + 50))

  // Pointer up
  element.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
    }),
  )

  // Small delay for event processing
  await new Promise(resolve => setTimeout(resolve, 50))
}

/**
 * Page Object for the set context menu (long-press menu).
 * Provides methods to trigger long press and interact with menu options.
 */
export class SetContextMenuPO {
  /**
   * Performs a long press on an element to trigger context menu.
   * @param element - The HTML element to long press on
   */
  async longPress(element: HTMLElement): Promise<void> {
    await simulateLongPress(element)
  }

  /**
   * Waits for context menu to be visible.
   */
  async waitForOpen(): Promise<void> {
    await expect.element(page.getByRole('menu', { name: /set actions/i })).toBeVisible()
  }

  /**
   * Waits for context menu to close.
   */
  async waitForClose(): Promise<void> {
    await expect.element(page.getByRole('menu', { name: /set actions/i })).not.toBeInTheDocument()
  }

  /**
   * Checks if the context menu is visible.
   */
  isVisible(): boolean {
    return page.getByRole('menu', { name: /set actions/i }).query() !== null
  }

  /**
   * Gets the Delete menu item.
   */
  getDeleteOption() {
    return page.getByRole('menuitem', { name: /delete/i })
  }

  /**
   * Gets the Duplicate menu item.
   */
  getDuplicateOption() {
    return page.getByRole('menuitem', { name: /duplicate/i })
  }

  /**
   * Clicks Delete option.
   */
  async clickDelete(): Promise<void> {
    await this.getDeleteOption().click()
  }

  /**
   * Clicks Duplicate option.
   */
  async clickDuplicate(): Promise<void> {
    await this.getDuplicateOption().click()
  }

  /**
   * Clicks outside the menu to dismiss it.
   */
  async clickOutside(): Promise<void> {
    await page.getByRole('heading', { name: 'Strength' }).click()
  }
}
