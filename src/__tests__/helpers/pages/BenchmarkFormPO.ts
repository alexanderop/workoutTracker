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

  /**
   * Selects a benchmark type by clicking the corresponding card.
   * @param type - The benchmark type to select ('fortime' or 'rounds')
   */
  async selectType(type: 'fortime' | 'rounds'): Promise<void> {
    const text = type === 'fortime' ? /^for time$/i : /^rounds$/i
    const typeElements = await page.getByText(text).all()
    const typeElement = typeElements[0]
    if (!typeElement) {
      throw new Error(`Type element for "${type}" not found`)
    }
    const element = await typeElement.element()
    const typeCard = element.closest('button')
    if (!typeCard) {
      throw new Error(`Type card button for "${type}" not found`)
    }
    await userEvent.click(typeCard)
  }

  /**
   * Sets the number of rounds for a rounds-type benchmark.
   * Only works when rounds type is selected and input is visible.
   * @param rounds - The number of rounds to set
   */
  async setRounds(rounds: number): Promise<void> {
    await page.getByLabelText(/number of rounds/i).fill(String(rounds))
  }

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

    // Fill reps
    const repsInput = page.getByRole('spinbutton')
    await repsInput.fill(String(reps))

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
}
