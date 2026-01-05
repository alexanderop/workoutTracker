import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'
import { ensureHTMLElement } from '../domHelpers'

/**
 * Page Object for the create benchmark form.
 * Provides methods to fill form fields, add exercises, and submit.
 */
export class BenchmarkFormPO {
  constructor(private common: CommonPO) {}

  /**
   * Types a workout name into the name input field.
   * @param name - The workout name to enter
   */
  async fillName(name: string): Promise<void> {
    await page.getByLabelText(/workout name/i).fill(name)
  }

  // NOTE: selectType() and setRounds() removed as part of UX simplification.
  // All benchmarks are now ForTime with variable rounds.
  // Use copyRound() to add additional rounds.

  /**
   * Opens the exercise picker dialog by clicking the "Add Exercise" button.
   * Waits for the dialog to appear before returning.
   */
  async openExercisePicker(): Promise<void> {
    await page.getByRole('button', { name: /add exercise/i }).click()
    await this.common.waitForDialog()
  }

  /**
   * Adds an exercise with prescribed reps through the full dialog flow.
   * Opens picker, selects exercise, sets reps in the second dialog, and confirms.
   * Waits for both dialogs to fully close before returning.
   * @param exerciseName - The name of the exercise to add
   * @param reps - The number of prescribed reps
   */
  async addExerciseWithReps(exerciseName: string, reps: number): Promise<void> {
    // Open exercise picker
    await this.openExercisePicker()

    // Select exercise (triggers reps dialog)
    await this.common.selectExercise(exerciseName)

    // Wait for reps dialog to appear
    await expect.element(page.getByRole('heading', { name: /set prescribed reps/i })).toBeVisible()

    // Set reps by clicking preset button (presets are: 5, 10, 15, 20, 25, 30, 40, 50)
    // The MobileNumberPicker uses preset buttons, not a spinbutton input
    const presetButton = page.getByRole('button', { name: String(reps), exact: true })
    await userEvent.click(presetButton)

    // Confirm
    await userEvent.click(this.common.getDialogButton('Add'))

    // Wait for dialog to fully close
    await expect.element(page.getByRole('heading', { name: /set prescribed reps/i })).not.toBeInTheDocument()

    // Ensure body is clickable (no pointer-events: none from overlay)
    await expect.poll(() => globalThis.getComputedStyle(document.body).pointerEvents).not.toBe('none')
  }

  /**
   * Removes an exercise from the list by index.
   * @param index - The zero-based index of the exercise to remove
   */
  async removeExercise(index: number): Promise<void> {
    const exerciseDeleteButtons = this.getExerciseItems()
    if (index >= exerciseDeleteButtons.length) {
      throw new Error(`Exercise index ${index} out of bounds (${exerciseDeleteButtons.length} exercises)`)
    }
    const deleteButton = exerciseDeleteButtons[index]
    if (!deleteButton) {
      throw new Error(`Delete button not found for exercise at index ${index}`)
    }
    await userEvent.click(deleteButton)
  }

  /**
   * Clicks the save button to create the benchmark.
   */
  async clickSave(): Promise<void> {
    await page.getByRole('button', { name: /save/i }).click()
  }

  /**
   * Clicks the back button to return to the workouts page.
   */
  async clickBack(): Promise<void> {
    await page.getByRole('button', { name: /back/i }).click()
  }

  /**
   * Returns the save button element.
   * Useful for checking disabled state or other attributes.
   * @returns The save button element
   */
  async getSaveButton(): Promise<HTMLElement> {
    return ensureHTMLElement(await page.getByRole('button', { name: /save/i }).element())
  }

  /**
   * Returns the rounds input element if visible, null otherwise.
   * @returns The rounds input element or null
   */
  getRoundsInput(): HTMLElement | null {
    const element = page.getByLabelText(/number of rounds/i).query()
    if (!element) return null
    if (!(element instanceof HTMLElement)) return null
    return element
  }

  /**
   * Returns all exercise items currently in the list.
   * @returns Array of exercise item elements
   */
  getExerciseItems(): ReadonlyArray<HTMLElement> {
    // Exercise items are in a list - find all delete buttons (lucide-x SVGs within buttons)
    // eslint-disable-next-line no-restricted-syntax -- Finding icon by CSS class, no accessible equivalent
    const deleteButtons = document.querySelectorAll('button svg.lucide-x')
    const items: Array<HTMLElement> = []
    for (const svg of deleteButtons) {
      const button = svg.closest('button')
      if (button instanceof HTMLElement) {
        items.push(button)
      }
    }
    return items
  }

  /**
   * Asserts that the save button is disabled.
   */
  async assertSaveDisabled(): Promise<void> {
    const saveButton = await this.getSaveButton()
    expect(saveButton).toHaveAttribute('disabled')
  }

  /**
   * Asserts that the save button is enabled (not disabled).
   */
  async assertSaveEnabled(): Promise<void> {
    const saveButton = await this.getSaveButton()
    expect(saveButton).not.toHaveAttribute('disabled')
  }

  // ===========================================================================
  // NEW: Round management methods for variable reps feature
  // These methods are stubs that throw until the UI is implemented
  // ===========================================================================

