import { screen, waitFor } from '@testing-library/vue'
import { expect } from 'vitest'
import type { TestContext } from '../types'
import type { CommonPO } from './CommonPO'

/**
 * Page Object for the create benchmark form.
 * Provides methods to fill form fields, add exercises, and submit.
 */
export class BenchmarkFormPO {
  constructor(
    private ctx: TestContext,
    private common: CommonPO,
  ) {}

  /**
   * Types a workout name into the name input field.
   * @param name - The workout name to enter
   */
  async fillName(name: string): Promise<void> {
    const nameInput = screen.getByLabelText(/workout name/i)
    await this.ctx.user.type(nameInput, name)
  }

  /**
   * Selects a benchmark type by clicking the corresponding card.
   * @param type - The benchmark type to select ('fortime' or 'rounds')
   */
  async selectType(type: 'fortime' | 'rounds'): Promise<void> {
    const text = type === 'fortime' ? /^for time$/i : /^rounds$/i
    const typeElement = screen.getAllByText(text)[0]
    if (!typeElement) {
      throw new Error(`Type element for "${type}" not found`)
    }
    const typeCard = typeElement.closest('button')
    if (!typeCard) {
      throw new Error(`Type card button for "${type}" not found`)
    }
    await this.ctx.user.click(typeCard)
  }

  /**
   * Sets the number of rounds for a rounds-type benchmark.
   * Only works when rounds type is selected and input is visible.
   * @param rounds - The number of rounds to set
   */
  async setRounds(rounds: number): Promise<void> {
    const roundsInput = screen.getByLabelText(/number of rounds/i)
    await this.ctx.user.clear(roundsInput)
    await this.ctx.user.type(roundsInput, String(rounds))
  }

  /**
   * Opens the exercise picker dialog by clicking the "Add Exercise" button.
   * Waits for the dialog to appear before returning.
   */
  async openExercisePicker(): Promise<void> {
    await this.ctx.user.click(screen.getByRole('button', { name: /add exercise/i }))
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
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /set prescribed reps/i })).toBeTruthy()
    })

    // Fill reps
    const repsInput = screen.getByRole('spinbutton')
    await this.ctx.user.clear(repsInput)
    await this.ctx.user.type(repsInput, String(reps))

    // Confirm
    await this.ctx.user.click(this.common.getDialogButton('Add'))

    // Wait for dialog to fully close
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /set prescribed reps/i })).toBeFalsy()
    })

    // Ensure body is clickable (no pointer-events: none from overlay)
    await waitFor(() => {
      const pointerEvents = window.getComputedStyle(document.body).pointerEvents
      expect(pointerEvents).not.toBe('none')
    })
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
    await this.ctx.user.click(deleteButton)
  }

  /**
   * Clicks the save button to create the benchmark.
   */
  async clickSave(): Promise<void> {
    const saveButton = screen.getByRole('button', { name: /save/i })
    await this.ctx.user.click(saveButton)
  }

  /**
   * Clicks the back button to return to the workouts page.
   */
  async clickBack(): Promise<void> {
    const backButton = screen.getByRole('button', { name: /back/i })
    await this.ctx.user.click(backButton)
  }

  /**
   * Returns the save button element.
   * Useful for checking disabled state or other attributes.
   * @returns The save button element
   */
  getSaveButton(): HTMLElement {
    return screen.getByRole('button', { name: /save/i })
  }

  /**
   * Returns the rounds input element if visible, null otherwise.
   * @returns The rounds input element or null
   */
  getRoundsInput(): HTMLElement | null {
    return screen.queryByLabelText(/number of rounds/i)
  }

  /**
   * Returns all exercise items currently in the list.
   * @returns Array of exercise item elements
   */
  getExerciseItems(): ReadonlyArray<HTMLElement> {
    // Exercise items are in a list - find all delete buttons (lucide-x SVGs within buttons)
    const deleteButtons = document.querySelectorAll('button svg.lucide-x')
    const items: Array<HTMLElement> = []
    deleteButtons.forEach((svg) => {
      const button = svg.closest('button')
      if (button instanceof HTMLElement) {
        items.push(button)
      }
    })
    return items
  }

  /**
   * Asserts that the save button is disabled.
   */
  assertSaveDisabled(): void {
    const saveButton = this.getSaveButton()
    expect(saveButton).toHaveAttribute('disabled')
  }

  /**
   * Asserts that the save button is enabled (not disabled).
   */
  assertSaveEnabled(): void {
    const saveButton = this.getSaveButton()
    expect(saveButton).not.toHaveAttribute('disabled')
  }
}
