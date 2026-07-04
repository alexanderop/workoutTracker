import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'

/**
 * Verifies that the recent workouts list on the home page is backed by a live
 * query (src/composables/useRecentWorkouts.ts + WorkoutsRepository.observeHistory()):
 * a workout written to storage while the home page stays mounted must appear
 * without any explicit reload call or navigation.
 */
describe('Home Recent Workouts Live Update', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('should show a newly completed workout without reloading when it is added while home page stays mounted', async () => {
    const { cleanup } = await createTestApp()

    // Home page starts empty
    await expect.element(page.getByText(/no workouts yet|empty/i)).toBeVisible()

    // Simulate a workout being completed elsewhere (e.g. another tab) by
    // writing directly to storage. The home page is never navigated away
    // from or reloaded.
    const workout = databaseWorkoutBuilder()
      .withName('Cross-Tab Workout')
      .withStrengthBlock()
      .build()
    await db.workouts.add(workout)

    // The live query subscription should push the new snapshot through
    // without any manual reload call.
    await expect.element(page.getByText('Cross-Tab Workout')).toBeVisible()

    cleanup()
  })
})
