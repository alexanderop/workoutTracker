import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { DbWorkoutBlock } from '@/db/schema'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { seedCompletedWorkout } from '../helpers/dbAssertions'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories/dbWorkout.factory'

/**
 * Workout detail view for non-strength workouts and its edge states.
 * Existing detail specs only open strength workouts; real users also review
 * conditioning sessions (cardio/AMRAP blocks with results and notes), hit
 * stale links, and restart a past workout via the redo button.
 */

function cardioBlockWithResult(): DbWorkoutBlock {
  return {
    kind: 'cardio',
    id: crypto.randomUUID(),
    config: { activity: 'running', targetDurationSeconds: 1800, targetDistanceMeters: null },
    result: {
      actualDurationSeconds: 1800,
      distanceMeters: 5000,
      avgPaceSecondsPerKm: 360,
      calories: 320,
      notes: null,
    },
    orderIndex: 0,
  }
}

function amrapBlockWithResult(): DbWorkoutBlock {
  return {
    kind: 'amrap',
    id: crypto.randomUUID(),
    config: { durationSeconds: 600 },
    exercises: [
      { id: crypto.randomUUID(), name: 'Burpees', prescribedReps: 10, load: null, image: null },
    ],
    result: { rounds: 7, partialReps: 4, actualDuration: 600 },
    orderIndex: 1,
  }
}

describe('Workout Detail — states and non-strength blocks', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('shows cardio and AMRAP blocks with results and the workout notes', async () => {
    const workout = databaseWorkoutBuilder().withName('Morning Conditioning').build()
    const conditioningWorkout = {
      ...workout,
      blocks: [cardioBlockWithResult(), amrapBlockWithResult()],
      notes: 'Felt strong, easy pace.',
    }
    await seedCompletedWorkout(conditioningWorkout)

    const { navigateTo, cleanup } = await createTestApp()
    await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: conditioningWorkout.id } })

    await expect.element(page.getByRole('heading', { name: 'Morning Conditioning' })).toBeVisible()

    // Cardio block shows completed minutes
    await expect.element(page.getByText(/30\s+minutes completed/i)).toBeVisible()

    // AMRAP block renders its completed rounds through the timed block card
    await expect.element(page.getByText(/7\s+rounds/i)).toBeVisible()

    // Notes section is displayed
    await expect.element(page.getByText('Felt strong, easy pace.')).toBeVisible()

    cleanup()
  })

  it('shows a not-found message for a stale link and navigates back home', async () => {
    const { router, cleanup } = await createTestApp()
    await router.push({ name: RouteNames.WorkoutDetail, params: { id: 'does-not-exist' } })

    await expect.element(page.getByText(/workout not found/i)).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: 'Go Back', exact: true }))
    await expect.poll(() => router.currentRoute.value.path).toBe('/')

    cleanup()
  })

  it('redoes a past workout and lands in a fresh active workout', async () => {
    const workout = databaseWorkoutBuilder()
      .withName('Push Day')
      .withExerciseAndSets([{ kg: '80', reps: '8', rir: '2', status: 'completed' }], {
        name: 'Bench Press',
        equipment: 'barbell',
      })
      .build()
    await seedCompletedWorkout(workout)

    const { navigateTo, common, cleanup } = await createTestApp()
    await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })

    await userEvent.click(page.getByRole('button', { name: /redo workout/i }))

    // Redo starts a new active workout from the completed one
    await common.waitForRoute(/^\/workout/)
    await expect.element(page.getByText('Bench Press')).toBeVisible()

    cleanup()
  })
})
