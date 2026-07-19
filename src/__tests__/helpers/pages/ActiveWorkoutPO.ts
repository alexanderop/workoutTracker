import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import { tryCatch } from '@/lib/tryCatch'
import type { SetInputs, SetValues } from '../types'
import type { CommonPO } from './CommonPO'
import { ensureHTMLElement } from '../domHelpers'
import { SetRowPO } from './SetRowPO'

async function fillValue(element: HTMLInputElement, value?: number): Promise<void> {
  if (value !== undefined) {
    await userEvent.fill(element, String(value))
  }
}

/**
 * Page Object for the active workout view.
 * Provides methods to interact with sets, navigate between blocks, and control timers.
 */
export class ActiveWorkoutPO {
  constructor(private common: CommonPO) {}

  /**
   * Gets an input element from a table row by aria-label using chained locators.
   * @param rowLocator - The table row locator to search within
   * @param name - The accessible name pattern to match
   * @returns The input element
   */
  private async getInputFromRow(
    rowLocator: ReturnType<typeof page.getByRole>,
    name: RegExp,
  ): Promise<HTMLInputElement> {
    const input = await rowLocator.getByRole('spinbutton', { name }).findElement()
    if (!(input instanceof HTMLInputElement)) {
      throw new TypeError(`Input matching ${name} is not an HTMLInputElement`)
    }
    return input
  }

  /**
   * Gets the complete button from a table row.
   * @param rowLocator - The table row locator to search within
   * @returns The complete button element
   */
  private async getCompleteButtonFromRow(
    rowLocator: ReturnType<typeof page.getByRole>,
  ): Promise<HTMLElement> {
    return ensureHTMLElement(
      await rowLocator.getByRole('button', { name: /mark set.*(complete|done)/i }).findElement(),
    )
  }

  /**
   * Retrieves input elements and complete button for a specific set row.
   * @param setIndex - Zero-based index of the set row in the table
   * @returns Object containing weight, reps, RIR inputs and complete button
   * @throws Error if the row or any required element is not found
   */
  async getSetRow(setIndex: number): Promise<SetInputs> {
    // Skip header row (index 0) by adding 1 to setIndex
    const row = page
      .getByRole('table')
      .getByRole('row')
      .nth(setIndex + 1)

    return {
      kg: await this.getInputFromRow(row, /weight for set/i),
      reps: await this.getInputFromRow(row, /^reps for set/i),
      rir: await this.getInputFromRow(row, /reps in reserve for set/i),
      complete: await this.getCompleteButtonFromRow(row),
    }
  }

  /**
   * Gets a SetRowPO for interacting with a specific set row.
   * Preferred over getSetRow() as it returns an abstracted Page Object.
   * @param setIndex - Zero-based index of the set row in the table
   * @returns SetRowPO for the specified row
   */
  getSet(setIndex: number): SetRowPO {
    const rowLocator = page
      .getByRole('table')
      .getByRole('row')
      .nth(setIndex + 1)
    return new SetRowPO(rowLocator, setIndex)
  }

  /**
   * Gets a SetRowPO for the currently active set row.
   * @returns SetRowPO for the active row, or null if no active row found
   */
  async getActiveSet(): Promise<SetRowPO | null> {
    const rows = await page.getByRole('table').getByRole('row').all()
    for (let index = 1; index < rows.length; index++) {
      const row = rows[index]
      if (!row) continue
      const cells = await row.getByRole('cell').all()
      const firstCell = cells[0]
      if (!firstCell) continue
      const firstCellElement = ensureHTMLElement(await firstCell.element())
      // The active state shows a div with data-set-state="active" and bg-primary class
      // eslint-disable-next-line no-restricted-syntax -- Testing data attribute + CSS class, no accessible equivalent
      const activeIndicator = firstCellElement.querySelector(
        '[data-set-state="active"], .bg-primary',
      )
      if (activeIndicator) {
        return this.getSet(index - 1) // Convert row index to set index
      }
    }
    return null
  }

  /**
   * Fills in the values for a specific set row.
   * Clears existing values before typing new ones. Skips undefined values.
   * @param setIndex - Zero-based index of the set row to fill
   * @param values - Object containing optional kg, reps, and rir values
   */
  async fillSet(setIndex: number, values: SetValues): Promise<void> {
    const inputs = await this.getSetRow(setIndex)

    await fillValue(inputs.kg, values.kg)
    await fillValue(inputs.reps, values.reps)
    await fillValue(inputs.rir, values.rir)
  }

  /**
   * Waits for the workout table to be visible.
   * Use this after starting a workout before interacting with sets.
   */
  async waitForTableVisible(): Promise<void> {
    await expect.element(page.getByRole('table')).toBeVisible()
  }

  /**
   * Gets the per-row overflow ("options") button for a specific set.
   * This is the keyboard/screen-reader-accessible alternative to the
   * long-press context menu -- see Finding 9, July 2026 UX review.
   * @param setIndex - Zero-based index of the set row in the table
   */
  getSetOptionsButton(setIndex: number): ReturnType<typeof page.getByRole> {
    return page.getByRole('button', {
      name: new RegExp(String.raw`options for set ${setIndex + 1}\b`, 'i'),
    })
  }

