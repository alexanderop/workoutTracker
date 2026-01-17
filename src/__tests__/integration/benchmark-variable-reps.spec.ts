/**
 * Integration tests for Variable Reps Benchmark feature.
 *
 * These tests verify the ability to create pyramid/ladder-style workouts
 * where each round can have different rep counts (e.g., 40-30-20-10).
 *
 * Tests are written TDD-first and will fail until the feature is implemented.
 * See specs/variable-reps-benchmark.md for full requirements.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '../helpers/locator'
import { expectElement, expectPoll } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { RouteNames } from '@/router'
import {
  createForTimeBenchmarkWithRounds,
  startBenchmarkWorkout,
  completeExercise,
  createCompletedAttempt,
  getBenchmarksRepository,
} from './helpers/benchmarkHelpers'
import type { DbBenchmarkRound } from '../factories'

/**
 * Type for benchmark with new rounds-based schema.
 * This is the expected structure after the feature is implemented.
 */
type BenchmarkWithRounds = {
  id: string
  name: string
  type: 'fortime' | 'amrap' | 'emom'
  rounds: ReadonlyArray<DbBenchmarkRound>
  structureHash: string
  createdAt: number
  lastUsedAt: number | null
}

/**
 * Helper to check if a value is a record object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Helper to check if a round has the expected structure.
 */
function isValidRound(round: unknown): boolean {
  if (!isRecord(round)) return false
  if (typeof round.orderKey !== 'string') return false
  if (!Array.isArray(round.exercises)) return false
  return true
}

/**
 * Type guard to check if a benchmark has the new rounds-based schema.
 * Returns true if the benchmark has a rounds array (not a number).
 */
function isBenchmarkWithRounds(benchmark: unknown): benchmark is BenchmarkWithRounds {
  if (!isRecord(benchmark)) return false
  if (typeof benchmark.id !== 'string') return false
  if (typeof benchmark.name !== 'string') return false
  if (!Array.isArray(benchmark.rounds)) return false
  return benchmark.rounds.every(isValidRound)
}

/**
 * Asserts that a benchmark has the new rounds-based schema.
 * Throws if the benchmark doesn't have the expected structure.
 */
function assertBenchmarkWithRounds(benchmark: unknown): asserts benchmark is BenchmarkWithRounds {
  if (!isBenchmarkWithRounds(benchmark)) {
    throw new Error(
      'Benchmark does not have rounds-based schema. ' +
      'Expected rounds array, got: ' + JSON.stringify(benchmark),
    )
  }
}

