import { page, userEvent } from 'vitest/browser'
import { flushPromises } from '@vue/test-utils'
import { expect } from 'vitest'
import type { TestContext } from '../types'

/**
 * Base Page Object providing common UI interaction methods shared across all page objects.
 * Handles dialogs, routing, and exercise selection patterns used throughout integration tests.
 */
export class CommonPO {
  constructor(protected context: TestContext) {}

  /**
   * Waits for a dialog element to appear in the DOM.
   */
  async waitForDialog(): Promise<void> {
    await expect.element(page.getByRole('dialog')).toBeVisible()
  }

  /**
   * Waits for a dialog to fully close, including overlay and animations.
   * In browser mode, dialogs use CSS animations that can block pointer events.
   * This method waits for both the dialog element AND overlay to be removed.
   */
  async waitForDialogClose(): Promise<void> {
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
    // eslint-disable-next-line no-restricted-syntax -- Checking overlay data attribute, no accessible equivalent
    await expect.poll(() => document.querySelector('[data-slot="dialog-overlay"]')).toBeNull()
    // Flush any pending Vue updates after dialog unmount
    await flushPromises()
  }

  /**
   * Finds a button inside the currently open dialog by its text content.
   * @param text - The text to search for within button content
   * @returns The matching button element
   * @throws Error if no button with the specified text exists in the dialog
   */
  getDialogButton(text: string): HTMLElement {
    const dialog = page.getByRole('dialog').query()
    if (!dialog) {
      throw new Error('No dialog found')
    }
    // eslint-disable-next-line no-restricted-syntax -- Scoped search within dialog element
    const buttons = dialog.querySelectorAll('button')
    const button = [...buttons].find((b) => b.textContent?.includes(text))

    if (!button) {
      throw new Error(`Dialog button with text "${text}" not found`)
    }
    return button
  }

  /**
   * Checks whether a dialog is currently open.
   * @returns true if a dialog element exists in the DOM
   */
  isDialogOpen(): boolean {
    return page.getByRole('dialog').query() !== null
  }

  /**
   * Searches for and selects an exercise from the exercise picker dialog.
   * Types the exercise name into the search input and clicks the matching result.
   * @param exerciseName - The name of the exercise to search for and select
   */
  async selectExercise(exerciseName: string): Promise<void> {
    const searchInput = page.getByRole('textbox')
    await userEvent.fill(searchInput, exerciseName)
    await expect.poll(() => this.getExactDialogButton(exerciseName)).toBeTruthy()
    await userEvent.click(this.getExactDialogButton(exerciseName))
  }

  /**
   * Finds a button inside the currently open dialog by exact text match.
   * Uses a more precise matching strategy than getDialogButton to avoid partial matches.
   * For exercise selection, handles two presentation modes:
   * - Dialog mode: <button><span>icon</span><div><p>name</p>...</div></button>
   * - Overlay mode: <button><span>icon</span><span class="font-medium">name</span></button>
   * @param text - The exact text to match
   * @returns The matching button element
   * @throws Error if no button with the exact text exists in the dialog
   */
  private getExactDialogButton(text: string): HTMLElement {
    const dialog = page.getByRole('dialog').query()
    // eslint-disable-next-line no-restricted-syntax -- Finding overlay by CSS classes, no accessible equivalent
    const overlay = document.querySelector('[class*="absolute"][class*="inset-0"]')
    const container = dialog ?? overlay

    if (!container) {
      throw new Error('No dialog or overlay found')
    }

    // eslint-disable-next-line no-restricted-syntax -- Scoped search within container element
    const buttons = container.querySelectorAll('button')

    // First try: exact match of full button text (for simple buttons like "Add Block", "Confirm")
    let button = [...buttons].find((b) => b.textContent?.trim() === text)

    // Second try: find button containing a <p> tag with exact exercise name (dialog mode)
    if (!button) {
      button = [...buttons].find((b) => {
        // eslint-disable-next-line no-restricted-syntax -- DOM traversal within button element
        const paragraphs = b.querySelectorAll('p')
        return [...paragraphs].some((p) => p.textContent?.trim() === text)
      })
    }

    // Third try: find button containing a <span> with class "font-medium" (overlay mode)
    if (!button) {
      button = [...buttons].find((b) => {
        // eslint-disable-next-line no-restricted-syntax -- Finding spans by CSS class within button
        const spans = b.querySelectorAll('span.font-medium')
        return [...spans].some((span) => span.textContent?.trim() === text)
      })
    }

    if (!button) {
      throw new Error(`Dialog button with exact text "${text}" not found`)
    }
    return button
  }