  /**
   * Opens the workout options menu by clicking the menu trigger button.
   */
  async openMenu(): Promise<void> {
    await page.getByRole('button', { name: /workout options|more options/i }).click()
  }

  /**
   * Retrieves a navigation button from the workout footer.
   * @param direction - Either 'prev' for previous block or 'next' for next block
   * @returns The navigation button element
   */
  async getFooterButton(direction: 'prev' | 'next'): Promise<HTMLElement> {
    const label = direction === 'prev' ? /previous block/i : /next block/i
    return ensureHTMLElement(await page.getByRole('button', { name: label }).element())
  }

  /**
   * Retrieves the workout options menu trigger button.
   * @returns The menu trigger button element
   */
  async getMenuTrigger(): Promise<HTMLElement> {
    return ensureHTMLElement(
      await page.getByRole('button', { name: /workout options|more options/i }).element(),
    )
  }

  /**
   * Retrieves a timer control button by its action type.
   * @param action - Either 'exit' to exit the timer or 'reset' to reset it
   * @returns The timer control button element
   */
  async getTimerControlButton(action: 'exit' | 'reset'): Promise<HTMLElement> {
    const labels: Record<typeof action, RegExp> = {
      exit: /exit timer/i,
      reset: /reset timer/i,
    }
    return ensureHTMLElement(await page.getByRole('button', { name: labels[action] }).element())
  }

  /**
   * Retrieves the play/pause button by its accessible name.
   * @returns The play/pause button element
   */
  async getTimerPlayPauseButton(): Promise<HTMLElement> {
    // Try pause button first (timer running), then play button (timer paused)
    const pauseButton = page.getByRole('button', { name: /pause timer/i }).query()
    if (pauseButton instanceof HTMLElement) return pauseButton

    const playButton = page.getByRole('button', { name: /start timer/i }).query()
    if (playButton instanceof HTMLElement) return playButton

    throw new Error('Play/pause button not found - check aria-label is present')
  }

  /**
   * Checks if the timer is currently running by checking for the Pause button.
   * @returns true if the timer shows a pause button (meaning it's running)
   */
  isTimerRunning(): boolean {
    return page.getByRole('button', { name: /pause timer/i }).query() !== null
  }

  /**
   * Gets the active set row (the one currently highlighted).
   * The active row is identified by having the primary-colored badge (bg-primary) in the first cell.
   * @returns The active row element
   * @throws Error if no active row is found
   */
  private async getActiveRow(): Promise<HTMLElement> {
    const table = page.getByRole('table')
    const rows = await table.getByRole('row').all()
    // Skip header row, check data rows
    for (let index = 1; index < rows.length; index++) {
      const row = rows[index]
      if (!row) continue
      const rowElement = ensureHTMLElement(await row.element())
      // Check for active indicator (primary-colored badge in first cell)
      const cells = await row.getByRole('cell').all()
      const firstCell = cells[0]
      if (!firstCell) continue
      const firstCellElement = ensureHTMLElement(await firstCell.element())
      // The active state shows a div with data-set-state="active" and bg-primary class
      // eslint-disable-next-line no-restricted-syntax -- Testing data attribute + CSS class, no accessible equivalent
      const activeIndicator = firstCellElement.querySelector(
        '[data-set-state="active"], .bg-primary',
      )
      if (activeIndicator) {
        return rowElement
      }
    }
    throw new Error('No active set row found')
  }

  /**
   * Gets input values from the currently active row (the row with the primary badge).
   * Useful for verifying prefilled values after completing a set.
   * @returns Object with weight, reps, rir inputs, or null if no active row
   */
  async getActiveRowInputs(): Promise<{
    weight: HTMLInputElement
    reps: HTMLInputElement
    rir: HTMLInputElement
  } | null> {
    const [error, row] = await tryCatch(this.getActiveRow())
    if (error || !row) return null

    // Find the row index to use with getSetRow
    const rows = await page.getByRole('table').getByRole('row').all()
    for (let index = 1; index < rows.length; index++) {
      const currentRow = rows[index]
      if (!currentRow) continue
      const rowElement = ensureHTMLElement(await currentRow.element())
      if (rowElement === row) {
        const rowLocator = page.getByRole('table').getByRole('row').nth(index)
        return {
          weight: await this.getInputFromRow(rowLocator, /weight for set/i),
          reps: await this.getInputFromRow(rowLocator, /^reps for set/i),
          rir: await this.getInputFromRow(rowLocator, /reps in reserve for set/i),
        }
      }
    }
    return null
  }

