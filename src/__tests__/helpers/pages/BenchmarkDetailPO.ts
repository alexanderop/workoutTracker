import { screen } from '@testing-library/vue'
import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import type { TestContext } from '../types'
import type { CommonPO } from './CommonPO'

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
    const nameElement = screen.queryByRole('heading', { level: 1 })
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
  getBenchmarkType(): string {
    // Look for type text near "Workout Structure"
    const typeElements = screen.queryAllByText(/for time|rounds/i)
    const firstElement = typeElements[0]
    if (!firstElement) {
      throw new Error('Benchmark type not found')
    }
    // Return the first occurrence (should be in the workout structure section)
    return firstElement.textContent ?? ''
  }

  /**
   * Returns all exercise cards displayed in the benchmark detail.
   * @returns Array of exercise card elements
   */
  getExerciseCards(): ReadonlyArray<HTMLElement> {
    // Exercise cards contain exercise names and rep counts
    const exercises: Array<HTMLElement> = []
    const allText = screen.queryAllByText(/\d+/)
    allText.forEach((el) => {
      const card = el.closest('[class*="card"]') ?? el.closest('div')
      if (card instanceof HTMLElement && !exercises.includes(card)) {
        exercises.push(card)
      }
    })
    return exercises
  }

  /**
   * Asserts that an exercise with a specific name and reps is displayed.
   * @param exerciseName - The name of the exercise to verify
   * @param reps - The number of prescribed reps
   */
  assertExerciseExists(exerciseName: string, reps: number): void {
    expect(screen.getByText(exerciseName)).toBeTruthy()
    const repsElements = screen.getAllByText(String(reps))
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
  getStartButton(): HTMLElement {
    return screen.getByRole('button', { name: /start workout/i })
  }

  /**
   * Asserts that the start workout button is enabled (not disabled).
   */
  assertStartButtonEnabled(): void {
    const startButton = this.getStartButton()
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
  assertNotFoundState(): void {
    expect(screen.getByText('Benchmark not found')).toBeTruthy()
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
  assertEditMode(): void {
    expect(screen.queryByRole('button', { name: /save changes|save/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /cancel/i })).toBeTruthy()
  }

  /**
   * Asserts that the view is in view mode (not editing).
   * Checks for presence of edit button and absence of save/cancel.
   */
  assertViewMode(): void {
    expect(screen.queryByRole('button', { name: /edit/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /save changes|save/i })).toBeFalsy()
    expect(screen.queryByRole('button', { name: /cancel/i })).toBeFalsy()
  }

  /**
   * Asserts that the save button is disabled.
   */
  assertSaveDisabled(): void {
    const saveButton = screen.getByRole('button', { name: /save changes|save/i })
    expect(saveButton.hasAttribute('disabled')).toBe(true)
  }

  /**
   * Asserts that the save button is enabled.
   */
  assertSaveEnabled(): void {
    const saveButton = screen.getByRole('button', { name: /save changes|save/i })
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
  assertDeleteDialogOpen(): void {
    expect(screen.getByText(/delete benchmark\?/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy()
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
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i })
    const dialogDeleteButton = deleteButtons[deleteButtons.length - 1]
    if (!dialogDeleteButton) {
      throw new Error('Delete button not found in dialog')
    }

    await userEvent.click(dialogDeleteButton)

    await expect.poll(() => this.ctx.router.currentRoute.value.path).toBe('/workouts')
  }

  /**
   * Asserts that delete button is visible in view mode.
   */
  assertDeleteButtonVisible(): void {
    expect(screen.getByRole('button', { name: /delete benchmark/i })).toBeTruthy()
  }

  /**
   * Clicks the back button in the PageLayout header.
   */
  async clickBackButton(): Promise<void> {
    const backButton = screen.getByRole('button', { name: /go back/i })
    await userEvent.click(backButton)
  }
}