  /**
   * Opens the menu for a specific round (by index).
   * Navigates to the round first if needed, then opens its menu.
   * @param roundIndex - Zero-based index of the round
   */
  async openRoundMenu(roundIndex: number): Promise<void> {
    // Navigate to the round if there are multiple rounds
    const roundCount = await this.getRoundCount()
    if (roundCount > 1) {
      await this.navigateToRound(roundIndex)
    }

    // Find the menu button (there's only one visible at a time - for the current round)
    const menuButton = page.getByRole('button', { name: /options/i })
    await userEvent.click(menuButton)
    // Wait for dropdown menu to appear
    await expect.element(page.getByRole('menu')).toBeVisible()
  }

  /**
   * Copies a round by clicking "Copy Round" in the round menu.
   * The copied round appears at the end of the round list.
   * @param roundIndex - Zero-based index of the round to copy
   */
  async copyRound(roundIndex: number): Promise<void> {
    const initialCount = await this.getRoundCount()
    await this.openRoundMenu(roundIndex)
    // Get the Copy Round menu item and use native click
    const copyMenuItem = page.getByRole('menuitem', { name: /copy round/i })
    // Use the locator's click method (Playwright-style) instead of userEvent
    await copyMenuItem.click()
    await expect.element(page.getByRole('menu')).not.toBeInTheDocument()
    // Wait for the round count to increase
    await expect.poll(() => this.getRoundCount()).toBe(initialCount + 1)
  }

  /**
   * Deletes a round by clicking "Delete Round" in the round menu.
   * @param roundIndex - Zero-based index of the round to delete
   */
  async deleteRound(roundIndex: number): Promise<void> {
    await this.openRoundMenu(roundIndex)
    const deleteButton = await page.getByRole('menuitem', { name: /delete round/i }).element()
    await userEvent.click(deleteButton)
    await expect.element(page.getByRole('menu')).not.toBeInTheDocument()
  }

  /**
   * Returns the current number of rounds in the benchmark.
   * Parses the total from "Round N/M" heading text.
   */
  async getRoundCount(): Promise<number> {
    // Use the h2 heading specifically to avoid matching tab buttons
    const roundHeader = page.getByRole('heading', { name: /round \d+\/\d+/i })
    const element = await roundHeader.element()
    const text = element.textContent ?? ''
    const match = text.match(/round \d+\/(\d+)/i)
    if (!match || !match[1]) {
      throw new Error(`Could not parse round count from "${text}"`)
    }
    return Number.parseInt(match[1], 10)
  }

  /**
   * Navigates to a specific round by clicking its tab button.
   * @param roundIndex - Zero-based index of the round to navigate to
   */
  async navigateToRound(roundIndex: number): Promise<void> {
    // Round tabs are numbered "1", "2", etc.
    const tabName = String(roundIndex + 1)
    const tab = page.getByRole('tab', { name: tabName, exact: true })
    await userEvent.click(await tab.element())
  }

  /**
   * Edits the reps for an exercise in the current round.
   * Clicks the exercise to open the reps dialog, changes the value, and confirms.
   * @param exerciseIndex - Zero-based index of the exercise in the current round
   * @param newReps - The new rep count to set (must be one of the MobileNumberPicker presets: 5, 10, 15, 20, 25, 30, 40, 50)
   */
  async editExerciseReps(exerciseIndex: number, newReps: number): Promise<void> {
    // Find exercise items in the current round and click the one at the given index
    const exerciseItems = await page.getByTestId('benchmark-exercise-item').all()
    const exerciseItem = exerciseItems[exerciseIndex]
    if (!exerciseItem) {
      throw new Error(`Exercise at index ${exerciseIndex} not found`)
    }
    await userEvent.click(await exerciseItem.element())

    // Wait for reps dialog to appear
    await expect.element(page.getByRole('heading', { name: /set prescribed reps/i })).toBeVisible()

    // Set reps by clicking preset button (MobileNumberPicker uses presets: 5, 10, 15, 20, 25, 30, 40, 50)
    const presetButton = page.getByRole('button', { name: String(newReps), exact: true })
    await userEvent.click(presetButton)

    // Confirm
    await userEvent.click(this.common.getDialogButton('Save'))
    await expect.element(page.getByRole('heading', { name: /set prescribed reps/i })).not.toBeInTheDocument()
  }

  /**
   * Asserts that the "Delete Round" menu item is disabled.
   * Used to verify that the last round cannot be deleted.
   */
  async assertDeleteRoundDisabled(roundIndex: number = 0): Promise<void> {
    await this.openRoundMenu(roundIndex)
    const deleteButton = page.getByRole('menuitem', { name: /delete round/i })
    await expect.element(deleteButton).toHaveAttribute('aria-disabled', 'true')
    // Close menu
    await userEvent.keyboard('{Escape}')
  }

  /**
   * Asserts that a validation error message is visible.
   * @param message - The expected error message (partial match)
   */
  async assertValidationError(message: string | RegExp): Promise<void> {
    await expect.element(page.getByText(message)).toBeVisible()
  }
}
