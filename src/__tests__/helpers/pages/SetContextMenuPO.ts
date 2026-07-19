import { page } from 'vitest/browser'
import { expect } from 'vitest'

const LONG_PRESS_DELAY = 500

function delay(ms: number): Promise<void> {
  // A real elapsed hold is the behavior under test: the production long-press
  // recognizer uses native pointer timing and must not open on a short press.
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  await delay(duration)
  element.dispatchEvent(createPointerEvent('pointerup', clientX, clientY))
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
   *
   * Not filtered by accessible name: the menu is now per-row (opened either via the
   * row's overflow button or long-press) and its accessible name is supplied via
   * `aria-labelledby` pointing at the trigger button (e.g. "Options for set 2"), which
   * takes precedence over any `aria-label` on the menu itself per the ARIA name
   * computation algorithm. Only one context menu is ever open at a time, so matching
   * by role alone is unambiguous. See Finding 9, July 2026 UX review.
   */
  async waitForOpen(): Promise<void> {
    await expect.element(page.getByRole('menu')).toBeVisible()
  }

  /**
   * Waits for context menu to close.
   */
  async waitForClose(): Promise<void> {
    await expect.element(page.getByRole('menu')).not.toBeInTheDocument()
  }

  /**
   * Checks if the context menu is visible.
   */
  isVisible(): boolean {
    return page.getByRole('menu').query() !== null
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
   *
   * Dispatches a `pointerdown` directly on `document.body` rather than going
   * through Playwright's role-based locators or `.click()`. reka-ui's DropdownMenu
   * is a modal dismissable layer that, while open: (1) applies `aria-hidden` to
   * every other element on the page via the `aria-hidden` package's `hideOthers()`
   * (see `useHideOthers.js`), which makes `page.getByRole(...)` unable to find
   * *any* background element -- there is nothing "outside" left in the a11y tree;
   * and (2) sets `document.body.style.pointerEvents = 'none'` (see
   * DismissableLayer.js), so a real hit-tested click on a background element never
   * arrives. `document.body` itself is unaffected by both (it's the ancestor doing
   * the hiding, and the layer's own outside-dismiss detection listens for
   * `pointerdown` bubbling to `document` regardless of `pointer-events`). See
   * Finding 9, July 2026 UX review.
   */
  async clickOutside(): Promise<void> {
    document.body.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        isPrimary: true,
      }),
    )
  }
}
