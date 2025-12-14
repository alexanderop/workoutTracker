import { page } from 'vitest/browser'
import { expect } from 'vitest'
import type { TestContext } from '../types'
import type { CommonPO } from './CommonPO'
import { ensureHTMLElement } from '../domHelpers'

/**
 * Page Object for the benchmark detail view.
 * Provides methods to view benchmark details and start workouts.
 */
export class BenchmarkDetailPO {
  constructor(
    private ctx: TestContext,
    private common: CommonPO,
  ) {}

  /**
   * Navigates to a specific benchmark detail page by ID.
   * Waits for the route to update before returning.
   * @param benchmarkId - The ID of the benchmark to view
   */
  async navigateToDetail(benchmarkId: string): Promise<void> {
    await this.ctx.router.push(`/benchmarks/${benchmarkId}`)
    await expect.poll(() => this.ctx.router.currentRoute.value.path).toBe(`/benchmarks/${benchmarkId}`)
  }

  /**
   * Returns the benchmark name from the page.
   * @returns The benchmark name text
   */
  getBenchmarkName(): string {
    const nameElement = page.getByRole('heading', { level: 1 }).query()
    if (!nameElement) {
      throw new Error('Benchmark name heading not found')
    }
    return nameElement.textContent ?? ''
  }

  /**
   * Returns the formatted benchmark type text (e.g., "For Time", "5 Rounds").
   * Looks for the type in the "Workout Structure" section.
   * @returns The benchmark type text
   */
  async getBenchmarkType(): Promise<string> {
    // Look for type text near "Workout Structure"
    const typeElements = await page.getByText(/for time|rounds/i).all()
    const firstLocator = typeElements[0]
    if (!firstLocator) {
      throw new Error('Benchmark type not found')
    }
    const firstElement = ensureHTMLElement(await firstLocator.element())
    // Return the first occurrence (should be in the workout structure section)
    return firstElement.textContent ?? ''
  }

  /**
   * Returns all exercise cards displayed in the benchmark detail.
   * @returns Array of exercise card elements
   */
  async getExerciseCards(): Promise<ReadonlyArray<HTMLElement>> {
    // Exercise cards contain exercise names and rep counts
    const exercises: Array<HTMLElement> = []
    const allText = await page.getByText(/\d+/).all()
    for (const locator of allText) {
      const el = await locator.element()
      const card = el.closest('[class*="card"]') ?? el.closest('div')
      if (card instanceof HTMLElement && !exercises.includes(card)) {
        exercises.push(card)
      }
    }
    return exercises
  }

  /**
   * Asserts that an exercise with a specific name and reps is displayed.
   * @param exerciseName - The name of the exercise to verify
   * @param reps - The number of prescribed reps
   */
  async assertExerciseExists(exerciseName: string, reps: number): Promise<void> {
    await expect.element(page.getByText(exerciseName)).toBeInTheDocument()
    const repsElements = await page.getByText(String(reps)).all()
    expect(repsElements.length).toBeGreaterThan(0)
  }

  /**
   * Clicks the "Start Workout" button and waits for navigation to active workout.
   */
  async clickStartWorkout(): Promise<void> {
    const startButton = page.getByRole('button', { name: /start workout/i })
    await expect.element(startButton).toBeVisible()
    await startButton.click()

    // Wait for navigation to active benchmark
    await expect.poll(() => this.ctx.router.currentRoute.value.path).toBe('/benchmark/active')
  }

  /**
   * Returns the "Start Workout" button element.
   * @returns The start workout button element
   */
  async getStartButton(): Promise<HTMLElement> {
    return ensureHTMLElement(await page.getByRole('button', { name: /start workout/i }).element())
  }

  /**
   * Asserts that the start workout button is enabled (not disabled).
   */
  async assertStartButtonEnabled(): Promise<void> {
    const startButton = await this.getStartButton()
    expect(startButton.hasAttribute('disabled')).toBe(false)
  }

  /**
   * Waits for the benchmark data to finish loading.
   * Waits for a benchmark name to appear in the page.
   * @param expectedName - Optional expected benchmark name to wait for
   */
  async waitForLoad(expectedName?: string): Promise<void> {
    if (expectedName) {
      await expect.element(page.getByText(expectedName)).toBeVisible()
      return
    }

    // Just wait for "Workout Structure" to appear (indicates page loaded)
    await expect.element(page.getByText('Workout Structure')).toBeVisible()
  }

