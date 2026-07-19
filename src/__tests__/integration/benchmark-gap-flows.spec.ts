import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getActiveBenchmarkWorkoutRepository } from '@/db'
import type { DbBenchmarkRound } from '@/db/schema'
import { resetBenchmarkWorkout } from '@/features/benchmarks/state/benchmarkState'
import { useBenchmarkGlobalTimer } from '@/composables/timers/useBenchmarkGlobalTimer'
import {
  createForTimeBenchmark,
  createRoundsBenchmark,
  startBenchmarkWorkout,
  completeExercise,
  waitForCompletionScreen,
  getBenchmarksRepository,
  getWorkoutsRepository,
} from './helpers/benchmarkHelpers'

/**
 * Sorts benchmark rounds by orderKey, mirroring how the app displays them.
 */
function sortRounds(rounds: ReadonlyArray<DbBenchmarkRound>): ReadonlyArray<DbBenchmarkRound> {
  return [...rounds].toSorted((a, b) => a.orderKey.localeCompare(b.orderKey))
}

/**
 * User journeys around benchmarks that are not covered by the other
 * benchmark specs: draft discarding, form corrections during creation,
 * exercise editing, abandoning/finishing a run early, resuming after an
 * app restart, and the multi-round exercise queue.
 */
describe('Benchmark Gap Flows', () => {
  describe('Draft Discard', () => {
    it('discards an unsaved multi-round draft and returns to a clean form', async ({
      createTestApp,
    }) => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      // User sketches out a benchmark idea...
      await app.benchmarkForm.fillName('Abandoned Idea')
      await app.benchmarkForm.addExerciseWithReps('Burpees', 10)
      await app.benchmarkForm.copyRound(0)
      expect(await app.benchmarkForm.getRoundCount()).toBe(2)

      // ...changes their mind and discards the auto-saved draft
      await expect.element(page.getByRole('button', { name: /discard/i })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /discard/i }))

      // The form resets to a single empty round with no name
      await expect
        .poll(async () => {
          const element = await page.getByLabelText(/workout name/i).element()
          return element instanceof HTMLInputElement ? element.value : null
        })
        .toBe('')
      expect(await app.benchmarkForm.getRoundCount()).toBe(1)
      await expect.element(page.getByTestId('benchmark-exercise-item')).not.toBeInTheDocument()
      await app.benchmarkForm.assertSaveDisabled()
    })
  })

  describe('Creation with Corrections', () => {
    it('creates a descending ladder benchmark, undoing an extra round and a mistaken exercise', async ({
      createTestApp,
    }) => {
      const app = await createTestApp()
      await app.navigateTo({ name: RouteNames.CreateBenchmark })

      // Build a 15-10-5 Burpee ladder
      await app.benchmarkForm.fillName('Burpee Ladder')
      await app.benchmarkForm.addExerciseWithReps('Burpees', 15)

      await app.benchmarkForm.copyRound(0)
      await app.benchmarkForm.navigateToRound(1)
      await app.benchmarkForm.editExerciseReps(0, 10)

      await app.benchmarkForm.copyRound(1)
      await app.benchmarkForm.navigateToRound(2)
      await app.benchmarkForm.editExerciseReps(0, 5)

      // User over-copies a 4th round, then deletes it again
      await app.benchmarkForm.copyRound(2)
      expect(await app.benchmarkForm.getRoundCount()).toBe(4)
      await app.benchmarkForm.deleteRound(3)
      expect(await app.benchmarkForm.getRoundCount()).toBe(3)

      // User adds a squat to the last round by mistake and removes it
      await app.benchmarkForm.navigateToRound(2)
      await app.benchmarkForm.addExerciseWithReps('Bodyweight Squat', 10)
      await app.benchmarkForm.removeExercise(1)

      // Save and land on the detail page
      await app.benchmarkForm.clickSave()
      await expect.poll(() => app.router.currentRoute.value.name).toBe('BenchmarkDetail')

      // The stored benchmark matches what the user built
      const benchmarks = await getBenchmarksRepository().getAll()
      expect(benchmarks).toHaveLength(1)
      const rounds = sortRounds(benchmarks[0]?.rounds ?? [])
      expect(rounds).toHaveLength(3)
      const repsPerRound = rounds.map((round) =>
        round.exercises.map((exercise) => exercise.prescribedReps),
      )
      expect(repsPerRound).toEqual([[15], [10], [5]])
      expect(rounds.every((round) => round.exercises.every((ex) => ex.name === 'Burpees'))).toBe(
        true,
      )
    })
  })

  describe('Exercise Editing', () => {
    it('swaps an exercise while editing an existing benchmark', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        name: 'Pull-up Test',
        exercises: [{ name: 'Pull-ups', reps: 5 }],
      })

      const app = await createTestApp()
      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.waitForLoad('Pull-up Test')
      await app.benchmarkDetail.clickEdit()

      // Add the replacement exercise, then remove the original
      await app.benchmarkForm.addExerciseWithReps('Bodyweight Squat', 15)
      await app.benchmarkForm.removeExercise(0)

      await app.benchmarkDetail.clickSave()

      // Back in view mode the swapped exercise is shown
      await app.benchmarkDetail.assertViewMode()
      await expect.element(page.getByText('Bodyweight Squat')).toBeVisible()

      // Database reflects the swap
      const updated = await getBenchmarksRepository().getById(benchmark.id)
      const exercises = updated?.rounds[0]?.exercises ?? []
      expect(exercises).toHaveLength(1)
      expect(exercises[0]?.name).toBe('Bodyweight Squat')
      expect(exercises[0]?.prescribedReps).toBe(15)
    })
  })

  describe('Abandoning a Run', () => {
    it('cancels a benchmark mid-workout without saving anything', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({ name: 'Fran' })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeExercise()

      // Open the workout options menu and cancel
      await userEvent.click(page.getByRole('button', { name: /workout options/i }))
      await expect.element(page.getByRole('menuitem', { name: /cancel workout/i })).toBeVisible()
      await userEvent.click(page.getByRole('menuitem', { name: /cancel workout/i }))

      // Confirm deletion in the dialog
      await expect.element(page.getByText(/cancel workout\?/i)).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /delete workout/i }))

      // User lands back on the workouts page
      await expect.poll(() => app.router.currentRoute.value.path).toBe('/workouts')

      // Nothing was saved: no history entry, no lingering active benchmark
      const history = await getWorkoutsRepository().getHistory()
      expect(history).toHaveLength(0)
      const active = await getActiveBenchmarkWorkoutRepository().load()
      expect(active).toBeFalsy()
    })
  })

  describe('Finishing Early', () => {
    it('ends a benchmark early and saves the partial attempt under a custom name', async ({
      createTestApp,
    }) => {
      const benchmark = await createForTimeBenchmark({
        name: 'Fran',
        exercises: [
          { name: 'Thrusters', reps: 21 },
          { name: 'Pull-ups', reps: 21 },
          { name: 'Squats', reps: 21 },
        ],
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeExercise()

      // End the workout early from the options menu
      await userEvent.click(page.getByRole('button', { name: /workout options/i }))
      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await userEvent.click(page.getByRole('menuitem', { name: /end workout/i }))

      // Finish dialog appears; user names the attempt
      await expect.element(page.getByText(/finish workout\?/i)).toBeVisible()
      await userEvent.fill(page.getByRole('textbox', { name: /workout name/i }), 'Morning Fran')
      await userEvent.click(page.getByRole('button', { name: /finish workout/i }))

      // User lands on the workout summary
      await expect.poll(() => app.router.currentRoute.value.name).toBe('WorkoutSummary')

      // The attempt is stored with the custom name and linked to the benchmark
      const history = await getWorkoutsRepository().getHistory()
      expect(history).toHaveLength(1)
      expect(history[0]?.name).toBe('Morning Fran')
      expect(history[0]?.benchmarkId).toBe(benchmark.id)

      // The active benchmark was cleaned up
      const active = await getActiveBenchmarkWorkoutRepository().load()
      expect(active).toBeFalsy()
    })
  })

  describe('Resuming After Restart', () => {
    it('restores an interrupted benchmark from the database after an app restart', async ({
      createTestApp,
    }) => {
      const benchmark = await createForTimeBenchmark({
        name: 'Fran',
        exercises: [
          { name: 'Thrusters', reps: 21 },
          { name: 'Pull-ups', reps: 21 },
        ],
      })

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)
      await completeExercise()

      // The benchmark run was persisted when it started
      const saved = await getActiveBenchmarkWorkoutRepository().load()
      expect(saved?.benchmarkId).toBe(benchmark.id)

      // Simulate an app restart: unmount and clear all in-memory state
      resetBenchmarkWorkout()
      useBenchmarkGlobalTimer().reset()

      // Fresh app boots; user returns to the active benchmark route
      const restartedApp = await createTestApp()
      await restartedApp.navigateTo('/benchmark/active')

      // The run is restored. Mid-run progress is not auto-saved for
      // benchmarks, so the athlete restarts from the first exercise.
      await expect.element(page.getByRole('button', { name: /tap to advance/i })).toBeVisible()
      await expect
        .poll(async () => {
          const heading = await page.getByRole('heading', { level: 2 }).query()
          return heading ? heading.textContent : null
        })
        .toMatch(/thrusters/i)

      // The restored session is fully functional: finish the whole benchmark
      await completeExercise()
      await completeExercise()
      await waitForCompletionScreen()
    })
  })

  describe('Multi-Round Exercise Queue', () => {
    it('groups the exercise queue by round with per-exercise status', async ({ createTestApp }) => {
      const benchmark = await createRoundsBenchmark({
        name: 'Half Cindy',
        rounds: 2,
        exercises: [
          { name: 'Pull-ups', reps: 5 },
          { name: 'Push-ups', reps: 10 },
        ],
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await completeExercise()

      // Open the exercise queue from the options menu
      await userEvent.click(page.getByRole('button', { name: /workout options/i }))
      await expect.element(page.getByRole('menuitem', { name: /view exercises/i })).toBeVisible()
      await userEvent.click(page.getByRole('menuitem', { name: /view exercises/i }))
      await expect.element(page.getByRole('heading', { name: /exercise queue/i })).toBeVisible()

      // Exercises are grouped under round headers
      await expect
        .element(page.getByRole('heading', { name: 'Round 1', exact: true }))
        .toBeVisible()
      await expect
        .element(page.getByRole('heading', { name: 'Round 2', exact: true }))
        .toBeVisible()

      // Statuses reflect the athlete's position: first done, second active, rest upcoming
      await expect
        .element(page.getByLabelText('Round 1, Exercise 1, Pull-ups, 5 reps, Completed'))
        .toBeVisible()
      await expect
        .element(page.getByLabelText('Round 1, Exercise 2, Push-ups, 10 reps, Active'))
        .toBeVisible()
      await expect
        .element(page.getByLabelText('Round 2, Exercise 1, Pull-ups, 5 reps, Upcoming'))
        .toBeVisible()
      await expect
        .element(page.getByLabelText('Round 2, Exercise 2, Push-ups, 10 reps, Upcoming'))
        .toBeVisible()
    })
  })
})
