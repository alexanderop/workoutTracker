import { screen, waitFor } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import type { TestContext } from '../types'

/**
 * Base Page Object providing common UI interaction methods shared across all page objects.
 * Handles dialogs, routing, and exercise selection patterns used throughout integration tests.
 */
export class CommonPO {
  constructor(protected ctx: TestContext) {}

  /**
   * Waits for a dialog element to appear in the DOM.
   * @returns The dialog element once it becomes visible
   */
  async waitForDialog(): Promise<HTMLElement> {
    return await waitFor(() => screen.getByRole('dialog'))
  }

  /**
   * Waits for a dialog to fully close, including overlay and animations.
   * In browser mode, dialogs use CSS animations that can block pointer events.
   * This method waits for both the dialog element AND overlay to be removed.
   */
  async waitForDialogClose(): Promise<void> {
    await waitFor(() => {
      // Check that dialog role element is gone
      const dialog = screen.queryByRole('dialog')
      if (dialog) {
        throw new Error('Dialog still open')
      }
      // Check that dialog overlay is gone (fixed overlay with z-50)
      const overlay = document.querySelector('[data-slot="dialog-overlay"]')
      if (overlay) {
        throw new Error('Dialog overlay still present')
      }
    })
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
    const dialog = screen.getByRole('dialog')
    const buttons = dialog.querySelectorAll('button')
    const btn = Array.from(buttons).find((b) => b.textContent?.includes(text))

    if (!btn) {
      throw new Error(`Dialog button with text "${text}" not found`)
    }
    return btn
  }

  /**
   * Asserts that no dialog is currently open.
   * @throws Error if a dialog element exists in the DOM
   */
  assertDialogClosed(): void {
    const dialog = screen.queryByRole('dialog')
    if (dialog) {
      throw new Error('Expected dialog to be closed but it is still open')
    }
  }

  /**
   * Searches for and selects an exercise from the exercise picker dialog.
   * Types the exercise name into the search input and clicks the matching result.
   * @param exerciseName - The name of the exercise to search for and select
   */
  async selectExercise(exerciseName: string): Promise<void> {
    const searchInput = screen.getByRole('textbox')
    await this.ctx.user.type(searchInput, exerciseName)
    await waitFor(() => {
      this.getDialogButton(exerciseName)
    })
    await this.ctx.user.click(this.getDialogButton(exerciseName))
  }

  /**
   * Waits for the router to navigate to a path matching the given pattern.
   * @param pathPattern - Regular expression to match against the current route path
   * @throws Error if the route does not match within the waitFor timeout
   */
  async waitForRoute(pathPattern: RegExp): Promise<void> {
    await waitFor(() => {
      const currentPath = this.ctx.router.currentRoute.value.path
      if (!pathPattern.test(currentPath)) {
        throw new Error(`Expected route to match ${pathPattern}, got ${currentPath}`)
      }
    })
  }

  /**
   * Navigates to the exercises page by clicking the exercises nav button.
   * Waits for the route to update before returning.
   */
  async navigateToExercises(): Promise<void> {
    const exercisesNavButton = screen.getByRole('button', { name: /exercises/i })
    await this.ctx.user.click(exercisesNavButton)
    await this.waitForRoute(/^\/exercises$/)
  }

  /**
   * Navigates to the settings page by clicking the settings nav button.
   * Waits for the route to update before returning.
   */
  async navigateToSettings(): Promise<void> {
    const settingsNavButton = screen.getByRole('button', { name: /settings/i })
    await this.ctx.user.click(settingsNavButton)
    await this.waitForRoute(/^\/settings$/)
  }

  /**
   * Navigates to the workouts page by clicking the workouts nav button.
   * Waits for the route to update before returning.
   */
  async navigateToWorkouts(): Promise<void> {
    const workoutsNavButton = screen.getByRole('button', { name: /workouts/i })
    await this.ctx.user.click(workoutsNavButton)
    await this.waitForRoute(/^\/workouts$/)
  }

  /**
   * Detects if we're running in jsdom vs a real browser.
   * jsdom includes 'jsdom' in the userAgent string.
   */
  isJsdomMode(): boolean {
    return navigator.userAgent.toLowerCase().includes('jsdom')
  }

  /**
   * Sets the value of an input element directly and dispatches events.
   * Use in browser mode where user.type() doesn't work reliably with NumberField.
   * @param input - The input element (from getByRole or similar query)
   * @param value - The value to set
   */
  private setInputValueDirectly(input: Element, value: string): void {
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Expected HTMLInputElement')
    }
    input.focus()
    // Use native setter to trigger React/Vue internals properly
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set
    const setterFn = nativeInputValueSetter ?? ((v: string) => { input.value = v })
    setterFn.call(input, value)
    // Dispatch input and change events to trigger Vue reactivity
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.blur()
  }

  /**
   * Fills strength set inputs (weight, reps, rir) and waits for button to be enabled.
   * Handles both jsdom and browser mode differences:
   * - jsdom: uses user.type() and skips button enable wait (jsdom doesn't enforce CSS disabled)
   * - browser: uses direct DOM manipulation and waits for button to enable
   * @param inputs - Object with weightInput, repsInput, rirInput elements
   * @param values - Object with weight, reps, rir values as strings
   * @param completeButton - The Complete Set button element to wait for
   */
  async fillStrengthSetAndWaitForButton(
    inputs: { weight: Element; reps: Element; rir: Element },
    values: { weight: string; reps: string; rir: string },
    completeButton: Element,
  ): Promise<void> {
    if (this.isJsdomMode()) {
      // jsdom mode: use user.type() - it triggers Vue reactivity properly
      await this.ctx.user.type(inputs.weight, values.weight)
      await this.ctx.user.type(inputs.reps, values.reps)
      await this.ctx.user.type(inputs.rir, values.rir)
      // Skip button wait - jsdom doesn't enforce CSS disabled state
      return
    }

    // Browser mode: direct DOM manipulation + wait for button
    this.setInputValueDirectly(inputs.weight, values.weight)
    this.setInputValueDirectly(inputs.reps, values.reps)
    this.setInputValueDirectly(inputs.rir, values.rir)
    await flushPromises()
    await waitFor(() => {
      if (completeButton.hasAttribute('disabled')) {
        throw new Error('Button still disabled')
      }
    })
  }
}
