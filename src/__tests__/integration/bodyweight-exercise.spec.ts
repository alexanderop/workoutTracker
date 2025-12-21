import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Bodyweight Exercise (Zero Weight)', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('allows completing a set with 0 weight for bodyweight exercises', async () => {
    const { builder, workout, cleanup } = await createTestApp()

    // Start a workout with Pull-ups (typical bodyweight exercise)
    await builder.setupStrengthWorkoutAndStart(['Pull-ups'])

    // Fill set with 0 weight (bodyweight only)
    await workout.fillCardSetAndComplete({ weight: '0', reps: '10', rir: '2' })

    // Verify set was completed
    await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

    cleanup()
  })

  it('pre-fills next set with 0 weight when previous set used 0', async () => {
    const { builder, workout, cleanup } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Pull-ups'])

    // Complete first set with 0 weight
    await workout.fillCardSetAndComplete({ weight: '0', reps: '8', rir: '2' })

    // Verify next set is pre-filled with 0
    await expect.poll(async () => {
      const activeSet = await workout.getActiveSet()
      if (!activeSet) return null
      return await activeSet.getValues()
    }).toEqual({ weight: '0', reps: '8', rir: '2' })

    cleanup()
  })
})
