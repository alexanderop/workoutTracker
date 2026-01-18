import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from '../helpers/locator'
import { expectElement, expectPoll } from '../helpers/assertions'
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
    await editButton.click()

    // Verify dialog opens
    await common.waitForDialog()
    const heading = await page.getByRole('heading', { name: /edit sets & reps/i }).query()
    expect(heading).toBeTruthy()

    cleanup()
  })

  it('changes target reps using number stepper', async () => {
    const { builder, common, getByRole, cleanup } = await createTestApp()

    await builder.addStrengthBlock('Bench Press')

    // Open edit dialog
    const editButton = getByRole('button', { name: /edit bench press/i })
    await editButton.click()
    await common.waitForDialog()

    // Get all increment buttons (first is target reps, second is set count)
    const dialog = page.getByRole('dialog')
    const incrementButtons = await dialog.getByRole('button', { name: /increase/i }).all()
    const targetRepsIncrement = incrementButtons[0]!

    // Click increment 3 times (default is 8, should become 11)
    await targetRepsIncrement.click()
    await targetRepsIncrement.click()
    await targetRepsIncrement.click()

    // Save changes
    const saveButton = page.getByRole('button', { name: /save changes/i })
    await saveButton.click()

    // Verify dialog closes
    expect(common.isDialogOpen()).toBe(false)

    // Re-open dialog and verify target reps persisted
    await editButton.click()
    await common.waitForDialog()

    const spinbuttons = await page.getByRole('dialog').getByRole('spinbutton').all()
    await expectElement(spinbuttons[0]!).toHaveValue('11') // targetReps changed from 8 to 11

    cleanup()
  })

  it('changes number of sets and verifies update', async () => {
    const { builder, common, getByRole, cleanup } = await createTestApp()

    await builder.addStrengthBlock('Barbell Row')

    // Open edit dialog
    const editButton = getByRole('button', { name: /edit barbell row/i })
    await editButton.click()
    await common.waitForDialog()

    // Get all increment buttons (first is target reps, second is set count)
    const dialog = page.getByRole('dialog')
    const incrementButtons = await dialog.getByRole('button', { name: /increase/i }).all()
    const setCountIncrement = incrementButtons[1]!

    // Add 2 more sets (3 -> 5)
    await setCountIncrement.click()
    await setCountIncrement.click()

    // Save changes
    const saveButton = page.getByRole('button', { name: /save changes/i })
    await saveButton.click()
    expect(common.isDialogOpen()).toBe(false)

    // Start workout to verify set count
    await builder.startWorkout()
    await expectElement(page.getByRole('table')).toBeVisible()

    // Verify table has 5 sets
    await expectPoll(async () => {
      const rows = await page.getByRole('table').getByRole('row').all()
      return rows.length
    }).toBe(6) // 1 header + 5 data rows

    cleanup()
  })

  it('cancel button closes dialog without saving changes', async () => {
    const { builder, common, getByRole, cleanup } = await createTestApp()

    await builder.addStrengthBlock('Bench Press')

    // Open edit dialog
    const editButton = getByRole('button', { name: /edit bench press/i })
    await editButton.click()
    await common.waitForDialog()

    // Get all increment buttons and increment set count
    const dialog = page.getByRole('dialog')
    const incrementButtons = await dialog.getByRole('button', { name: /increase/i }).all()
    const setCountIncrement = incrementButtons[1]!
    await setCountIncrement.click()
    await setCountIncrement.click()

    // Cancel instead of save
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    await cancelButton.click()
    expect(common.isDialogOpen()).toBe(false)

    // Start workout and verify original set count (3 sets)
    await builder.startWorkout()
    await expectElement(page.getByRole('table')).toBeVisible()

    const rows = await page.getByRole('table').getByRole('row').all()
    expect(rows.length).toBe(4) // 1 header + 3 data rows (unchanged)

    cleanup()
  })

  it('dialog is keyboard-free (no text inputs)', async () => {
    const { builder, common, getByRole, cleanup } = await createTestApp()

    await builder.addStrengthBlock('Bench Press')

    // Open edit dialog
    const editButton = getByRole('button', { name: /edit bench press/i })
    await editButton.click()
    await common.waitForDialog()

    // Verify no text inputs exist (only spinbuttons for numbers)
    const dialog = page.getByRole('dialog')
    const textInputs = await dialog.getByRole('textbox').all()
    expect(textInputs.length).toBe(0)

    // Verify spinbuttons exist for number inputs
    const spinbuttons = await dialog.getByRole('spinbutton').all()
    expect(spinbuttons.length).toBe(2) // target reps and set count

    cleanup()
  })

  describe('Isometric exercises', () => {
    it('shows target duration instead of target reps for isometric exercise', async () => {
      const { builder, common, getByRole, cleanup } = await createTestApp()

      // Add an isometric exercise (Plank)
      await builder.addStrengthBlock('Plank')

      // Open edit dialog
      const editButton = getByRole('button', { name: /edit plank/i })
      await editButton.click()
      await common.waitForDialog()

      // Expect: Duration label is visible (not "Target Reps")
      const dialog = page.getByRole('dialog')
      const durationLabel = dialog.getByLabelText(/target duration/i)
      await expectElement(durationLabel).toBeVisible()

      // Expect: Target Reps input is NOT present (the label for="target-reps" won't exist)
      const repsInput = dialog.getByLabelText(/^target reps$/i)
      await expectElement(repsInput).not.toBeInTheDocument()

      // Expect: Set count is still visible
      const setCountLabel = dialog.getByLabelText(/number of sets/i)
      await expectElement(setCountLabel).toBeVisible()

      cleanup()
    })

    it('shows optional weight field for weighted isometric exercise', async () => {
      const { builder, common, getByRole, cleanup } = await createTestApp()

      // Add weighted isometric exercise
      await builder.addStrengthBlock('Weighted Plank')

      // Open edit dialog
      const editButton = getByRole('button', { name: /edit weighted plank/i })
      await editButton.click()
      await common.waitForDialog()

      // Expect: Weight field is visible for weighted holds
      const dialog = page.getByRole('dialog')
      const weightInput = dialog.getByLabelText(/target weight/i)
      await expectElement(weightInput).toBeVisible()

      cleanup()
    })
  })
})