  /**
   * Checks if a specific set row shows completed state.
   * Looks for the completion checkmark icon in the set number column.
   * @param setIndex - Zero-based index of the set row
   * @returns true if the row shows a completion indicator (checkmark)
   */
  async isSetCompleted(setIndex: number): Promise<boolean> {
    const row = page
      .getByRole('table')
      .getByRole('row')
      .nth(setIndex + 1) // Skip header
    const cells = await row.getByRole('cell').all()
    const firstCell = cells[0]
    if (!firstCell) return false
    const firstCellElement = ensureHTMLElement(await firstCell.element())
    // The completed state shows a div with data-set-state="completed" and bg-success/20 class
    // eslint-disable-next-line no-restricted-syntax -- Testing data attribute + CSS class, no accessible equivalent
    const completedIndicator = firstCellElement.querySelector(
      String.raw`[data-set-state="completed"], .bg-success\/20`,
    )
    return completedIndicator !== null
  }

  /**
   * Gets the count of completed sets in the table.
   * Counts rows with the completion checkmark indicator.
   * @returns Number of completed sets
   */
  async getCompletedSetCount(): Promise<number> {
    const rows = await page.getByRole('table').getByRole('row').all()
    let count = 0
    // Skip header row
    for (let index = 1; index < rows.length; index++) {
      const row = rows[index]
      if (!row) continue
      const cells = await row.getByRole('cell').all()
      const firstCell = cells[0]
      if (!firstCell) continue
      const firstCellElement = ensureHTMLElement(await firstCell.element())
      // The completed state shows a div with data-set-state="completed" and bg-success/20 class
      // eslint-disable-next-line no-restricted-syntax -- Testing data attribute + CSS class, no accessible equivalent
      const completedIndicator = firstCellElement.querySelector(
        String.raw`[data-set-state="completed"], .bg-success\/20`,
      )
      if (completedIndicator) {
        count++
      }
    }
    return count
  }

  /**
   * Fills and completes multiple sets with the same values.
   * Useful for tests that need to complete several sets in sequence.
   * @param count - Number of sets to complete
   * @param values - Weight, reps, RIR values to use for each set
   */
  async completeMultipleSets(
    count: number,
    values: { weight: string; reps: string; rir: string },
  ): Promise<void> {
    for (let index = 0; index < count; index++) {
      await this.fillCardSetAndComplete(values)
    }
  }

  /**
   * Fills strength set inputs using the table-based UI and clicks the complete button.
   * Finds the active row (with enabled inputs) and fills it.
   * @param values - Object with weight, reps, rir values as strings
   */
  async fillCardSetAndComplete(values: {
    weight: string
    reps: string
    rir: string
  }): Promise<void> {
    const rowElement = await this.getActiveRow()

    // Find the row index
    const rows = await page.getByRole('table').getByRole('row').all()
    for (let index = 1; index < rows.length; index++) {
      const currentRow = rows[index]
      if (!currentRow) continue
      const currentRowElement = ensureHTMLElement(await currentRow.element())
      if (currentRowElement === rowElement) {
        const rowLocator = page.getByRole('table').getByRole('row').nth(index)

        const inputs = {
          weight: await this.getInputFromRow(rowLocator, /weight for set/i),
          reps: await this.getInputFromRow(rowLocator, /^reps for set/i),
          rir: await this.getInputFromRow(rowLocator, /reps in reserve for set/i),
        }

        const completeButton = await this.getCompleteButtonFromRow(rowLocator)

        await this.common.fillStrengthSetAndWaitForButton(inputs, values, completeButton)
        await userEvent.click(completeButton)
        return
      }
    }
    throw new Error('Active row not found in table')
  }

  /**
   * Ends the current workout via the menu and navigates to the summary page.
   * Handles the full flow: menu → end workout → confirm dialog → completion screen → view details.
   */
  async endWorkoutAndNavigateToSummary(): Promise<void> {
    // Open menu and click End Workout
    await expect.poll(() => this.getMenuTrigger()).toBeTruthy()
    await userEvent.click(await this.getMenuTrigger())

    await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
    await page.getByRole('menuitem', { name: /end workout/i }).click()

    // Confirm the dialog
    await this.common.waitForDialog()
    await userEvent.click(this.common.getDialogButton('Finish Workout'))

    // Wait for completion screen
    await expect.element(page.getByText(/workout complete/i)).toBeVisible()

    // Wait for View Details button to be clickable (animation needs to complete)
    const viewDetailsButton = page.getByRole('button', { name: /view details/i })
    await expect.element(viewDetailsButton, { timeout: 2000 }).toBeVisible()
    // Poll for animation to complete (opacity becomes 1)
    await expect
      .poll(
        async () => {
          const element = await viewDetailsButton.element()
          return getComputedStyle(element).opacity
        },
        { timeout: 2000 },
      )
      .toBe('1')
    await viewDetailsButton.click()

    // Wait for navigation to summary
    await this.common.waitForRoute(/^\/workout\/summary\//)
  }

  /**
   * Removes the current block via the header menu.
   * Opens the menu and clicks "Remove Block".
   */
  async removeCurrentBlock(): Promise<void> {
    await expect.poll(() => this.getMenuTrigger()).toBeTruthy()
    await userEvent.click(await this.getMenuTrigger())

    await expect.element(page.getByRole('menuitem', { name: /remove block/i })).toBeVisible()
    await page.getByRole('menuitem', { name: /remove block/i }).click()
  }
}
