import { page } from 'vitest/browser'
import { expect } from 'vitest'

const LONG_PRESS_DELAY = 500
const EVENT_PROCESSING_DELAY = 50

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function createPointerEvent(type: string, clientX: number, clientY: number): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
  })
}

/**
 * Simulates a long press (pointerdown followed by delay then pointerup).
 * @param element - The element to long press on
 * @param duration - How long to hold in ms (default: LONG_PRESS_DELAY)
 */
async function simulateLongPress(element: Element, duration = LONG_PRESS_DELAY): Promise<void> {
  const rect = element.getBoundingClientRect()
  const clientX = rect.left + rect.width / 2
  const clientY = rect.top + rect.height / 2

  element.dispatchEvent(createPointerEvent('pointerdown', clientX, clientY))
  await delay(duration + EVENT_PROCESSING_DELAY)
  element.dispatchEvent(createPointerEvent('pointerup', clientX, clientY))
  await delay(EVENT_PROCESSING_DELAY)
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
