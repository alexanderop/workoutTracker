import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createTestApp } from '../helpers/createTestApp'
import { getBenchmarksRepository } from '@/db'
import type { DbBenchmark } from '@/db/schema'

describe('Benchmark Exercise Navigation - Go Back', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  // Helper: Find footer "Back" button (not header "Go back" button)
  function findFooterBackButton(): HTMLElement {
    const allBackButtons = screen.getAllByRole('button', { name: /back/i })
    for (const btn of allBackButtons) {
      if (btn.textContent?.trim() === 'Back' && btn instanceof HTMLElement) {
        return btn
      }
    }
    throw new Error('Footer Back button not found')
  }

  // Helper: Check if footer "Back" button is visible
  function isFooterBackButtonVisible(): boolean {
    const allBackButtons = screen.queryAllByRole('button', { name: /back/i })
    return allBackButtons.some(btn => btn.textContent?.trim() === 'Back')
  }

  // Helper: Create ForTime benchmark with 3 exercises
  async function createForTimeBenchmark(): Promise<DbBenchmark> {
    return getBenchmarksRepository().create({
      name: 'Murph',
      type: 'fortime',
      rounds: 1,
      exercises: [
        {
          exerciseDefinitionId: null,
          name: 'Pull-ups',
          prescribedReps: 100,
          thumbnail: '💪',
        },
        {
          exerciseDefinitionId: null,
          name: 'Push-ups',
          prescribedReps: 200,
          thumbnail: '🤸',
        },
        {
          exerciseDefinitionId: null,
          name: 'Squats',
          prescribedReps: 300,
          thumbnail: '🦵',
        },
      ],
    })
  }

  // Helper: Start benchmark workout to active mode
  async function startBenchmarkWorkout(benchmarkId: string) {
    const app = await createTestApp()
    await app.benchmarkDetail.navigateToDetail(benchmarkId)
    await app.benchmarkDetail.clickStartWorkout()

    // Click "Start Workout" button to enter active mode
    const startButton = await waitFor(() =>
      screen.getByRole('button', { name: /start workout/i }),
    )
    await app.user.click(startButton)

    // Wait for active mode to initialize
    await waitFor(() => {
      expect(screen.getByText('Murph')).toBeTruthy()
    })

    return app
  }

  describe('Scenario: Go back one exercise', () => {
    it('returns to Exercise 1 when tapping Back from Exercise 2', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Verify starting on Exercise 1
      expect(screen.getByRole('heading', { name: /pull-ups/i })).toBeTruthy()
      const [, visibleProgress] = screen.getAllByText(/exercise 1 of 3/i)
      expect(visibleProgress).toBeTruthy()

      // Advance to Exercise 2
      const doneButton = screen.getByRole('button', { name: /done/i })
      await app.user.click(doneButton)

      // Wait for Exercise 2 to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /push-ups/i })).toBeTruthy()
        const [, visibleProgress] = screen.getAllByText(/exercise 2 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 900))

      // Tap "Back" button (footer button)
      const backButton = await waitFor(() => findFooterBackButton())
      await app.user.click(backButton)

      // Verify we're back on Exercise 1
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /pull-ups/i })).toBeTruthy()
        const [, visibleProgress] = screen.getAllByText(/exercise 1 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })

      // Verify Exercise 2 is no longer visible
      expect(screen.queryByText(/push-ups/i)).toBeNull()

      app.cleanup()
    })

    it('Exercise 1 becomes the current exercise after going back', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Advance to Exercise 2
      await app.user.click(screen.getByRole('button', { name: /done/i }))
      await waitFor(() => {
        const [, visibleProgress] = screen.getAllByText(/exercise 2 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 900))

      // Go back to Exercise 1
      const backButton = findFooterBackButton()
      await app.user.click(backButton)

      // Verify Exercise 1 is active (visible on screen)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /pull-ups/i })).toBeTruthy()
        const [, visibleProgress] = screen.getAllByText(/exercise 1 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })

      app.cleanup()
    })
  })

  describe('Scenario: Back button hidden on first exercise', () => {
    it('does not show Back button when on Exercise 1', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Verify we're on Exercise 1
      const [, visibleProgress1] = screen.getAllByText(/exercise 1 of 3/i)
      expect(visibleProgress1).toBeTruthy()

      // Verify Back button is NOT visible
      expect(isFooterBackButtonVisible()).toBe(false)

      app.cleanup()
    })

    it('shows Back button when on Exercise 2 or later', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Advance to Exercise 2
      await app.user.click(screen.getByRole('button', { name: /done/i }))
      await waitFor(() => {
        const [, visibleProgress] = screen.getAllByText(/exercise 2 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 900))

      // Verify Back button IS visible
      const backButton = await waitFor(() => findFooterBackButton())
      expect(backButton).toBeTruthy()

      app.cleanup()
    })
  })

  describe('Scenario: Timer keeps running when going back', () => {
    it('timer continues without adjustment after going back', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Capture initial timer value (should be running)
      const initialTimer = await waitFor(() => screen.getByText(/⏱ 0:0\d/))
      const initialTime = initialTimer.textContent

      // Advance to Exercise 2
      await app.user.click(screen.getByRole('button', { name: /done/i }))
      await waitFor(() => {
        const [, visibleProgress] = screen.getAllByText(/exercise 2 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })

      // Wait for animation + some time to pass
      await new Promise(resolve => setTimeout(resolve, 1200))

      // Capture timer before going back
      const timerBeforeBack = screen.getByText(/⏱ 0:0\d/)
      const timeBeforeBack = timerBeforeBack.textContent

      // Verify timer has advanced since start
      expect(timeBeforeBack).not.toBe(initialTime)

      // Go back to Exercise 1
      const backButton = findFooterBackButton()
      await app.user.click(backButton)

      // Wait for back transition
      await waitFor(() => {
        const [, visibleProgress] = screen.getAllByText(/exercise 1 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })

      // Verify timer is still running and has advanced further
      await waitFor(() => {
        const currentTimer = screen.getByText(/⏱ 0:0\d/)
        // Timer should continue incrementing (not reset, not paused)
        expect(currentTimer).toBeTruthy()
      })

      // Wait enough time to guarantee the timer ticks to next second (1200ms)
      await new Promise(resolve => setTimeout(resolve, 1200))
      const finalTimer = screen.getByText(/⏱ 0:0\d/)
      const finalTime = finalTimer.textContent

      // Final time should be different from the time before going back
      expect(finalTime).not.toBe(timeBeforeBack)

      app.cleanup()
    })
  })

  describe('Edge cases', () => {
    it('can navigate back and forth multiple times', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Exercise 1 → 2
      await app.user.click(screen.getByRole('button', { name: /done/i }))
      await waitFor(() => {
        const [, visibleProgress] = screen.getAllByText(/exercise 2 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })
      await new Promise(resolve => setTimeout(resolve, 900))

      // Exercise 2 → 1 (back)
      await app.user.click(findFooterBackButton())
      await waitFor(() => {
        const [, visibleProgress] = screen.getAllByText(/exercise 1 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })

      // Exercise 1 → 2 (forward again)
      await app.user.click(screen.getByRole('button', { name: /done/i }))
      await waitFor(() => {
        const [, visibleProgress] = screen.getAllByText(/exercise 2 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })
      await new Promise(resolve => setTimeout(resolve, 900))

      // Exercise 2 → 3
      await app.user.click(screen.getByRole('button', { name: /done/i }))
      await waitFor(() => {
        const [, visibleProgress] = screen.getAllByText(/exercise 3 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })
      await new Promise(resolve => setTimeout(resolve, 900))

      // Exercise 3 → 2 (back)
      await app.user.click(findFooterBackButton())
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /push-ups/i })).toBeTruthy()
        const [, visibleProgress2] = screen.getAllByText(/exercise 2 of 3/i)
        expect(visibleProgress2).toBeTruthy()
      })

      app.cleanup()
    })

    it('back button is disabled during exercise transition animation', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Advance to Exercise 2
      await app.user.click(screen.getByRole('button', { name: /done/i }))
      await waitFor(() => {
        const [, visibleProgress] = screen.getAllByText(/exercise 2 of 3/i)
        expect(visibleProgress).toBeTruthy()
      })
      await new Promise(resolve => setTimeout(resolve, 900))

      // Start advancing to Exercise 3 (triggers animation)
      const doneButton = screen.getByRole('button', { name: /done/i })
      await app.user.click(doneButton)

      // During animation, Back button should be disabled
      // Note: Button may not be visible immediately during checkmark animation
      await new Promise(resolve => setTimeout(resolve, 200))

      if (isFooterBackButtonVisible()) {
        const backButton = findFooterBackButton()
        expect(backButton).toHaveProperty('disabled', true)
      }

      app.cleanup()
    })
  })
})
