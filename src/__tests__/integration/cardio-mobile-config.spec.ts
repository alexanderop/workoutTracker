import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { NumericInputModalPO } from '../helpers/pages/NumericInputModalPO'
import { mockTouchDevice, restoreMatchMedia } from '../helpers/mockTouchDevice'

/**
 * Configuring a cardio block on a touch device. On phones the duration and
 * distance fields open the numeric keypad modal instead of a number input —
 * this is the primary way the app is used mid-workout, but the existing
 * cardio specs only cover the desktop inputs.
 */
describe('Cardio configuration on a touch device', () => {
  beforeEach(async () => {
    mockTouchDevice()
  })
  afterEach(async () => {
    restoreMatchMedia()
  })

  const modalPO = new NumericInputModalPO()

  it('sets duration and distance through the numeric keypad and adds the block', async ({
    createTestApp,
  }) => {
    const { builder, common } = await createTestApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()
    await builder.switchToTimedBlocksTab()
    await userEvent.click(common.getDialogButton('Cardio'))
    await expect.element(page.getByText('Configure')).toBeVisible()

    // Duration defaults to 30 — tap it and enter 25 via the keypad modal.
    // (No waitForClose here: the configure dialog stays open behind the modal.)
    await userEvent.click(page.getByRole('button', { name: '30', exact: true }))
    await modalPO.waitForOpen()
    await modalPO.enterValueAndConfirm(25)
    await expect.element(page.getByRole('button', { name: '25', exact: true })).toBeVisible()

    // Distance is empty (shows 0) — tap it and enter 5 km
    await userEvent.click(page.getByRole('button', { name: '0', exact: true }))
    await modalPO.waitForOpen()
    await modalPO.enterValueAndConfirm(5)
    await expect.element(page.getByRole('button', { name: '5', exact: true })).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: 'Add Block', exact: true }))
    await common.waitForDialogClose()

    const playlistButtons = await builder.getPlaylistBlockButtons()
    expect(playlistButtons).toHaveLength(1)
  })
})
