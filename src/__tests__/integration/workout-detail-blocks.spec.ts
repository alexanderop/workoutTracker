import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import {
  createDbAmrapBlock,
  createDbAmrapResult,
  createDbForTimeBlock,
  createDbForTimeResult,
  dbWorkoutBuilder,
} from '../factories'
import {
  createDbCardioBlock,
  createDbCardioResult,
  createDbEmomBlock,
  createDbEmomResult,
} from '../factories/timedBlock.factory'

describe('Workout Detail — timed and cardio blocks', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('displays results for timed and cardio blocks plus notes', async () => {
    const workout = dbWorkoutBuilder()
      .withName('Conditioning Day')
      .withNotes('Great session')
      .withBlock(createDbAmrapBlock({ result: createDbAmrapResult({ rounds: 5 }) }))
      .withBlock(createDbEmomBlock({ result: createDbEmomResult({ completedMinutes: 12 }) }))
      .withBlock(createDbForTimeBlock({ result: createDbForTimeResult({ completed: true }) }))
      .withBlock(
        createDbCardioBlock({ result: createDbCardioResult({ actualDurationSeconds: 1800 }) }),
      )
      .build()
    await db.workouts.add(workout)

    const { navigateTo, cleanup } = await createTestApp()
    await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })

    await expect.element(page.getByText('Conditioning Day')).toBeVisible()

    await expect.element(page.getByText('amrap', { exact: true })).toBeVisible()
    await expect.element(page.getByText(/5 rounds/)).toBeVisible()

    await expect.element(page.getByText('emom', { exact: true })).toBeVisible()
    await expect.element(page.getByText(/12 minutes completed/)).toBeVisible()

    await expect.element(page.getByText('fortime', { exact: true })).toBeVisible()
    await expect.element(page.getByText('Completed', { exact: true })).toBeVisible()

    await expect.element(page.getByText('Cardio', { exact: true })).toBeVisible()
    await expect.element(page.getByText(/30 minutes completed/)).toBeVisible()

    await expect.element(page.getByText('Great session')).toBeVisible()

    cleanup()
  })

  it('shows the not-found state and navigates back home', async () => {
    const { navigateTo, router, cleanup } = await createTestApp()

    await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: 'does-not-exist' } })

    await expect.element(page.getByText(/workout not found/i)).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: 'Go Back', exact: true }))
    await expect.poll(() => router.currentRoute.value.path).toBe('/')

    cleanup()
  })

  it('redoes a completed workout into a new active session', async () => {
    const workout = dbWorkoutBuilder()
      .withName('Leg Day')
      .withExerciseAndSets([{ kg: '100', reps: '5', rir: '2' }], {
        name: 'Barbell Squat',
        equipment: 'barbell',
      })
      .build()
    await db.workouts.add(workout)

    const app = await createTestApp()
    await app.navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })

    await userEvent.click(page.getByRole('button', { name: /redo workout/i }))

    await app.common.waitForRoute(/^\/workout\/active/)
    await expect.element(page.getByText('Barbell Squat')).toBeVisible()

    app.cleanup()
  })
})
