import { screen, within } from '@testing-library/vue'
import { tryCatch } from '@/lib/tryCatch'
import type { SetInputs, SetValues, TestContext } from '../types'
import type { CommonPO } from './CommonPO'

/**
 * Page Object for the active workout view.
 * Provides methods to interact with sets, navigate between blocks, and control timers.
 */
export class ActiveWorkoutPO {
  constructor(
    private ctx: TestContext,
    private common: CommonPO,
  ) {}

  /**
   * Gets an input element from a table row by aria-label using semantic queries.
   * @param row - The table row element to search within
   * @param name - The accessible name pattern to match
   * @returns The input element
   */
  private getInputFromRow(row: HTMLElement, name: RegExp): HTMLInputElement {
    const input = within(row).getByRole('spinbutton', { name })
    if (!(input instanceof HTMLInputElement)) {
      throw new Error(`Input matching ${name} is not an HTMLInputElement`)
    }
    return input
  }

  /**
   * Gets the complete button from a table row.
   * @param row - The table row element to search within
   * @returns The complete button element
   */
  private getCompleteButtonFromRow(row: HTMLElement): HTMLElement {
    return within(row).getByRole('button', { name: /mark set.*(complete|done)/i })
  }

  /**
   * Retrieves input elements and complete button for a specific set row.
   * @param setIndex - Zero-based index of the set row in the table
   * @returns Object containing weight, reps, RIR inputs and complete button
   * @throws Error if the row or any required element is not found
   */
  getSetRow(setIndex: number): SetInputs {
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    // Skip header row (index 0)
    const row = rows[setIndex + 1]
    if (!row || !(row instanceof HTMLElement)) {
      throw new Error(`Set row at index ${setIndex} not found`)
    }

    return {
      kg: this.getInputFromRow(row, /weight for set/i),
      reps: this.getInputFromRow(row, /^reps for set/i),
      rir: this.getInputFromRow(row, /reps in reserve for set/i),
      complete: this.getCompleteButtonFromRow(row),
    }
  }

  /**
   * Fills in the values for a specific set row.
   * Clears existing values before typing new ones. Skips undefined values.
   * @param setIndex - Zero-based index of the set row to fill
   * @param values - Object containing optional kg, reps, and rir values
   */
  async fillSet(setIndex: number, values: SetValues): Promise<void> {
    const inputs = this.getSetRow(setIndex)

    const typeValue = async (el: HTMLInputElement, val?: number): Promise<void> => {
      if (val !== undefined) {
        await this.ctx.user.clear(el)
        await this.ctx.user.type(el, String(val))
      }
    }

    await typeValue(inputs.kg, values.kg)
    await typeValue(inputs.reps, values.reps)
    await typeValue(inputs.rir, values.rir)
  }

  /**
   * Opens the workout options menu by clicking the menu trigger button.
   */
  async openMenu(): Promise<void> {
    await this.ctx.user.click(screen.getByRole('button', { name: /workout options|more options/i }))
  }

  /**
   * Retrieves a navigation button from the workout footer.
   * @param direction - Either 'prev' for previous block or 'next' for next block
   * @returns The navigation button element
   */
  getFooterButton(direction: 'prev' | 'next'): HTMLElement {
    const label = direction === 'prev' ? /previous block/i : /next block/i
    return screen.getByRole('button', { name: label })
  }

  /**
   * Retrieves the workout options menu trigger button.
   * @returns The menu trigger button element
   */
  getMenuTrigger(): HTMLElement {
    return screen.getByRole('button', { name: /workout options|more options/i })
  }

  /**
   * Retrieves a timer control button by its action type.
   * @param action - Either 'exit' to exit the timer or 'reset' to reset it
   * @returns The timer control button element
   */
  getTimerControlButton(action: 'exit' | 'reset'): HTMLElement {
    const labels: Record<typeof action, RegExp> = {
      exit: /exit timer/i,
      reset: /reset timer/i,
    }
    return screen.getByRole('button', { name: labels[action] })
  }

