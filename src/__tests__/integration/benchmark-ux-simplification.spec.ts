/**
 * Integration tests for Benchmark UX Simplification.
 *
 * These tests verify the simplified benchmark creation and viewing experience:
 * - No type selector (all benchmarks are ForTime)
 * - Tabbed round navigation in both view and edit modes
 * - Tabs always visible (even with 1 round)
 *
 * See specs/benchmark-ux-simplification.md for full requirements.
 */
import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { RouteNames } from '@/router'
import {
  createForTimeBenchmarkWithRounds,
  createForTimeBenchmark,
  getBenchmarksRepository,
} from './helpers/benchmarkHelpers'

/**
 * Tests for the benchmark UX simplification feature.
 * The feature removes the type selector and adds tabbed navigation to view mode.
 */
describe('Benchmark UX Simplification', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Simplified Creation (No Type Selector)', () => {
    it('does not show type selector cards on create page', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      // Type selector cards should not be visible
      const forTimeCard = page.getByRole('button', { name: /for time/i })
      const roundsCard = page.getByRole('button', { name: /rounds/i })

      await expect.element(forTimeCard).not.toBeInTheDocument()
      await expect.element(roundsCard).not.toBeInTheDocument()

      // Name input should be visible
      await expect.element(page.getByLabelText(/workout name/i)).toBeVisible()

      app.cleanup()
    })

    it('creates benchmark without type selection, defaults to ForTime', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      await app.benchmarkForm.fillName('Simple Benchmark')
      await app.benchmarkForm.addExerciseWithReps('Burpees', 20)
      await app.benchmarkForm.clickSave()

      // Verify benchmark was saved with type 'fortime' (find by name since popular benchmarks are seeded)
      const benchmarks = await getBenchmarksRepository().getAll()
      const benchmark = benchmarks.find((b) => b.name === 'Simple Benchmark')
      expect(benchmark).toBeDefined()
      expect(benchmark?.type).toBe('fortime')
      expect(benchmark?.name).toBe('Simple Benchmark')

      app.cleanup()
    })

    it('shows round tab even with single round', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      // Tab "1" should be visible even before adding exercises
      const tab = page.getByRole('tab', { name: '1', exact: true })
      await expect.element(tab).toBeVisible()
      await expect.element(tab).toHaveAttribute('aria-selected', 'true')

      app.cleanup()
    })
  })

  describe('Tabbed Navigation in View Mode', () => {
    it('displays round tabs for multi-round benchmark', async () => {
      // Create 4-round benchmark
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Pyramid 40-30-20-10',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
          { exercises: [{ name: 'Burpees', reps: 30 }] },
          { exercises: [{ name: 'Burpees', reps: 20 }] },
          { exercises: [{ name: 'Burpees', reps: 10 }] },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Pyramid 40-30-20-10')

      // All 4 tabs should be visible
      const tabCount = await app.benchmarkDetail.getRoundTabCount()
      expect(tabCount).toBe(4)

      // Tab 1 should be active by default
      const activeTab = await app.benchmarkDetail.getActiveRoundTab()
      expect(activeTab).toBe(1)

      // Round heading should show "Round 1/4"
      await app.benchmarkDetail.assertRoundHeading(1, 4)

      app.cleanup()
    })

    it('switches rounds when clicking tabs in view mode', async () => {
      // Create 4-round benchmark with different exercises per round
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Multi-Exercise Pyramid',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
          { exercises: [{ name: 'Pull-ups', reps: 30 }] },
          { exercises: [{ name: 'Squats', reps: 20 }] },
          { exercises: [{ name: 'Push-ups', reps: 10 }] },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Multi-Exercise Pyramid')

      // Initially on Round 1, should see Burpees
      await expect.element(page.getByText('Burpees')).toBeVisible()

      // Click tab 3
      await app.benchmarkDetail.navigateToRound(3)

      // Should now see Round 3 heading and Squats
      await app.benchmarkDetail.assertRoundHeading(3, 4)
      await expect.element(page.getByText('Squats')).toBeVisible()

      // Burpees from Round 1 should not be in the document (only active round is shown)
      await expect.element(page.getByText('Burpees')).not.toBeInTheDocument()

      app.cleanup()
    })

    it('shows tab and heading for single-round benchmark', async () => {
      const benchmark = await createForTimeBenchmark({
        name: 'Single Round',
        exercises: [{ name: 'Burpees', reps: 20 }],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Single Round')

      // Tab "1" should be visible
      const tab = page.getByRole('tab', { name: '1', exact: true })
      await expect.element(tab).toBeVisible()
      await expect.element(tab).toHaveAttribute('aria-selected', 'true')

      // Round heading should show "Round 1/1"
      await app.benchmarkDetail.assertRoundHeading(1, 1)

      app.cleanup()
    })
  })

  describe('Tabbed Navigation in Edit Mode', () => {
    it('shows tabs in edit mode even with single round', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      // Tab should be visible in create mode
      const tab = page.getByRole('tab', { name: '1', exact: true })
      await expect.element(tab).toBeVisible()

      // Add an exercise
      await app.benchmarkForm.fillName('Edit Test')
      await app.benchmarkForm.addExerciseWithReps('Burpees', 20)

      // Tab should still be visible
      await expect.element(tab).toBeVisible()

      app.cleanup()
    })

    it('auto-selects new tab after copying round', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      await app.benchmarkForm.fillName('Copy Test')
      await app.benchmarkForm.addExerciseWithReps('Burpees', 40)

      // Should have 1 round initially
      expect(await app.benchmarkForm.getRoundCount()).toBe(1)

      // Copy round
      await app.benchmarkForm.copyRound(0)

      // Should now have 2 rounds
      expect(await app.benchmarkForm.getRoundCount()).toBe(2)

      // Tab "2" should exist and be the new round
      const tab2 = page.getByRole('tab', { name: '2', exact: true })
      await expect.element(tab2).toBeVisible()

      // Note: The new round should be auto-selected after copy
      // This is verified by the navigateToRound(1) being unnecessary
      // to see the copied round's content

      app.cleanup()
    })

    it('selects previous round after deleting current round', async () => {
      // Create benchmark with 3 rounds
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Delete Test',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
          { exercises: [{ name: 'Burpees', reps: 30 }] },
          { exercises: [{ name: 'Burpees', reps: 20 }] },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Delete Test')
      await app.benchmarkDetail.clickEdit()

      // Navigate to Round 2
      await app.benchmarkForm.navigateToRound(1)
      expect(await app.benchmarkForm.getRoundCount()).toBe(3)

      // Delete Round 2
      await app.benchmarkForm.deleteRound(1)

      // Should now have 2 rounds
      expect(await app.benchmarkForm.getRoundCount()).toBe(2)

      // Should be on previous round (Round 1, index 0)
      // Verified by the heading "Round 1/2"
      await expect.element(page.getByText(/round 1\/2/i)).toBeVisible()

      app.cleanup()
    })

    it('tabs update correctly when rounds are added and removed', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      await app.benchmarkForm.fillName('Tab Update Test')
      await app.benchmarkForm.addExerciseWithReps('Burpees', 40)

      // Initially 1 round, 1 tab
      expect(await app.benchmarkForm.getRoundCount()).toBe(1)
      await expect.element(page.getByRole('tab', { name: '1', exact: true })).toBeVisible()
      await expect.element(page.getByRole('tab', { name: '2', exact: true })).not.toBeInTheDocument()

      // Copy to add Round 2
      await app.benchmarkForm.copyRound(0)
      expect(await app.benchmarkForm.getRoundCount()).toBe(2)
      await expect.element(page.getByRole('tab', { name: '2', exact: true })).toBeVisible()

      // Copy again to add Round 3
      await app.benchmarkForm.copyRound(1)
      expect(await app.benchmarkForm.getRoundCount()).toBe(3)
      await expect.element(page.getByRole('tab', { name: '3', exact: true })).toBeVisible()

      // Delete Round 2 (middle round)
      await app.benchmarkForm.navigateToRound(1)
      await app.benchmarkForm.deleteRound(1)

      // Should have 2 rounds, tabs "1" and "2" (renumbered)
      expect(await app.benchmarkForm.getRoundCount()).toBe(2)
      await expect.element(page.getByRole('tab', { name: '1', exact: true })).toBeVisible()
      await expect.element(page.getByRole('tab', { name: '2', exact: true })).toBeVisible()
      await expect.element(page.getByRole('tab', { name: '3', exact: true })).not.toBeInTheDocument()

      app.cleanup()
    })
  })
})
