import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'

/**
 * Regression coverage for UX review Low finding: "Row checkmarks look enabled on
 * empty sets but do nothing; footer CTA correctly disables -- make the two
 * affordances consistent." The row checkmark now mirrors the footer CTA's
 * readiness computation (`isSetReady`), including live/uncommitted keystrokes
 * (Finding 6), so it enables the moment the set becomes valid -- even before blur --
 * and stays disabled while any required field is missing.
 */
describe('Set Row Checkmark Disabled State', () => {
  it('should disable the row checkmark when the set has no values entered', async ({
    createTestApp,
  }) => {
    const { builder, workout } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    const row = workout.getSet(0)
    expect(await row.isCompleteButtonDisabled()).toBe(true)
  })

  it('should enable the row checkmark once weight, reps, and rir are typed even while the last input still has focus', async ({
    createTestApp,
  }) => {
    const { builder, workout } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    const row = workout.getSet(0)
    // Leaves focus in the rir input without blurring it (mirrors Finding 6 coverage).
    await row.enterValues({ kg: 60, reps: 10, rir: 2 })

    expect(await row.isCompleteButtonDisabled()).toBe(false)
  })

  it('should keep the row checkmark disabled while reps is missing', async ({ createTestApp }) => {
    const { builder, workout } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    const row = workout.getSet(0)
    await row.enterValues({ kg: 60, rir: 2 })

    expect(await row.isCompleteButtonDisabled()).toBe(true)
  })
})