describe('Variable Reps Benchmark', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  // ===========================================================================
  // Test Suite: Benchmark Creation
  // ===========================================================================
  describe('Benchmark Creation', () => {
    it('creates ForTime benchmark with variable reps across 4 rounds', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      // Fill benchmark name (type selector removed - all benchmarks are ForTime)
      await app.benchmarkForm.fillName('Pyramid 40-30-20-10')

      // Round 1: Add exercises with 40 and 30 reps
      await app.benchmarkForm.addExerciseWithReps('Burpees', 40)
      await app.benchmarkForm.addExerciseWithReps('Bodyweight Squat', 30)

      // Verify initial round count
      expect(await app.benchmarkForm.getRoundCount()).toBe(1)

      // Copy Round 1 → Round 2, edit to 30 and 20 reps
      await app.benchmarkForm.copyRound(0)
      expect(await app.benchmarkForm.getRoundCount()).toBe(2)
      await app.benchmarkForm.navigateToRound(1)
      await app.benchmarkForm.editExerciseReps(0, 30)
      await app.benchmarkForm.editExerciseReps(1, 20)

      // Copy Round 2 → Round 3, edit to 20 and 15 reps
      await app.benchmarkForm.copyRound(1)
      expect(await app.benchmarkForm.getRoundCount()).toBe(3)
      await app.benchmarkForm.navigateToRound(2)
      await app.benchmarkForm.editExerciseReps(0, 20)
      await app.benchmarkForm.editExerciseReps(1, 15)

      // Copy Round 3 → Round 4, edit to 10 and 10 reps
      await app.benchmarkForm.copyRound(2)
      expect(await app.benchmarkForm.getRoundCount()).toBe(4)
      await app.benchmarkForm.navigateToRound(3)
      await app.benchmarkForm.editExerciseReps(0, 10)
      await app.benchmarkForm.editExerciseReps(1, 10)

      // Save and verify
      await app.benchmarkForm.clickSave()
      await expectPoll(() => app.router.currentRoute.value.name).toBe('BenchmarkDetail')

      // Verify saved benchmark structure (find by name since popular benchmarks are seeded)
      const benchmarks = await getBenchmarksRepository().getAll()
      const benchmark = benchmarks.find((b) => b.name === 'Pyramid 40-30-20-10')
      expect(benchmark).toBeDefined()
      assertBenchmarkWithRounds(benchmark)
      // With new schema, rounds will be an array
      expect(benchmark.rounds).toHaveLength(4)

      app.cleanup()
    })
  })

  // ===========================================================================
  // Test Suite: Copy Round
  // ===========================================================================
  describe('Copy Round', () => {
    it('copied round has identical exercises and reps', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      // Create benchmark with Round 1 containing Burpees (40 reps)
      await app.benchmarkForm.fillName('Test Copy Round')
      await app.benchmarkForm.addExerciseWithReps('Burpees', 40)

      // Copy Round 1
      await app.benchmarkForm.copyRound(0)

      // Verify Round 2 appears with same exercise and reps
      expect(await app.benchmarkForm.getRoundCount()).toBe(2)
      await app.benchmarkForm.navigateToRound(1)

      // Round 2 should show Burpees with 40 reps (same as Round 1)
      await expectElement(page.getByText('Burpees')).toBeVisible()
      await expectElement(page.getByText('40')).toBeVisible()

      app.cleanup()
    })

    it('copied round is independent from source', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      // Create benchmark with Round 1 containing Burpees (40 reps)
      await app.benchmarkForm.fillName('Test Independence')
      await app.benchmarkForm.addExerciseWithReps('Burpees', 40)

      // Copy Round 1 to create Round 2
      await app.benchmarkForm.copyRound(0)

      // Edit Round 2's Burpees to 30 reps
      await app.benchmarkForm.navigateToRound(1)
      await app.benchmarkForm.editExerciseReps(0, 30)

      // Save benchmark
      await app.benchmarkForm.clickSave()
      await expectPoll(() => app.router.currentRoute.value.name).toBe('BenchmarkDetail')

      // Verify Round 1 still has 40 reps, Round 2 has 30 reps
      const benchmarks = await getBenchmarksRepository().getAll()
      const benchmark = benchmarks[0]
      assertBenchmarkWithRounds(benchmark)

      const round1 = benchmark.rounds[0]
      const round2 = benchmark.rounds[1]

      expect(round1?.exercises[0]?.prescribedReps).toBe(40)
      expect(round2?.exercises[0]?.prescribedReps).toBe(30)

      app.cleanup()
    })

    it('copied round preserves exerciseDefinitionId', async () => {
      // Create benchmark with exercise linked to a definition
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Test Definition Preservation',
        rounds: [
          {
            exercises: [
              { name: 'Burpees', reps: 40, exerciseDefinitionId: 'burpees-123' },
            ],
          },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickEdit()

      // Copy Round 1
      await app.benchmarkForm.copyRound(0)
      await app.benchmarkForm.clickSave()

      // Verify Round 2's exercise has the same exerciseDefinitionId
      const updated = await getBenchmarksRepository().getById(benchmark.id)
      assertBenchmarkWithRounds(updated)
      const round2Exercise = updated.rounds[1]?.exercises[0]

      expect(round2Exercise?.exerciseDefinitionId).toBe('burpees-123')

      app.cleanup()
    })
  })

  // ===========================================================================
  // Test Suite: Round Management
  // ===========================================================================
  describe('Round Management', () => {
    it.skip('reorders rounds via drag-and-drop', async () => {
      // Create benchmark with 3 rounds (40, 30, 20 reps)
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Test Reorder',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
          { exercises: [{ name: 'Burpees', reps: 30 }] },
          { exercises: [{ name: 'Burpees', reps: 20 }] },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickEdit()

      // Drag Round 3 to position 1 using keyboard (more reliable than mouse)
      // Click on Round 3 drag handle to focus, then use keyboard to move
      const round3Handle = page.getByTestId('round-drag-handle-2')
      await userEvent.click(await round3Handle.element())
      // Press space to pick up, arrow up twice to move to top, space to drop
      await userEvent.keyboard(' ')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard(' ')

      await app.benchmarkForm.clickSave()

      // Verify new order: 20, 40, 30 reps
      const updated = await getBenchmarksRepository().getById(benchmark.id)
      assertBenchmarkWithRounds(updated)
      expect(updated.rounds[0]?.exercises[0]?.prescribedReps).toBe(20)
      expect(updated.rounds[1]?.exercises[0]?.prescribedReps).toBe(40)
      expect(updated.rounds[2]?.exercises[0]?.prescribedReps).toBe(30)

      app.cleanup()
    })

    it('deletes middle round', async () => {
      // Create benchmark with 3 rounds
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Test Delete Middle',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
          { exercises: [{ name: 'Burpees', reps: 30 }] },
          { exercises: [{ name: 'Burpees', reps: 20 }] },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickEdit()

      // Delete Round 2
      await app.benchmarkForm.deleteRound(1)
      expect(await app.benchmarkForm.getRoundCount()).toBe(2)

      await app.benchmarkForm.clickSave()

      // Verify remaining rounds are unchanged
      const updated = await getBenchmarksRepository().getById(benchmark.id)
      assertBenchmarkWithRounds(updated)
      expect(updated.rounds).toHaveLength(2)
      expect(updated.rounds[0]?.exercises[0]?.prescribedReps).toBe(40)
      expect(updated.rounds[1]?.exercises[0]?.prescribedReps).toBe(20)

      app.cleanup()
    })

    it('cannot delete last remaining round', async () => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      // Create benchmark with 1 round
      await app.benchmarkForm.fillName('Test Cannot Delete Last')
      await app.benchmarkForm.addExerciseWithReps('Burpees', 40)

      // Verify Delete Round is disabled
      await app.benchmarkForm.assertDeleteRoundDisabled(0)

      app.cleanup()
    })
  })

  // ===========================================================================
  // Test Suite: Per-Round Exercise Management
  // ===========================================================================
  describe('Per-Round Exercise Management', () => {
    it('adds exercise to current round only', async () => {
      // Create benchmark with 2 rounds, each with Burpees
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Test Add Exercise',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
          { exercises: [{ name: 'Burpees', reps: 30 }] },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickEdit()

      // Navigate to Round 2 and add Pull-ups
      await app.benchmarkForm.navigateToRound(1)
      await app.benchmarkForm.addExerciseWithReps('Pull-ups', 20)

      await app.benchmarkForm.clickSave()

      // Verify Round 1 has only Burpees, Round 2 has Burpees and Pull-ups
      const updated = await getBenchmarksRepository().getById(benchmark.id)
      assertBenchmarkWithRounds(updated)
      expect(updated.rounds[0]?.exercises).toHaveLength(1)
      expect(updated.rounds[0]?.exercises[0]?.name).toBe('Burpees')
      expect(updated.rounds[1]?.exercises).toHaveLength(2)
      expect(updated.rounds[1]?.exercises[1]?.name).toBe('Pull-ups')

      app.cleanup()
    })

    it('deletes exercise from current round only', async () => {
      // Create benchmark with 2 rounds, each with Burpees and Squats
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Test Delete Exercise',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }, { name: 'Squats', reps: 30 }] },
          { exercises: [{ name: 'Burpees', reps: 30 }, { name: 'Squats', reps: 20 }] },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickEdit()

      // Navigate to Round 1 and delete Squats (index 1)
      await app.benchmarkForm.navigateToRound(0)
      await app.benchmarkForm.removeExercise(1)

      await app.benchmarkForm.clickSave()

      // Verify Round 1 has only Burpees, Round 2 still has both
      const updated = await getBenchmarksRepository().getById(benchmark.id)
      assertBenchmarkWithRounds(updated)
      expect(updated.rounds[0]?.exercises).toHaveLength(1)
      expect(updated.rounds[0]?.exercises[0]?.name).toBe('Burpees')
      expect(updated.rounds[1]?.exercises).toHaveLength(2)

      app.cleanup()
    })

    it.skip('reorders exercises within a round', async () => {
      // Create benchmark with Round 1 containing Burpees, Squats, Pull-ups
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Test Reorder Exercises',
        rounds: [
          {
            exercises: [
              { name: 'Burpees', reps: 40 },
              { name: 'Squats', reps: 30 },
              { name: 'Pull-ups', reps: 20 },
            ],
          },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickEdit()

      // Drag Pull-ups to position 1 using keyboard
      const exercise3Handle = page.getByTestId('exercise-drag-handle-2')
      await userEvent.click(await exercise3Handle.element())
      await userEvent.keyboard(' ')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard('{ArrowUp}')
      await userEvent.keyboard(' ')

      await app.benchmarkForm.clickSave()

      // Verify new order: Pull-ups, Burpees, Squats
      const updated = await getBenchmarksRepository().getById(benchmark.id)
      assertBenchmarkWithRounds(updated)
      expect(updated.rounds[0]?.exercises[0]?.name).toBe('Pull-ups')
      expect(updated.rounds[0]?.exercises[1]?.name).toBe('Burpees')
      expect(updated.rounds[0]?.exercises[2]?.name).toBe('Squats')

      app.cleanup()
    })
  })

  // ===========================================================================
  // Test Suite: Validation
  // ===========================================================================
  describe('Validation', () => {
    it('cannot save benchmark with empty round', async () => {
      // Create benchmark with 2 rounds
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Test Empty Round',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
          { exercises: [{ name: 'Squats', reps: 30 }] },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickEdit()

      // Navigate to Round 2 and delete all exercises
      await app.benchmarkForm.navigateToRound(1)
      await app.benchmarkForm.removeExercise(0)

      // Save button should be disabled when a round has no exercises
      await app.benchmarkForm.assertSaveDisabled()

      // Verify benchmark is not saved with empty round
      const current = await getBenchmarksRepository().getById(benchmark.id)
      assertBenchmarkWithRounds(current)
      expect(current.rounds[1]?.exercises).toHaveLength(1) // Original still has exercise

      app.cleanup()
    })
  })

  // ===========================================================================
  // Test Suite: Summary View
  // ===========================================================================
  describe('Summary View', () => {
    it('summary shows per-round grouping via tabbed navigation', async () => {
      // Create benchmark with distinct exercises per round to avoid ambiguous selectors
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Pyramid',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }, { name: 'Squats', reps: 35 }] },
          { exercises: [{ name: 'Lunges', reps: 25 }, { name: 'Pull-ups', reps: 20 }] },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Pyramid')

      // Round 1 is shown by default (tab 1 is active)
      await expectElement(page.getByText(/round 1\/2/i)).toBeVisible()
      await expectElement(page.getByText(/burpees/i)).toBeVisible()
      await expectElement(page.getByText(/40/)).toBeVisible()
      await expectElement(page.getByText(/squats/i)).toBeVisible()
      await expectElement(page.getByText(/35/)).toBeVisible()

      // Navigate to Round 2 via tab
      await app.benchmarkDetail.navigateToRound(2)
      await expectElement(page.getByText(/round 2\/2/i)).toBeVisible()
      await expectElement(page.getByText(/lunges/i)).toBeVisible()
      await expectElement(page.getByText(/25/)).toBeVisible()
      await expectElement(page.getByText(/pull-ups/i)).toBeVisible()
      await expectElement(page.getByText(/20/)).toBeVisible()

      app.cleanup()
    })
  })

  // ===========================================================================
  // Test Suite: Workout Execution
  // ===========================================================================
  describe('Workout Execution', () => {
    it('starts workout with correct reps per round', async () => {
      // Create pyramid benchmark with 4 rounds - use different exercise names
      // so the completeExercise helper can detect when we've moved to the next round
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Pyramid',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
          { exercises: [{ name: 'Squats', reps: 30 }] },
          { exercises: [{ name: 'Lunges', reps: 20 }] },
          { exercises: [{ name: 'Push-ups', reps: 10 }] },
        ],
      })

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      // Block 1 should show Burpees with 40 prescribed reps
      await expectElement(page.getByText(/burpees/i)).toBeVisible()
      await expectElement(page.getByText('40')).toBeVisible()

      // Advance to Block 2
      await completeExercise()
      await expectElement(page.getByText(/squats/i)).toBeVisible()
      await expectElement(page.getByText('30')).toBeVisible()

      // Advance to Block 3
      await completeExercise()
      await expectElement(page.getByText(/lunges/i)).toBeVisible()
      await expectElement(page.getByText('20')).toBeVisible()

      // Advance to Block 4
      await completeExercise()
      await expectElement(page.getByText(/push-ups/i)).toBeVisible()
      await expectElement(page.getByText('10')).toBeVisible()

      app.cleanup()
    })
  })

  // ===========================================================================
  // Test Suite: Result Comparison
  // ===========================================================================
  describe('Result Comparison', () => {
    it.skip('shows warning when structure changes on benchmark with results', async () => {
      // Create benchmark and complete a workout
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Test Warning',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
        ],
      })
      await createCompletedAttempt(benchmark.id, 120)

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickEdit()

      // Change reps from 40 to 30 (must use preset value)
      await app.benchmarkForm.editExerciseReps(0, 30)
      await app.benchmarkForm.clickSave()

      // Warning dialog should appear
      await expectElement(page.getByRole('dialog')).toBeVisible()
      await expectElement(
        page.getByText(/changing.*structure.*break comparison.*previous results/i),
      ).toBeVisible()

      // Cancel and verify not saved
      await userEvent.click(page.getByRole('button', { name: /cancel/i }))
      const current = await getBenchmarksRepository().getById(benchmark.id)
      assertBenchmarkWithRounds(current)
      expect(current.rounds[0]?.exercises[0]?.prescribedReps).toBe(40)

      app.cleanup()
    })

    it('no warning when structure unchanged', async () => {
      // Create benchmark with completed workout
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Original Name',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
        ],
      })
      await createCompletedAttempt(benchmark.id, 120)

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickEdit()

      // Only change the name (not structure)
      await app.benchmarkDetail.editBenchmarkName('Updated Name')
      await app.benchmarkDetail.clickSave()

      // No warning dialog should appear
      await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()
      await expectElement(page.getByText('Updated Name')).toBeVisible()

      app.cleanup()
    })

    it('no warning when benchmark has no results', async () => {
      // Create benchmark without any completed workouts
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Test No Warning',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
        ],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickEdit()

      // Change reps (must use preset value)
      await app.benchmarkForm.editExerciseReps(0, 30)
      await app.benchmarkForm.clickSave()

      // No warning dialog should appear
      await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()
      await expectPoll(() => app.router.currentRoute.value.name).toBe('BenchmarkDetail')

      // Verify saved
      const updated = await getBenchmarksRepository().getById(benchmark.id)
      assertBenchmarkWithRounds(updated)
      expect(updated.rounds[0]?.exercises[0]?.prescribedReps).toBe(30)

      app.cleanup()
    })
  })

  // ===========================================================================
  // Test Suite: Import/Export
  // ===========================================================================
  describe('Import/Export', () => {
    it.skip('exports and reimports benchmark with rounds', async () => {
      // Create benchmark with 3 rounds and variable reps
      const benchmark = await createForTimeBenchmarkWithRounds({
        name: 'Export Test',
        rounds: [
          { exercises: [{ name: 'Burpees', reps: 40 }] },
          { exercises: [{ name: 'Burpees', reps: 30 }] },
          { exercises: [{ name: 'Burpees', reps: 20 }] },
        ],
      })

      const app = await createTestApp()

      // Navigate to settings and export
      await app.common.navigateToSettings()
      await page.getByRole('button', { name: /export data/i }).click()

      // Wait for export dialog/download
      await expectElement(page.getByText(/export complete|data exported/i)).toBeVisible()

      // Delete the original benchmark
      await getBenchmarksRepository().delete(benchmark.id)
      expect(await getBenchmarksRepository().getById(benchmark.id)).toBeFalsy()

      // Import via the import button flow
      await page.getByRole('button', { name: /import data/i }).click()

      // The import should restore the benchmark
      // (actual flow depends on implementation - file input or paste)
      await expectElement(page.getByRole('dialog')).toBeVisible()

      // After import, verify the benchmark exists with correct structure
      const imported = await getBenchmarksRepository().getAll()
      const importedBenchmark = imported.find(b => b.name === 'Export Test')
      assertBenchmarkWithRounds(importedBenchmark)

      expect(importedBenchmark.rounds).toHaveLength(3)
      expect(importedBenchmark.rounds[0]?.exercises[0]?.prescribedReps).toBe(40)
      expect(importedBenchmark.rounds[1]?.exercises[0]?.prescribedReps).toBe(30)
      expect(importedBenchmark.rounds[2]?.exercises[0]?.prescribedReps).toBe(20)

      app.cleanup()
    })

    it.skip('import legacy format fails with error', async () => {
      const app = await createTestApp()

      // Navigate to settings
      await app.common.navigateToSettings()

      // Trigger import flow
      await page.getByRole('button', { name: /import data/i }).click()
      await expectElement(page.getByRole('dialog')).toBeVisible()

      // The legacy format JSON would be provided via file input or paste
      // When legacy format is detected, error should be shown
      // (exact flow depends on implementation)

      // After attempting to import legacy format:
      await expectElement(
        page.getByText(/benchmark format is no longer supported/i),
      ).toBeVisible()

      // Verify no legacy benchmark was imported
      const benchmarks = await getBenchmarksRepository().getAll()
      expect(benchmarks.find(b => b.id === 'legacy-123')).toBeFalsy()

      app.cleanup()
    })
  })
})