  /**
   * Waits for the router to navigate to a path matching the given pattern.
   * @param pathPattern - Regular expression to match against the current route path
   */
  async waitForRoute(pathPattern: RegExp): Promise<void> {
    await expect.poll(() => this.context.router.currentRoute.value.path).toMatch(pathPattern)
  }

  /**
   * Navigates to the exercises page by clicking the exercises nav button.
   * Waits for the route to update before returning.
   */
  async navigateToExercises(): Promise<void> {
    await page.getByRole('button', { name: /^exercises$/i }).click()
    await this.waitForRoute(/^\/exercises$/)
  }

  /**
   * Navigates to the settings page by clicking the settings nav button.
   * Waits for the route to update before returning.
   */
  async navigateToSettings(): Promise<void> {
    await page.getByRole('button', { name: /settings/i }).click()
    await this.waitForRoute(/^\/settings$/)
  }

  /**
   * Navigates to the workouts page by clicking the workouts nav button.
   * Waits for the route to update before returning.
   */
  async navigateToWorkouts(): Promise<void> {
    await page.getByRole('button', { name: /workouts/i }).click()
    await this.waitForRoute(/^\/workouts$/)
  }

  /**
   * Navigates to the workouts page and clicks a specific tab.
   * @param tabName - Tab name to click (e.g., 'templates', 'history')
   */
  async navigateToWorkoutsAndClickTab(tabName: string): Promise<void> {
    await this.navigateToWorkouts()
    const tabLocator = page.getByRole('tab', { name: new RegExp(tabName, 'i') })
    await expect.element(tabLocator).toBeVisible()
    await userEvent.click(tabLocator)
  }

  /**
   * Sets the value of an input element directly and dispatches events.
   * Works around NumberField input quirks in browser mode.
   * @param input - The input element (from getByRole or similar query)
   * @param value - The value to set
   */
  private setInputValueDirectly(input: Element, value: string): void {
    if (!(input instanceof HTMLInputElement)) {
      throw new TypeError('Expected HTMLInputElement')
    }
    input.focus()
    // Use native setter to trigger React/Vue internals properly
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      globalThis.HTMLInputElement.prototype,
      'value',
    )?.set
    const setterFunction = nativeInputValueSetter ?? ((v: string) => { input.value = v })
    setterFunction.call(input, value)
    // Dispatch input and change events to trigger Vue reactivity
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.blur()
  }

  /**
   * Fills strength set inputs (weight, reps, rir) and waits for button to be enabled.
   * Uses direct DOM manipulation to work around NumberField input quirks.
   * @param inputs - Object with weight, reps, rir input elements
   * @param values - Object with weight, reps, rir values as strings
   * @param completeButton - The Complete Set button element to wait for
   */
  async fillStrengthSetAndWaitForButton(
    inputs: { weight: Element; reps: Element; rir: Element },
    values: { weight: string; reps: string; rir: string },
    completeButton: Element,
  ): Promise<void> {
    this.setInputValueDirectly(inputs.weight, values.weight)
    this.setInputValueDirectly(inputs.reps, values.reps)
    this.setInputValueDirectly(inputs.rir, values.rir)
    await flushPromises()
    await expect.poll(() => !completeButton.hasAttribute('disabled')).toBe(true)
  }
}
