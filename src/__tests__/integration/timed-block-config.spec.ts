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
    const app = await createTestApp()

    await app.navigateToBuilder()
    await app.openAddBlockDialog()

    // Verify exercises tab is default (check aria-selected attribute)
    const exercisesTab = app.getByRole('tab', { name: /exercises/i })
    expect(exercisesTab.getAttribute('aria-selected')).toBe('true')

    // Switch to timed blocks tab
    await app.switchToTimedBlocksTab()

    // Verify all block types are available
    expect(app.queryByText('AMRAP')).toBeTruthy()
    expect(app.queryByText('EMOM')).toBeTruthy()
    expect(app.queryByText('Tabata')).toBeTruthy()
    expect(app.queryByText('For Time')).toBeTruthy()

    // Select AMRAP - this opens a configuration dialog
    await app.user.click(app.getDialogButton('AMRAP'))

    // Wait for configuration dialog
    await waitFor(() => {
      const dialog = app.getByRole('dialog')
      expect(dialog.textContent).toContain('Configure')
    })

    // Add an exercise to the AMRAP
    await app.user.click(app.getDialogButton('Add Exercise'))
    await app.user.click(app.getDialogButton('Push-ups'))

    // Confirm the block by clicking "Add Block"
    await app.user.click(app.getDialogButton('Add Block'))

    // Wait for dialog to close
    await waitFor(() => {
      expect(app.queryByRole('dialog')).toBeNull()
    })

    // Verify AMRAP block appears in builder
    const playlistButtons = app.getPlaylistBlockButtons()
    expect(playlistButtons.length).toBe(1)

    // Start workout and verify timer UI
    await app.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Timer should display (verify Start button appears)
    expect(app.queryByRole('button', { name: /start/i })).toBeTruthy()

    app.cleanup()
  })

  it('filters exercises when searching in add block dialog', async () => {
    const app = await createTestApp()

    await app.navigateToBuilder()
    await app.openAddBlockDialog()

    // Multiple exercises should be visible initially
    expect(app.queryByText('Bench Press')).toBeTruthy()
    expect(app.queryByText('Squat')).toBeTruthy()

    // Type in search input
    const searchInput = app.getByRole('textbox')
    await app.user.type(searchInput, 'bench')

    // Only matching exercise should remain
    await waitFor(() => {
      expect(app.queryByText('Bench Press')).toBeTruthy()
      expect(app.queryByText('Squat')).toBeFalsy()
    })

    // Select the filtered exercise and verify it adds to workout
    await app.user.click(app.getDialogButton('Bench Press'))

    // Dialog should close after selecting exercise
    await waitFor(() => {
      expect(app.queryByRole('dialog')).toBeNull()
    })

    // Verify exercise was added to builder
    const playlistButtons = app.getPlaylistBlockButtons()
    expect(playlistButtons.length).toBe(1)

    app.cleanup()
  })
})