  /**
   * Retrieves the play/pause button by its accessible name.
   * @returns The play/pause button element
   */
  getTimerPlayPauseButton(): HTMLElement {
    // Try pause button first (timer running), then play button (timer paused)
    const pauseBtn = screen.queryByRole('button', { name: /pause timer/i })
    if (pauseBtn) return pauseBtn

    const playBtn = screen.queryByRole('button', { name: /start timer/i })
    if (playBtn) return playBtn

    throw new Error('Play/pause button not found - check aria-label is present')
  }

  /**
   * Checks if the timer is currently running by checking for the Pause button.
   * @returns true if the timer shows a pause button (meaning it's running)
   */
  isTimerRunning(): boolean {
    return screen.queryByRole('button', { name: /pause timer/i }) !== null
  }

  /**
   * Gets the active set row (the one currently highlighted).
   * The active row is identified by having the primary-colored badge (bg-primary) in the first cell.
   * @returns The active row element
   * @throws Error if no active row is found
   */
  private getActiveRow(): HTMLElement {
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    // Skip header row, check data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!(row instanceof HTMLElement)) continue
      // Check for active indicator (primary-colored badge in first cell)
      const cells = within(row).getAllByRole('cell')
      const firstCell = cells[0]
      if (!firstCell) continue
      // The active state shows a div with bg-primary containing the set number
      const activeIndicator = firstCell.querySelector('.bg-primary')
      if (activeIndicator) {
        return row
      }
    }
    throw new Error('No active set row found (no bg-primary indicator)')
  }

  /**
   * Gets input values from the currently active row (the row with the primary badge).
   * Useful for verifying prefilled values after completing a set.
   * @returns Object with weight, reps, rir inputs, or null if no active row
   */
  getActiveRowInputs(): { weight: HTMLInputElement; reps: HTMLInputElement; rir: HTMLInputElement } | null {
    const [error, row] = tryCatch(() => this.getActiveRow())
    if (error || !row) return null

    return {
      weight: this.getInputFromRow(row, /weight for set/i),
      reps: this.getInputFromRow(row, /^reps for set/i),
      rir: this.getInputFromRow(row, /reps in reserve for set/i),
    }
  }

  /**
   * Checks if a specific set row shows completed state.
   * Looks for the completion checkmark icon in the set number column.
   * @param setIndex - Zero-based index of the set row
   * @returns true if the row shows a completion indicator (checkmark)
   */
  isSetCompleted(setIndex: number): boolean {
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    const row = rows[setIndex + 1] // Skip header
    if (!row) return false
    // Check for completed indicator (checkmark icon with success color in first cell)
    const cells = within(row).getAllByRole('cell')
    const firstCell = cells[0]
    if (!firstCell) return false
    // The completed state shows a div with bg-success/20 containing a Check icon
    const completedIndicator = firstCell.querySelector('.bg-success\\/20')
    return completedIndicator !== null
  }

  /**
   * Gets the count of completed sets in the table.
   * Counts rows with the completion checkmark indicator.
   * @returns Number of completed sets
   */
  getCompletedSetCount(): number {
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    let count = 0
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row) continue
      const cells = within(row).getAllByRole('cell')
      const firstCell = cells[0]
      if (!firstCell) continue
      // The completed state shows a div with bg-success/20 containing a Check icon
      const completedIndicator = firstCell.querySelector('.bg-success\\/20')
      if (completedIndicator) {
        count++
      }
    }
    return count
  }

  /**
   * Fills strength set inputs using the table-based UI and clicks the complete button.
   * Finds the active row (with enabled inputs) and fills it.
   * @param values - Object with weight, reps, rir values as strings
   */
  async fillCardSetAndComplete(values: { weight: string; reps: string; rir: string }): Promise<void> {
    const row = this.getActiveRow()

    const inputs = {
      weight: this.getInputFromRow(row, /weight for set/i),
      reps: this.getInputFromRow(row, /^reps for set/i),
      rir: this.getInputFromRow(row, /reps in reserve for set/i),
    }

    const completeButton = this.getCompleteButtonFromRow(row)

    await this.common.fillStrengthSetAndWaitForButton(inputs, values, completeButton)
    await this.ctx.user.click(completeButton)
  }
}
