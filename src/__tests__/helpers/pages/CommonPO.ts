import { screen, waitFor } from '@testing-library/vue'
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
}
