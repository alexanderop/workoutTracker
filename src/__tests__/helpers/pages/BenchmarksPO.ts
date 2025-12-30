import { page } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'
import { ensureHTMLElement } from '../domHelpers'

/**
 * Page Object for the benchmarks tab and list view.
 * Provides methods to navigate, view benchmarks, and access creation flow.
 */
export class BenchmarksPO {
  constructor(private common: CommonPO) {}

  /**
   * Navigates to the benchmarks tab from the workouts view.
   * Waits for the tab to load before returning.
   */
  async navigateToTab(): Promise<void> {
    // First navigate to workouts page if not already there
    await this.common.navigateToWorkouts()

    // Wait for tabs to load
    const benchmarksTab = page.getByRole('tab', { name: /benchmarks/i })
    await expect.element(benchmarksTab).toBeVisible()

    // Click on Benchmarks tab
    await benchmarksTab.click()
  }

  /**
   * Clicks a specific benchmark card by name to navigate to detail view.
   * @param benchmarkName - The name of the benchmark to click
   */
  async clickBenchmarkCard(benchmarkName: string): Promise<void> {
    await page.getByText(benchmarkName).click()
  }

  /**
   * Clicks the "Create Benchmark" button to navigate to the creation form.
   */
  async clickCreateBenchmark(): Promise<void> {
    await page.getByRole('button', { name: /create benchmark/i }).click()
  }

  /**
   * Retrieves all benchmark cards currently displayed in the list.
   * @returns Array of benchmark card elements
   */
  async getBenchmarkCards(): Promise<ReadonlyArray<HTMLElement>> {
    // Benchmark cards are buttons containing benchmark names
    const allButtons = await page.getByRole('button').all()
    const cards: Array<HTMLElement> = []
    for (const locator of allButtons) {
      const button = ensureHTMLElement(await locator.element())
      // eslint-disable-next-line no-restricted-syntax -- Finding element by CSS class, no accessible equivalent
      const hasName = button.querySelector('[class*="font-semibold"]')
      if (hasName !== null) {
        cards.push(button)
      }
    }
    return cards
  }

  /**
   * Asserts that the empty state is displayed.
   * Verifies both the empty message and Create Benchmark button exist.
   */
  async assertEmptyState(): Promise<void> {
    await expect.element(page.getByText(/no benchmarks yet/i)).toBeInTheDocument()
    await expect.element(page.getByRole('button', { name: /create benchmark/i })).toBeInTheDocument()
  }

  /**
   * Asserts that a benchmark with the given name exists in the list.
   * @param name - The benchmark name to search for
   */
  async assertBenchmarkExists(name: string): Promise<void> {
    await expect.element(page.getByText(name)).toBeInTheDocument()
  }
}
