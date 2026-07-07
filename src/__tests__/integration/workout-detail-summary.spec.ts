import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getWorkoutsRepository } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbCompletedWorkout, createDbStrengthBlockWithSets } from '../factories'

describe('Workout detail exercise summary', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('should not claim every set used the top weight when sets are uneven', async () => {
    // 80/80/999 -- the old "3 sets × 999.0 kg" wording implied all three sets
    // were done at 999 kg, which is misleading (UX review finding).
    const block = createDbStrengthBlockWithSets([{ kg: '80' }, { kg: '80' }, { kg: '999' }])
    const workout = createDbCompletedWorkout({ blocks: [block] })
    await getWorkoutsRepository().add(workout)

    const app = await createTestApp()
    await app.navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })

    // The misleading phrasing must be gone...
    await expect.element(page.getByText('3 sets × 999 kg')).not.toBeInTheDocument()
    await expect.element(page.getByText('3 sets × 999.0 kg')).not.toBeInTheDocument()

    // ...replaced by "top set" wording that doesn't claim uniformity.
    await expect.element(page.getByText('3 sets · top 999 kg')).toBeVisible()

    app.cleanup()
  })
})
