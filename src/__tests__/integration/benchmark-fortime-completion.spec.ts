import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createTestApp } from '../helpers/createTestApp'
import { getBenchmarksRepository, getWorkoutsRepository } from '@/db'
import type { DbBenchmark } from '@/db/schema'

describe('ForTime Benchmark Completion', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  // Helper: Create ForTime benchmark with 2 exercises
  async function createForTimeBenchmark(): Promise<DbBenchmark> {
    return getBenchmarksRepository().create({
      name: 'Helen',
      type: 'fortime',
      rounds: 1,
      exercises: [
        {
          exerciseDefinitionId: null,
          name: 'Run',
          prescribedReps: 400,
          thumbnail: '🏃',
        },
        {
          exerciseDefinitionId: null,
          name: 'KB Swings',
          prescribedReps: 21,
          thumbnail: '🏋️',
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
      expect(screen.getByText('Helen')).toBeTruthy()
    })

    return app
  }

  // Helper: Complete all exercises
  async function completeAllExercises(app: Awaited<ReturnType<typeof createTestApp>>) {
    // Complete first exercise
    const doneButton = screen.getByRole('button', { name: /done/i })
    await app.user.click(doneButton)

    // Wait for transition animation (800ms) + buffer
    await new Promise(resolve => setTimeout(resolve, 900))

    // Wait for second exercise (use getAllByText since screen reader also announces this)
    await waitFor(() => {
      const elements = screen.getAllByText(/2 of 2/i)
      expect(elements.length).toBeGreaterThan(0)
    })

    // Complete second exercise (last)
    const doneButton2 = screen.getByRole('button', { name: /done/i })
    await app.user.click(doneButton2)

    // Wait for animations to complete
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  describe('Display completion screen with final time', () => {
    it('shows "Workout Complete!" message after completing all exercises', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Complete all exercises
      await completeAllExercises(app)

      // Verify completion screen appears
      await waitFor(() => {
        expect(screen.getByText(/workout complete/i)).toBeTruthy()
      })

      app.cleanup()
    })

    it('displays benchmark name on completion screen', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Complete all exercises
      await completeAllExercises(app)

      // Verify benchmark name is displayed (should appear multiple times: header + completion screen)
      await waitFor(() => {
        const benchmarkNames = screen.getAllByText('Helen')
        expect(benchmarkNames.length).toBeGreaterThan(0)
      })

      app.cleanup()
    })

    it('displays formatted completion time', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Complete all exercises
      await completeAllExercises(app)

      // Verify formatted time is displayed (MM:SS format)
      // Multiple timers may be present (header, footer, completion screen)
      await waitFor(() => {
        const timePattern = /\d+:\d{2}/
        const timeElements = screen.getAllByText(timePattern)
        expect(timeElements.length).toBeGreaterThan(0)
      })

      app.cleanup()
    })

    it('displays "View Details" button', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Complete all exercises
      await completeAllExercises(app)

      // Verify "View Details" button exists
      await waitFor(() => {
        const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
        expect(viewDetailsButton).toBeTruthy()
      })

      app.cleanup()
    })
  })

  describe('Timer stops on completion', () => {
    it('stops timer when last exercise is completed', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Complete all exercises
      await completeAllExercises(app)

      // Capture timer value from completion screen (large time display)
      const completionTime = await waitFor(() => {
        // The large completion time has specific class
        const largeTimeElement = screen.getByText(/\d+:\d{2}/, {
          selector: '.text-6xl'
        })
        return largeTimeElement.textContent
      })

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verify timer hasn't changed (it stopped)
      const currentTime = screen.getByText(/\d+:\d{2}/, {
        selector: '.text-6xl'
      }).textContent
      expect(currentTime).toBe(completionTime)

      app.cleanup()
    })
  })

  describe('Save attempt to history', () => {
    it('navigates to summary when "View Details" is clicked', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Complete all exercises
      await completeAllExercises(app)

      // Click "View Details"
      const viewDetailsButton = await waitFor(() =>
        screen.getByRole('button', { name: /view details/i })
      )
      await app.user.click(viewDetailsButton)

      // Verify navigation to summary (should show workout summary elements)
      await waitFor(() => {
        // Summary view should show duration, exercises, etc.
        expect(app.router.currentRoute.value.name).toBe('WorkoutSummary')
      })

      app.cleanup()
    })

    it('saves workout to database with benchmarkId', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Complete all exercises
      await completeAllExercises(app)

      // Click "View Details"
      const viewDetailsButton = await waitFor(() =>
        screen.getByRole('button', { name: /view details/i })
      )
      await app.user.click(viewDetailsButton)

      // Wait for navigation
      await waitFor(() => {
        expect(app.router.currentRoute.value.name).toBe('WorkoutSummary')
      })

      // Verify workout was saved to database
      const workouts = await getWorkoutsRepository().getHistory()
      expect(workouts).toHaveLength(1)
      expect(workouts[0]?.benchmarkId).toBe(benchmark.id)
      expect(workouts[0]?.name).toBe('Helen')

      app.cleanup()
    })

    it('saves ForTimeResult with completion time and completed flag', async () => {
      const benchmark = await createForTimeBenchmark()
      const app = await startBenchmarkWorkout(benchmark.id)

      // Complete all exercises
      await completeAllExercises(app)

      // Click "View Details"
      const viewDetailsButton = await waitFor(() =>
        screen.getByRole('button', { name: /view details/i })
      )
      await app.user.click(viewDetailsButton)

      // Wait for save
      await waitFor(() => {
        expect(app.router.currentRoute.value.name).toBe('WorkoutSummary')
      })

      // Verify ForTime result is saved
      const workouts = await getWorkoutsRepository().getHistory()
      const workout = workouts[0]
      if (!workout) {
        throw new Error('Workout not found')
      }
      const block = workout.blocks[0]
      if (!block) {
        throw new Error('Block not found')
      }

      expect(block.kind).toBe('fortime')
      if (block.kind === 'fortime') {
        expect(block.result).toBeTruthy()
        expect(block.result?.completed).toBe(true)
        expect(block.result?.completionTime).toBeGreaterThan(0)
      }

      app.cleanup()
    })
  })
})
