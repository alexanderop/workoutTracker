import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createTestApp } from '../helpers/createTestApp'
import { getBenchmarksRepository } from '@/db'
import type { DbBenchmark } from '@/db/schema'

describe('Benchmark Exercise Queue', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  // Helper: Create ForTime benchmark with 3 exercises
  async function createForTimeBenchmark(): Promise<DbBenchmark> {
    return getBenchmarksRepository().create({
      name: 'Cindy',
      type: 'fortime',
      rounds: 1,
      exercises: [
        {
          exerciseDefinitionId: null,
          name: 'Pull-ups',
          prescribedReps: 50,
          thumbnail: '💪',
        },
        {
          exerciseDefinitionId: null,
          name: 'Push-ups',
          prescribedReps: 50,
          thumbnail: '🤸',
        },
        {
          exerciseDefinitionId: null,
          name: 'Squats',
          prescribedReps: 50,
          thumbnail: '🦵',
        },
      ],
    })
  }

  // Helper: Create Rounds benchmark (3 rounds × 2 exercises)
  async function createRoundsBenchmark(): Promise<DbBenchmark> {
    return getBenchmarksRepository().create({
      name: 'Fran',
      type: 'rounds',
      rounds: 3,
      exercises: [
        {
          exerciseDefinitionId: null,
          name: 'Thrusters',
          prescribedReps: 21,
          thumbnail: '🏋️',
        },
        {
          exerciseDefinitionId: null,
          name: 'Pull-ups',
          prescribedReps: 21,
          thumbnail: '💪',
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

    // Wait for active mode to initialize (screen reader also announces this text)
    await waitFor(() => {
      const elements = screen.getAllByText(/exercise 1 of/i)
      expect(elements.length).toBeGreaterThan(0)
    })

    return app
  }

  describe('ForTime Benchmark - Exercise Queue', () => {
    it('opens queue drawer and shows all exercises with correct statuses', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Find and click the Queue button in header
      const queueButton = screen.getByRole('button', { name: /queue/i })
      await app.user.click(queueButton)

      // Wait for drawer to open
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /exercise queue/i })).toBeTruthy()
      })

      // Verify all 3 exercises are displayed (use getAllByText since exercises appear in main view and queue)
      expect(screen.getAllByText(/pull-ups/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/push-ups/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText(/squats/i).length).toBeGreaterThanOrEqual(1)

      // Verify reps are displayed
      const repsElements = screen.getAllByText('50')
      expect(repsElements.length).toBeGreaterThanOrEqual(3)

      // Verify Exercise 1 is active (has "Active" badge)
      // Find the queue item (not the main exercise display)
      const exerciseItems = screen.getAllByText(/pull-ups/i)
      const queueItem = exerciseItems.find(el => el.closest('[data-exercise-item]'))
      expect(queueItem).toBeTruthy()
      const firstExerciseItem = queueItem?.closest('[data-exercise-item]')
      expect(firstExerciseItem).toBeTruthy()
      if (!firstExerciseItem) throw new Error('First exercise item not found')
      expect(firstExerciseItem.textContent).toContain('Active')

      // Verify completed indicator (check icon) is NOT present initially
      const checkIcons = screen.queryAllByLabelText(/completed/i)
      expect(checkIcons.length).toBe(0)

      app.cleanup()
    })

    it('updates exercise statuses as user progresses through workout', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Advance to Exercise 2
      const doneButton = screen.getByRole('button', { name: /done/i })
      await app.user.click(doneButton)

      // Wait for Exercise 2
      await waitFor(() => {
        expect(screen.getAllByText(/exercise 2 of 3/i).length).toBeGreaterThan(0)
      })

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 900))

      // Open queue
      const queueButton = screen.getByRole('button', { name: /queue/i })
      await app.user.click(queueButton)

      // Wait for drawer
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /exercise queue/i })).toBeTruthy()
      })

      // Verify Exercise 1 is completed by checking its aria-label
      const allItems = document.querySelectorAll('[data-exercise-item]')
      expect(allItems.length).toBe(3)

      const item1 = allItems[0]
      const item2 = allItems[1]
      const item3 = allItems[2]

      expect(item1?.getAttribute('aria-label')).toContain('Completed')
      expect(item2?.getAttribute('aria-label')).toContain('Active')
      expect(item3?.getAttribute('aria-label')).toContain('Upcoming')

      app.cleanup()
    })

    it('closes drawer when clicking outside', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Open queue
      const queueButton = screen.getByRole('button', { name: /queue/i })
      await app.user.click(queueButton)

      // Wait for drawer
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /exercise queue/i })).toBeTruthy()
      })

      // Press ESC to close drawer
      await app.user.keyboard('{Escape}')

      // Wait for drawer to close
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /exercise queue/i })).toBeNull()
      })

      app.cleanup()
    })
  })

  describe('Rounds Benchmark - Exercise Queue', () => {
    it('shows exercises grouped by round with round headers', async () => {
      const benchmark = await createRoundsBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Open queue
      const queueButton = screen.getByRole('button', { name: /queue/i })
      await app.user.click(queueButton)

      // Wait for drawer
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /exercise queue/i })).toBeTruthy()
      })

      // Verify 3 round headers
      expect(screen.getByRole('heading', { name: /round 1/i })).toBeTruthy()
      expect(screen.getByRole('heading', { name: /round 2/i })).toBeTruthy()
      expect(screen.getByRole('heading', { name: /round 3/i })).toBeTruthy()

      // Verify exercises appear under each round (6 total in queue + 1 in main view = at least 3 per exercise)
      const thrustersItems = screen.getAllByText(/thrusters/i)
      const pullUpsItems = screen.getAllByText(/pull-ups/i)
      expect(thrustersItems.length).toBeGreaterThanOrEqual(3) // One per round (+ main view)
      expect(pullUpsItems.length).toBeGreaterThanOrEqual(3) // One per round (+ main view)

      // Verify Round 1, Exercise 1 is active (find queue item, not main view)
      const queueItem = thrustersItems.find(el => el.closest('[data-exercise-item]'))
      expect(queueItem).toBeTruthy()
      const firstThrustersItem = queueItem?.closest('[data-exercise-item]')
      expect(firstThrustersItem).toBeTruthy()
      if (!firstThrustersItem) throw new Error('First thrusters item not found')
      expect(firstThrustersItem.textContent).toContain('Active')

      app.cleanup()
    })

    it('shows completed round when advancing to next round', async () => {
      const benchmark = await createRoundsBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Complete Round 1 (2 exercises)
      const doneButton = screen.getByRole('button', { name: /done/i })

      // Complete Exercise 1 (Thrusters)
      await app.user.click(doneButton)
      await waitFor(() => {
        expect(screen.getAllByText(/exercise 2 of 2/i).length).toBeGreaterThan(0)
      })
      await new Promise(resolve => setTimeout(resolve, 900))

      // Complete Exercise 2 (Pull-ups) - advances to Round 2
      await app.user.click(doneButton)
      await waitFor(() => {
        expect(screen.getAllByText(/exercise 1 of 2/i).length).toBeGreaterThan(0)
      })
      await new Promise(resolve => setTimeout(resolve, 900))

      // Open queue
      const queueButton = screen.getByRole('button', { name: /queue/i })
      await app.user.click(queueButton)

      // Wait for drawer
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /exercise queue/i })).toBeTruthy()
      })

      // Verify Round 1 exercises are completed, Round 2 Exercise 1 is active
      const allItems = document.querySelectorAll('[data-exercise-item]')
      expect(allItems.length).toBe(6) // 3 rounds × 2 exercises

      // Round 1 exercises should be completed
      expect(allItems[0]?.getAttribute('aria-label')).toContain('Completed')
      expect(allItems[1]?.getAttribute('aria-label')).toContain('Completed')

      // Round 2, Exercise 1 should be active
      expect(allItems[2]?.getAttribute('aria-label')).toContain('Active')

      // Remaining exercises should be pending
      expect(allItems[3]?.getAttribute('aria-label')).toContain('Upcoming')
      expect(allItems[4]?.getAttribute('aria-label')).toContain('Upcoming')
      expect(allItems[5]?.getAttribute('aria-label')).toContain('Upcoming')

      app.cleanup()
    })
  })
})
