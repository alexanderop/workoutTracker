import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'

describe('Bodyweight Exercise (Zero Weight)', () => {
  it('allows completing a set with 0 weight for bodyweight exercises', async ({
    createTestApp,
  }) => {
    const { builder, workout } = await createTestApp()

    // Start a workout with Pull-ups (typical bodyweight exercise)
    await builder.setupStrengthWorkoutAndStart(['Pull-ups'])

    // Fill set with 0 weight (bodyweight only)
    await workout.fillCardSetAndComplete({ weight: '0', reps: '10', rir: '2' })

    // Verify set was completed
    await expect.poll(() => workout.isSetCompleted(0)).toBe(true)
  })

  it('pre-fills next set with 0 weight when previous set used 0', async ({ createTestApp }) => {
    const { builder, workout } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Pull-ups'])

    // Complete first set with 0 weight
    await workout.fillCardSetAndComplete({ weight: '0', reps: '8', rir: '2' })

    // Verify next set is pre-filled with 0
    await expect
      .poll(async () => {
        const activeSet = await workout.getActiveSet()
        if (!activeSet) return null
        return await activeSet.getValues()
      })
      .toEqual({ weight: '0', reps: '8', rir: '2' })
  })
})
