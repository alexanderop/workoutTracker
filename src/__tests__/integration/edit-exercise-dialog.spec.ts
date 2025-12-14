import { screen, waitFor, within } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Edit Exercise Dialog', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('opens edit dialog from builder mode edit button', async () => {
    const { builder, common, getByRole, cleanup } = await createTestApp()

    // Add a strength block (stay in builder mode, don't start workout)
    await builder.addStrengthBlock('Bench Press')

    // Click the edit button on the block (pencil icon)
    const editButton = getByRole('button', { name: /edit bench press/i })
    await userEvent.click(editButton)

    // Verify dialog opens
    await common.waitForDialog()
    expect(screen.getByRole('heading', { name: /edit sets & reps/i })).toBeTruthy()

    cleanup()
  })

  it('changes target reps using number stepper', async () => {
    const { builder, common, getByRole, cleanup } = await createTestApp()

    await builder.addStrengthBlock('Bench Press')

    // Open edit dialog
    const editButton = getByRole('button', { name: /edit bench press/i })
    await userEvent.click(editButton)
    await common.waitForDialog()

    // Get all increment buttons (first is target reps, second is set count)
    const dialog = screen.getByRole('dialog')
    const incrementButtons = within(dialog).getAllByRole('button', { name: /increase/i })
    const targetRepsIncrement = incrementButtons[0]!

    // Click increment 3 times (default is 8, should become 11)
    await userEvent.click(targetRepsIncrement)
    await userEvent.click(targetRepsIncrement)
    await userEvent.click(targetRepsIncrement)

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await userEvent.click(saveButton)

    // Verify dialog closes
    common.assertDialogClosed()

    // Re-open dialog and verify target reps persisted
    await userEvent.click(editButton)
    await common.waitForDialog()

    const spinbuttons = within(screen.getByRole('dialog')).getAllByRole('spinbutton')
    expect(spinbuttons[0]).toHaveValue('11') // targetReps changed from 8 to 11

    cleanup()
  })

  it('changes number of sets and verifies update', async () => {
    const { builder, common, getByRole, cleanup } = await createTestApp()

    await builder.addStrengthBlock('Barbell Row')

    // Open edit dialog
    const editButton = getByRole('button', { name: /edit barbell row/i })
    await userEvent.click(editButton)
    await common.waitForDialog()

    // Get all increment buttons (first is target reps, second is set count)
    const dialog = screen.getByRole('dialog')
    const incrementButtons = within(dialog).getAllByRole('button', { name: /increase/i })
    const setCountIncrement = incrementButtons[1]!

    // Add 2 more sets (3 -> 5)
    await userEvent.click(setCountIncrement)
    await userEvent.click(setCountIncrement)

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await userEvent.click(saveButton)
    common.assertDialogClosed()

    // Start workout to verify set count
    await builder.startWorkout()
    await screen.findByRole('table')

    // Verify table has 5 sets
    await waitFor(() => {
      const rows = within(screen.getByRole('table')).getAllByRole('row')
      expect(rows.length).toBe(6) // 1 header + 5 data rows
    })

    cleanup()
  })

  it('cancel button closes dialog without saving changes', async () => {
    const { builder, common, getByRole, cleanup } = await createTestApp()

    await builder.addStrengthBlock('Bench Press')

    // Open edit dialog
    const editButton = getByRole('button', { name: /edit bench press/i })
    await userEvent.click(editButton)
    await common.waitForDialog()

    // Get all increment buttons and increment set count
    const dialog = screen.getByRole('dialog')
    const incrementButtons = within(dialog).getAllByRole('button', { name: /increase/i })
    const setCountIncrement = incrementButtons[1]!
    await userEvent.click(setCountIncrement)
    await userEvent.click(setCountIncrement)

    // Cancel instead of save
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await userEvent.click(cancelButton)
    common.assertDialogClosed()

    // Start workout and verify original set count (3 sets)
    await builder.startWorkout()
    await screen.findByRole('table')

    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows.length).toBe(4) // 1 header + 3 data rows (unchanged)

    cleanup()
  })

  it('dialog is keyboard-free (no text inputs)', async () => {
    const { builder, common, getByRole, cleanup } = await createTestApp()

    await builder.addStrengthBlock('Bench Press')

    // Open edit dialog
    const editButton = getByRole('button', { name: /edit bench press/i })
    await userEvent.click(editButton)
    await common.waitForDialog()

    // Verify no text inputs exist (only spinbuttons for numbers)
    const dialog = screen.getByRole('dialog')
    const textInputs = within(dialog).queryAllByRole('textbox')
    expect(textInputs.length).toBe(0)

    // Verify spinbuttons exist for number inputs
    const spinbuttons = within(dialog).getAllByRole('spinbutton')
    expect(spinbuttons.length).toBe(2) // target reps and set count

    cleanup()
  })
})
