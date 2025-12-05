import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

describe('Timed Block Configuration', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  it('allows user to add timed blocks from the dialog and start workout', async () => {
    const { builder, user, getByRole, queryByText, queryByRole, common, cleanup } =
      await createTestApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    // Verify exercises tab is default (check aria-selected attribute)
    const exercisesTab = getByRole('tab', { name: /exercises/i })
    expect(exercisesTab.getAttribute('aria-selected')).toBe('true')

    // Switch to timed blocks tab
    await builder.switchToTimedBlocksTab()

    // Verify all block types are available
    expect(queryByText('AMRAP')).toBeTruthy()
    expect(queryByText('EMOM')).toBeTruthy()
    expect(queryByText('Tabata')).toBeTruthy()
    expect(queryByText('For Time')).toBeTruthy()

    // Select AMRAP - this opens a configuration dialog
    await user.click(common.getDialogButton('AMRAP'))

    // Wait for configuration dialog
    await waitFor(() => {
      const dialog = getByRole('dialog')
      expect(dialog.textContent).toContain('Configure')
    })

    // Add an exercise to the AMRAP
    await user.click(common.getDialogButton('Add Exercise'))
    await user.click(common.getDialogButton('Push-ups'))

    // Confirm the block by clicking "Add Block"
    await user.click(common.getDialogButton('Add Block'))

    // Wait for dialog to close
    await waitFor(() => {
      expect(queryByRole('dialog')).toBeNull()
    })

    // Verify AMRAP block appears in builder
    const playlistButtons = builder.getPlaylistBlockButtons()
    expect(playlistButtons.length).toBe(1)

    // Start workout and verify timer UI
    await builder.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Timer should display (verify Start button appears)
    expect(queryByRole('button', { name: /start/i })).toBeTruthy()

    cleanup()
  })

  it('filters exercises when searching in add block dialog', async () => {
    const { builder, user, getByRole, queryByText, queryByRole, common, cleanup } =
      await createTestApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    // Multiple exercises should be visible initially
    expect(queryByText('Bench Press')).toBeTruthy()
    expect(queryByText('Squat')).toBeTruthy()

    // Type in search input
    const searchInput = getByRole('textbox')
    await user.type(searchInput, 'bench')

    // Only matching exercise should remain
    await waitFor(() => {
      expect(queryByText('Bench Press')).toBeTruthy()
      expect(queryByText('Squat')).toBeFalsy()
    })

    // Select the filtered exercise and verify it adds to workout
    await user.click(common.getDialogButton('Bench Press'))

    // Dialog should close after selecting exercise
    await waitFor(() => {
      expect(queryByRole('dialog')).toBeNull()
    })

    // Verify exercise was added to builder
    const playlistButtons = builder.getPlaylistBlockButtons()
    expect(playlistButtons.length).toBe(1)

    cleanup()
  })
})
