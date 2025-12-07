import { screen, waitFor } from '@testing-library/vue'
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
    await waitFor(() => {
      expect(this.ctx.router.currentRoute.value.path).toBe(`/benchmarks/${benchmarkId}`)
    })
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
    const startButton = await waitFor(() =>
      screen.getByRole('button', { name: /start workout/i }),
    )
    await this.ctx.user.click(startButton)

    // Wait for navigation to active workout
    await waitFor(() => {
      expect(this.ctx.router.currentRoute.value.path).toBe('/workout/active')
    })
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
      await waitFor(() => {
        expect(screen.getByText(expectedName)).toBeTruthy()
      })
      return
    }

    // Just wait for "Workout Structure" to appear (indicates page loaded)
    await waitFor(() => {
      expect(screen.getByText('Workout Structure')).toBeTruthy()
    })
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
    const goBackButton = screen.getByRole('button', { name: 'Go Back' })
    await this.ctx.user.click(goBackButton)

    // Wait for navigation back to workouts
    await waitFor(() => {
      expect(this.ctx.router.currentRoute.value.path).toBe('/workouts')
    })
  }
}
