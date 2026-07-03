import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbPlannedSet, createDbSet, createDbStrengthBlockWithSets } from '../factories'
import { getActiveWorkoutRepository } from '@/db'

async function seedPersistedActiveWorkout(): Promise<void> {
  const block = createDbStrengthBlockWithSets([createDbSet(), createDbPlannedSet()], {
    name: 'Bench Press',
  })

  await getActiveWorkoutRepository().save({
    id: 'current',
    name: 'Push Day',
    blocks: [block],
    selectedBlockIndex: 0,
    startedAt: Date.now() - 60_000,
    lastModifiedAt: Date.now(),
    mode: 'active',
    activeSetIndex: 1,
    activeExerciseIndex: 0,
    benchmarkId: null,
    globalTimerStartedAt: null,
  })
}

describe('App start with persisted active workout', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('prompts to resume and restores the workout on confirm', async () => {
    await seedPersistedActiveWorkout()

    const app = await createTestApp()

    await expect.element(page.getByRole('heading', { name: /resume workout\?/i })).toBeVisible()
    await expect.element(page.getByText('Push Day')).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: /resume workout/i }))

    await app.common.waitForRoute(/^\/workout\/active/)
    await app.workout.waitForTableVisible()
    await expect.element(page.getByText('Bench Press')).toBeVisible()

    app.cleanup()
  })

  it('discards the persisted workout and starts clean', async () => {
    await seedPersistedActiveWorkout()

    const app = await createTestApp()

    await expect.element(page.getByRole('heading', { name: /resume workout\?/i })).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: /discard/i }))

    await app.common.waitForDialogClose()
    await expect.poll(() => getActiveWorkoutRepository().exists()).toBe(false)
    expect(app.router.currentRoute.value.path).toBe('/')

    app.cleanup()
  })

  it('does not prompt when no active workout is persisted', async () => {
    const app = await createTestApp()

    expect(app.common.isDialogOpen()).toBe(false)
    await expect
      .element(page.getByRole('heading', { name: /resume workout\?/i }))
      .not.toBeInTheDocument()

    app.cleanup()
  })
})
