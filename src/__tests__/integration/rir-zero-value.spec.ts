import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from '../helpers/locator'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { NumericInputModalPO } from '../helpers/pages/NumericInputModalPO'
import { mockTouchDevice, restoreMatchMedia } from '../helpers/mockTouchDevice'

describe('RIR Zero Value on Mobile', () => {
  beforeEach(async () => {
    mockTouchDevice()
    await setupIntegrationTest()
  })
  afterEach(async () => {
    await cleanupIntegrationTest()
    restoreMatchMedia()
  })

  const modalPO = new NumericInputModalPO()

  /**
   * BUG: RIR of 0 cannot be saved and displayed on mobile/touch devices.
   *
   * Root cause in WorkoutActiveStrengthView.vue:
   * 1. Line 117: `rirValue: set.rir ? Number(set.rir) : undefined` - treats 0 as falsy
   * 2. Line 169: `formatDisplayValue` returns '—' for both undefined and 0
   *
   * This test verifies that RIR 0 is correctly entered, saved, and displayed.
   */
  it('allows entering and saving RIR of 0 on touch devices', async () => {
    const { builder, workout, cleanup } = await createTestApp()

    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    // Fill weight via modal
    const weightTrigger = page.getByRole('button', { name: /weight for set 1/i })
    await weightTrigger.click()
    await modalPO.waitForOpen()
    await modalPO.enterValueAndConfirm(100)
    await modalPO.waitForClose()

    // Fill reps via modal
    const repsTrigger = page.getByRole('button', { name: /reps for set 1/i })
    await repsTrigger.click()
    await modalPO.waitForOpen()
    await modalPO.enterValueAndConfirm(8)
    await modalPO.waitForClose()

    // Fill RIR with 0 via modal (the bug scenario)
    const rirTrigger = page.getByRole('button', { name: /reps in reserve for set 1/i })
    await rirTrigger.click()
    await modalPO.waitForOpen()
    await modalPO.enterValueAndConfirm(0)
    await modalPO.waitForClose()

    // Verify RIR displays "0" (not "—" or empty)
    // Bug: formatDisplayValue() in WorkoutActiveStrengthView.vue line 169 returns '—' for 0
    const set = await workout.getSet(0)
    const values = await set.getValues()
    expect(values.rir).toBe('0')

    cleanup()
  })
})
