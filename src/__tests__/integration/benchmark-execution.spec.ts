import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import {
  createForTimeBenchmark,
  createRoundsBenchmark,
  startBenchmarkWorkout,
  completeExercise,
} from './helpers/benchmarkHelpers'

describe('Benchmark Execution', () => {
  describe('Navigation', () => {
    it('starts workout from detail page', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      expect(app.router.currentRoute.value.path).toBe('/benchmark/active')
      await expect.element(page.getByRole('button', { name: /tap to advance/i })).toBeVisible()
      await expect.element(page.getByText('Thrusters')).toBeVisible()
    })

    it('advances to next exercise with tap-to-advance', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await expect.element(page.getByText('Thrusters')).toBeVisible()
      await completeExercise()
      await expect.element(page.getByText('Pull-ups')).toBeVisible()
    })

    it('focus mode has no back button (intentional design)', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
        ],
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await expect.element(page.getByRole('heading', { name: 'Exercise 1' })).toBeVisible()
      await completeExercise()
      await expect.element(page.getByRole('heading', { name: 'Exercise 2' })).toBeVisible()

      const backButtons = await page.getByRole('button', { name: /go back|^back$/i }).all()
      const footerBackButtons = await Promise.all(
        backButtons.map(async (button) => {
          const text = (await button.element()).textContent?.trim()
          return text === 'Go back' || text === 'Back' ? button : null
        }),
      ).then((results) => results.filter(Boolean))
      expect(footerBackButtons).toHaveLength(0)
    })

    it('advances from last exercise in round to next round', async ({ createTestApp }) => {
      const benchmark = await createRoundsBenchmark({
        name: 'Multi-Round',
        rounds: 3,
        exercises: [
          { name: 'Exercise 1', reps: 5 },
          { name: 'Exercise 2', reps: 5 },
        ],
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await expect
        .poll(async () => (await page.getByText(/exercise 1/i).all()).length)
        .toBeGreaterThan(0)

      await completeExercise()
      await expect
        .poll(async () => (await page.getByText(/exercise 2/i).all()).length)
        .toBeGreaterThan(0)

      await completeExercise()
      await expect.element(page.getByRole('heading', { name: 'Exercise 1' })).toBeVisible()
      await expect.element(page.getByText(/round 2\/3/i)).toBeVisible()
    })

    it('exercises appear in defined order', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Alpha Exercise', reps: 10 },
          { name: 'Beta Exercise', reps: 10 },
          { name: 'Gamma Exercise', reps: 10 },
        ],
      })

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      // First exercise should be Alpha
      await expect.element(page.getByRole('heading', { name: 'Alpha Exercise' })).toBeVisible()

      await completeExercise()

      // Second should be Beta (not Gamma, not Alpha again)
      await expect.element(page.getByRole('heading', { name: 'Beta Exercise' })).toBeVisible()

      await completeExercise()

      // Third should be Gamma
      await expect.element(page.getByRole('heading', { name: 'Gamma Exercise' })).toBeVisible()
    })
  })

  describe('Timer', () => {
    it('shows timer running during exercise transitions', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)

      const captured: { beforeTransition: string | undefined } = { beforeTransition: undefined }
      await expect
        .poll(
          async () => {
            const timerElements = await page.getByText(/\d+:\d{2}/).all()
            const timerText = timerElements[0]
              ? (await timerElements[0].element()).textContent
              : null
            if (timerText && !timerText.includes('0:00')) {
              captured.beforeTransition = timerText
              return true
            }
            return false
          },
          { timeout: 3000 },
        )
        .toBe(true)

      await completeExercise()

      await expect
        .poll(
          async () => {
            const timerElements = await page.getByText(/\d+:\d{2}/).all()
            const afterTransition = timerElements[0]
              ? (await timerElements[0].element()).textContent
              : null
            return (
              afterTransition &&
              !afterTransition.includes('0:00') &&
              afterTransition !== captured.beforeTransition
            )
          },
          { timeout: 3000 },
        )
        .toBe(true)
    })
  })

  describe('Exercise Queue', () => {
    it('displays exercise queue drawer with status updates', async ({ createTestApp }) => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
          { name: 'Exercise 3', reps: 10 },
        ],
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)

      // Open queue drawer
      await userEvent.click(page.getByRole('button', { name: /workout options/i }))
      await expect.element(page.getByRole('menuitem', { name: /view exercises/i })).toBeVisible()
      await userEvent.click(page.getByRole('menuitem', { name: /view exercises/i }))

      await expect.element(page.getByRole('heading', { name: /exercise queue/i })).toBeVisible()
      expect((await page.getByText(/exercise 1/i).all()).length).toBeGreaterThan(0)
      expect((await page.getByText(/active/i).all()).length).toBeGreaterThan(0)

      // Close and advance
      await userEvent.keyboard('{Escape}')
      await expect
        .element(page.getByRole('heading', { name: /exercise queue/i }))
        .not.toBeInTheDocument()

      await completeExercise()

      // Reopen and verify status
      await userEvent.click(page.getByRole('button', { name: /workout options/i }))
      await userEvent.click(page.getByRole('menuitem', { name: /view exercises/i }))
      expect((await page.getByText(/completed|active/i).all()).length).toBeGreaterThan(0)
    })
  })
})
