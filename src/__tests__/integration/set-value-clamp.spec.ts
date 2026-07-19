import { userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'

/**
 * Regression coverage for UX review Low finding: "Weight/reps clamp silently at
 * 999; a brief flash would communicate the clamp." Typing a value above a
 * NumberField's max used to clamp on blur with zero feedback. Desktop/inline
 * NumberField is exercised here because headless Chrome doesn't report as a
 * touch device (see the UX review's caveats) -- the same path real desktop
 * users hit.
 */
describe('Set Value Clamp Signal', () => {
  it('should show a clamp signal on the weight input when a value exceeding the max is typed', async ({
    createTestApp,
  }) => {
    const { builder, workout } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    const row = await workout.getSetRow(0)
    await userEvent.fill(row.kg, '1500')

    expect(row.kg.classList.contains('animate-shake-clamp')).toBe(true)
  })

  it('should not show a clamp signal when the typed value is within range', async ({
    createTestApp,
  }) => {
    const { builder, workout } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    const row = await workout.getSetRow(0)
    await userEvent.fill(row.kg, '100')

    expect(row.kg.classList.contains('animate-shake-clamp')).toBe(false)
  })

  it('should clear the clamp signal once the value commits on blur', async ({ createTestApp }) => {
    const { builder, workout } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    const row = await workout.getSetRow(0)
    await userEvent.fill(row.kg, '1500')
    expect(row.kg.classList.contains('animate-shake-clamp')).toBe(true)

    row.kg.blur()
    await expect.poll(() => row.kg.classList.contains('animate-shake-clamp')).toBe(false)
  })
})
