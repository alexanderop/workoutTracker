import { userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

/**
 * Regression coverage for UX review Low finding: "Weight/reps clamp silently at
 * 999; a brief flash would communicate the clamp." Typing a value above a
 * NumberField's max used to clamp on blur with zero feedback. Desktop/inline
 * NumberField is exercised here because headless Chrome doesn't report as a
 * touch device (see the UX review's caveats) -- the same path real desktop
 * users hit.
 */
describe('Set Value Clamp Signal', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('should show a clamp signal on the weight input when a value exceeding the max is typed', async () => {
    const { builder, workout, cleanup } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    const row = await workout.getSetRow(0)
    await userEvent.fill(row.kg, '1500')

    expect(row.kg.classList.contains('animate-shake-clamp')).toBe(true)

    cleanup()
  })

  it('should not show a clamp signal when the typed value is within range', async () => {
    const { builder, workout, cleanup } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    const row = await workout.getSetRow(0)
    await userEvent.fill(row.kg, '100')

    expect(row.kg.classList.contains('animate-shake-clamp')).toBe(false)

    cleanup()
  })

  it('should clear the clamp signal once the value commits on blur', async () => {
    const { builder, workout, cleanup } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    const row = await workout.getSetRow(0)
    await userEvent.fill(row.kg, '1500')
    expect(row.kg.classList.contains('animate-shake-clamp')).toBe(true)

    row.kg.blur()
    await expect.poll(() => row.kg.classList.contains('animate-shake-clamp')).toBe(false)

    cleanup()
  })
})
