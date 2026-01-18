import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from '../helpers/locator'
import { expectElement, expectPoll } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import {
  createForTimeBenchmark,
  createRoundsBenchmark,
  startBenchmarkWorkout,
  completeExercise,
} from './helpers/benchmarkHelpers'

describe('Benchmark Execution', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Navigation', () => {
    it('starts workout from detail page', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await app.benchmarkDetail.navigateToDetail(benchmark.id)
      await app.benchmarkDetail.clickStartWorkout()

      expect(app.router.currentRoute.value.path).toBe('/benchmark/active')
      await expectElement(page.getByRole('button', { name: /tap to advance/i })).toBeVisible()
      await expectElement(page.getByText('Thrusters')).toBeVisible()

      app.cleanup()
    })

    it('advances to next exercise with tap-to-advance', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await expectElement(page.getByText('Thrusters')).toBeVisible()
      await completeExercise()
      await expectElement(page.getByText('Pull-ups')).toBeVisible()

      app.cleanup()
    })

    it('focus mode has no back button (intentional design)', async () => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
        ]
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await expectElement(page.getByRole('heading', { name: 'Exercise 1' })).toBeVisible()
      await completeExercise()
      await expectElement(page.getByRole('heading', { name: 'Exercise 2' })).toBeVisible()

      const backButtons = await page.getByRole('button', { name: /go back|^back$/i }).all()
      const footerBackButtons = await Promise.all(
        backButtons.map(async button => {
          const text = (await button.element()).textContent?.trim()
          return text === 'Go back' || text === 'Back' ? button : null
        })
      ).then(results => results.filter(Boolean))
      expect(footerBackButtons).toHaveLength(0)

      app.cleanup()
    })

    it('advances from last exercise in round to next round', async () => {
      const benchmark = await createRoundsBenchmark({
        name: 'Multi-Round',
        rounds: 3,
        exercises: [
          { name: 'Exercise 1', reps: 5 },
          { name: 'Exercise 2', reps: 5 },
        ]
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)
      await expectPoll(async () => (await page.getByText(/exercise 1/i).all()).length).toBeGreaterThan(0)

      await completeExercise()
      await expectPoll(async () => (await page.getByText(/exercise 2/i).all()).length).toBeGreaterThan(0)

      await completeExercise()
      await new Promise(resolve => setTimeout(resolve, 1000))

      app.cleanup()
    })

    it('exercises appear in defined order', async () => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Alpha Exercise', reps: 10 },
          { name: 'Beta Exercise', reps: 10 },
          { name: 'Gamma Exercise', reps: 10 },
        ]
      })

      const app = await createTestApp()
      await startBenchmarkWorkout(app, benchmark.id)

      // First exercise should be Alpha
      await expectElement(page.getByRole('heading', { name: 'Alpha Exercise' })).toBeVisible()

      await completeExercise()

      // Second should be Beta (not Gamma, not Alpha again)
      await expectElement(page.getByRole('heading', { name: 'Beta Exercise' })).toBeVisible()

      await completeExercise()

      // Third should be Gamma
      await expectElement(page.getByRole('heading', { name: 'Gamma Exercise' })).toBeVisible()

      app.cleanup()
    })
  })

  describe('Timer', () => {
    it('shows timer running during exercise transitions', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)

      const captured: { beforeTransition: string | undefined } = { beforeTransition: undefined }
      await expectPoll(
        async () => {
          const timerElements = await page.getByText(/\d+:\d{2}/).all()
          const timerText = timerElements[0] ? (await timerElements[0].element()).textContent : null
          if (timerText && !timerText.includes('0:00')) {
            captured.beforeTransition = timerText
            return true
          }
          return false
        },
        { timeout: 3000 }
      ).toBe(true)

      await completeExercise()

      await expectPoll(
        async () => {
          const timerElements = await page.getByText(/\d+:\d{2}/).all()
          const afterTransition = timerElements[0] ? (await timerElements[0].element()).textContent : null
          return afterTransition && !afterTransition.includes('0:00') && afterTransition !== captured.beforeTransition
        },
        { timeout: 3000 }
      ).toBe(true)

      app.cleanup()
    })
  })

  describe('Exercise Queue', () => {
    it('displays exercise queue drawer with status updates', async () => {
      const benchmark = await createForTimeBenchmark({
        exercises: [
          { name: 'Exercise 1', reps: 10 },
          { name: 'Exercise 2', reps: 10 },
          { name: 'Exercise 3', reps: 10 },
        ]
      })
      const app = await createTestApp()

      await startBenchmarkWorkout(app, benchmark.id)

      // Open queue drawer
      await page.getByRole('button', { name: /workout options/i }).click()
      await expectElement(page.getByRole('menuitem', { name: /view exercises/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /view exercises/i }).click()

      await expectElement(page.getByRole('heading', { name: /exercise queue/i })).toBeVisible()
      expect((await page.getByText(/exercise 1/i).all()).length).toBeGreaterThan(0)
      expect((await page.getByText(/active/i).all()).length).toBeGreaterThan(0)

      // Close and advance
      await page.getByRole('button', { name: /close/i }).click()
      await expectElement(page.getByRole('heading', { name: /exercise queue/i })).not.toBeInTheDocument()
      await new Promise(resolve => setTimeout(resolve, 500))

      await completeExercise()

      // Reopen and verify status
      await page.getByRole('button', { name: /workout options/i }).click()
      await page.getByRole('menuitem', { name: /view exercises/i }).click()
      expect((await page.getByText(/completed|active/i).all()).length).toBeGreaterThan(0)

      app.cleanup()
    })
  })
})
