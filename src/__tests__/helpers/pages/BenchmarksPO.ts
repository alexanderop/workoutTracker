import { screen, waitFor } from '@testing-library/vue'
import { expect } from 'vitest'
import type { TestContext } from '../types'
import type { CommonPO } from './CommonPO'

/**
 * Page Object for the benchmarks tab and list view.
 * Provides methods to navigate, view benchmarks, and access creation flow.
 */
export class BenchmarksPO {
  constructor(
    private ctx: TestContext,
    private common: CommonPO,
  ) {}

  /**
   * Navigates to the benchmarks tab from the workouts view.
   * Waits for the tab to load before returning.
   */
  async navigateToTab(): Promise<void> {
    // First navigate to workouts page if not already there
    await this.common.navigateToWorkouts()

    // Wait for tabs to load
    await waitFor(() => {
      expect(screen.queryByRole('tab', { name: /benchmarks/i })).toBeTruthy()
    })

    // Click on Benchmarks tab
    await this.ctx.user.click(screen.getByRole('tab', { name: /benchmarks/i }))
  }

  /**
   * Clicks a specific benchmark card by name to navigate to detail view.
   * @param benchmarkName - The name of the benchmark to click
   */
  async clickBenchmarkCard(benchmarkName: string): Promise<void> {
    const benchmarkText = screen.getByText(benchmarkName)
    await this.ctx.user.click(benchmarkText)
  }

  /**
   * Clicks the "Create Benchmark" button to navigate to the creation form.
   */
  async clickCreateBenchmark(): Promise<void> {
    const button = screen.getByRole('button', { name: /create benchmark/i })
    await this.ctx.user.click(button)
  }

  /**
   * Retrieves all benchmark cards currently displayed in the list.
   * @returns Array of benchmark card elements
   */
  getBenchmarkCards(): ReadonlyArray<HTMLElement> {
    // Benchmark cards are buttons containing benchmark names
    const allButtons = screen.queryAllByRole('button')
    return allButtons.filter((btn) => {
      const hasName = btn.querySelector('[class*="font-semibold"]')
      return hasName !== null
    })
  }

  /**
   * Asserts that the empty state is displayed.
   * Verifies both the empty message and Create Benchmark button exist.
   */
  assertEmptyState(): void {
    expect(screen.getByText(/no benchmarks yet/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /create benchmark/i })).toBeTruthy()
  }

  /**
   * Asserts that a benchmark with the given name exists in the list.
   * @param name - The benchmark name to search for
   */
  assertBenchmarkExists(name: string): void {
    expect(screen.getByText(name)).toBeTruthy()
  }
}