  /**
   * Asserts that the not-found error state is displayed.
   */
  async assertNotFoundState(): Promise<void> {
    await expect.element(page.getByText('Benchmark not found')).toBeInTheDocument()
  }

  /**
   * Clicks the "Go Back" button in the not-found state.
   */
  async clickGoBack(): Promise<void> {
    // Use exact text "Go Back" (capital B) which is on the not-found button, not the header "Go back"
    const goBackButton = page.getByRole('button', { name: 'Go Back', exact: true })
    await goBackButton.click()

    // Wait for navigation back to workouts
    await expect.poll(() => this.ctx.router.currentRoute.value.path).toBe('/workouts')
  }

  /**
   * Clicks the "Edit" button to enter edit mode.
   */
  async clickEdit(): Promise<void> {
    const editButton = page.getByRole('button', { name: /edit/i })
    await expect.element(editButton).toBeVisible()
    await editButton.click()
  }

  /**
   * Clicks the "Save" or "Save Changes" button in edit mode.
   */
  async clickSave(): Promise<void> {
    const saveButton = page.getByRole('button', { name: /save changes|save/i })
    await expect.element(saveButton).toBeVisible()
    await saveButton.click()
  }

  /**
   * Clicks the "Cancel" button to exit edit mode.
   */
  async clickCancel(): Promise<void> {
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    await expect.element(cancelButton).toBeVisible()
    await cancelButton.click()
  }

  /**
   * Edits the benchmark name input field.
   * @param newName - The new name to set
   */
  async editBenchmarkName(newName: string): Promise<void> {
    const nameInput = page.getByRole('textbox', { name: /workout name|name/i })
    await expect.element(nameInput).toBeVisible()
    await nameInput.fill(newName)
  }

  /**
   * Asserts that the view is in edit mode.
   * Checks for presence of save and cancel buttons.
   */
  async assertEditMode(): Promise<void> {
    await expect.element(page.getByRole('button', { name: /save changes|save/i })).toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  }

  /**
   * Asserts that the view is in view mode (not editing).
   * Checks for presence of edit button and absence of save/cancel.
   */
  async assertViewMode(): Promise<void> {
    await expect.element(page.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: /save changes|save/i })).not.toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  }

  /**
   * Asserts that the save button is disabled.
   */
  async assertSaveDisabled(): Promise<void> {
    const saveButton = await page.getByRole('button', { name: /save changes|save/i }).element()
    expect(saveButton.hasAttribute('disabled')).toBe(true)
  }

  /**
   * Asserts that the save button is enabled.
   */
  async assertSaveEnabled(): Promise<void> {
    const saveButton = await page.getByRole('button', { name: /save changes|save/i }).element()
    expect(saveButton.hasAttribute('disabled')).toBe(false)
  }

  /**
   * Clicks the "Delete Benchmark" button to open delete confirmation dialog.
   */
  async clickDelete(): Promise<void> {
    const deleteButton = page.getByRole('button', { name: /delete benchmark/i })
    await expect.element(deleteButton).toBeVisible()
    await deleteButton.click()
  }

  /**
   * Asserts that the delete confirmation dialog is displayed.
   */
  async assertDeleteDialogOpen(): Promise<void> {
    await expect.element(page.getByText(/delete benchmark\?/i)).toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  }

  /**
   * Clicks the "Cancel" button in the delete confirmation dialog.
   */
  async clickDeleteCancel(): Promise<void> {
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    await expect.element(cancelButton).toBeVisible()
    await cancelButton.click()
  }

  /**
   * Clicks the "Delete" button in the delete confirmation dialog.
   * Waits for navigation to /workouts after deletion.
   */
  async confirmDelete(): Promise<void> {
    const deleteButtons = await page.getByRole('button', { name: /^delete$/i }).all()
    const dialogDeleteButton = deleteButtons[deleteButtons.length - 1]
    if (!dialogDeleteButton) {
      throw new Error('Delete button not found in dialog')
    }

    await dialogDeleteButton.click()

    await expect.poll(() => this.ctx.router.currentRoute.value.path).toBe('/workouts')
  }

  /**
   * Asserts that delete button is visible in view mode.
   */
  async assertDeleteButtonVisible(): Promise<void> {
    await expect.element(page.getByRole('button', { name: /delete benchmark/i })).toBeInTheDocument()
  }

  /**
   * Clicks the back button in the PageLayout header.
   */
  async clickBackButton(): Promise<void> {
    await page.getByRole('button', { name: /go back/i }).click()
  }
}
