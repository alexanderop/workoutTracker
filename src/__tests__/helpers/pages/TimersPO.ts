import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'

/**
 * Page Object for the standalone timers page (Quick Timer).
 * Provides navigation from home to the timers page and starting timer presets.
 * Uses only global page queries, so it needs no TestContext or CommonPO.
 */
export class TimersPO {
  /**
   * Navigates to the timers page by clicking the Quick Timer card on the home page.
   * Waits for the timer type selection (AMRAP) to be visible before returning.
   */
  async goToTimersPage(): Promise<void> {
    await userEvent.click(page.getByText(/quick timer/i))
    await expect.element(page.getByText(/AMRAP/)).toBeVisible()
  }

  /**
   * Starts an AMRAP timer with the 5 min "Quick Burst" preset.
   * Assumes the timer type selection is visible (call goToTimersPage first).
   * Waits for the timer runner UI (exit button) before returning.
   */
  async startAmrapTimer(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: /amrap/i }))
    await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: /quick burst/i }))
    await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()
  }
}
