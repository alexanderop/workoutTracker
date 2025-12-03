import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

// Helper to find footer navigation buttons
function findFooterButton(selector: 'next' | 'prev'): HTMLElement {
  const svgClass = selector === 'next' ? 'lucide-chevron-right' : 'lucide-chevron-left'
  const buttons = [...document.querySelectorAll('footer button')]
  for (const btn of buttons) {
    if (btn.querySelector(`svg.${svgClass}`) && btn instanceof HTMLElement) {
      return btn
    }
  }
  throw new Error(`Footer ${selector} button not found`)
}

// Helper to find dropdown menu trigger
function findMenuTrigger(): HTMLElement {
  const trigger = document.querySelector('[data-slot="dropdown-menu-trigger"]')
  if (!(trigger instanceof HTMLElement)) {
    throw new Error('Menu trigger not found or not an HTMLElement')
  }
  return trigger
}

// Helper to add a timed block to workout
async function addTimedBlock(
  app: Awaited<ReturnType<typeof createTestApp>>,
  blockType: 'AMRAP' | 'EMOM' | 'Tabata' | 'For Time',
) {
  // Click add block button
  const addBlockButton =
    app.queryByRole('button', { name: /add first block/i }) ??
    app.getByRole('button', { name: /add block/i })
  await app.user.click(addBlockButton)
  await app.waitForDialog()

  // Switch to Timed Blocks tab
  await app.user.click(app.getByRole('tab', { name: /timed blocks/i }))

  // Click the block type
  await app.user.click(app.getDialogButton(blockType))

  // Configure dialog opens - wait for it
  await waitFor(() => {
    const dialog = app.getByRole('dialog')
    expect(dialog.textContent).toContain('Configure')
  })

  // Add an exercise - Tabata uses "Select Exercise", others use "Add Exercise"
  const exerciseButtonText = blockType === 'Tabata' ? 'Select Exercise' : 'Add Exercise'
  await app.user.click(app.getDialogButton(exerciseButtonText))
  await app.user.click(app.getDialogButton('Push-ups'))

  // Click Add Block to confirm
  await app.user.click(app.getDialogButton('Add Block'))

  // Wait for dialog to close
  await waitFor(() => {
    expect(app.queryByRole('dialog')).toBeNull()
  })
}

// Helper to end workout via menu
async function endWorkoutViaMenu(app: Awaited<ReturnType<typeof createTestApp>>) {
  await waitFor(() => {
    expect(findMenuTrigger()).toBeTruthy()
  })
  await app.user.click(findMenuTrigger())

  await waitFor(() => {
    expect(app.queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
  })
  await app.user.click(app.getByRole('menuitem', { name: /end workout/i }))

  await app.waitForDialog()
  await app.user.click(app.getDialogButton('Finish Workout'))

  await app.waitForRoute(/^\/workout\/summary\//)
}

describe('Timed Block Execution', () => {
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

  it('creates AMRAP block and shows timer UI', async () => {
    const app = await createTestApp()

    // Start new workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    expect(app.router.currentRoute.value.path).toBe('/workout/active')

    // Add AMRAP block
    await addTimedBlock(app, 'AMRAP')

    // Verify block was added
    const playlistButtons = app.getPlaylistBlockButtons()
    expect(playlistButtons.length).toBe(1)

    // Start the workout
    await app.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Verify AMRAP view is shown with Start button
    expect(app.queryByRole('heading', { name: /amrap/i })).toBeTruthy()
    expect(app.queryByRole('button', { name: /start/i })).toBeTruthy()

    // Verify rounds section exists
    expect(app.queryByText(/rounds/i)).toBeTruthy()

    // Verify +1 button exists
    expect(app.queryByRole('button', { name: /\+1/i })).toBeTruthy()

    // End workout via menu
    await endWorkoutViaMenu(app)
    expect(app.router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

    app.cleanup()
  })

  it('creates EMOM block and shows minute display', async () => {
    const app = await createTestApp()

    // Start new workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))

    // Add EMOM block
    await addTimedBlock(app, 'EMOM')

    // Start workout
    await app.startWorkout()

    // Wait for active mode with EMOM
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Verify EMOM view shows minute info
    expect(app.queryByText(/minute 1 of/i)).toBeTruthy()

    // Verify Start button exists
    expect(app.queryByRole('button', { name: /start/i })).toBeTruthy()

    // Verify exercise is displayed
    expect(app.queryByText('Push-ups')).toBeTruthy()

    app.cleanup()
  })

  it('creates Tabata block and shows round/phase info', async () => {
    const app = await createTestApp()

    // Start new workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))

    // Add Tabata block
    await addTimedBlock(app, 'Tabata')

    // Start workout
    await app.startWorkout()

    // Wait for active mode with Tabata
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Verify Tabata view shows round info
    expect(app.queryByText(/round 1/i)).toBeTruthy()

    // Verify Start button exists
    expect(app.queryByRole('button', { name: /start/i })).toBeTruthy()

    app.cleanup()
  })

  it('creates For Time block and completes with Done button', async () => {
    const app = await createTestApp()

    // Start new workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))

    // Add For Time block
    await addTimedBlock(app, 'For Time')

    // Start workout
    await app.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Verify For Time view is shown with Done button (not Start/Pause)
    expect(app.queryByRole('heading', { name: /for time/i })).toBeTruthy()
    const doneButton = app.queryByRole('button', { name: /done/i })
    expect(doneButton).toBeTruthy()

    // Click Done to complete the block
    await app.user.click(doneButton!)

    // Should show finish workout dialog
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Finish Workout'))

    await app.waitForRoute(/^\/workout\/summary\//)
    expect(app.router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

    app.cleanup()
  })

  it('navigates between strength and timed blocks in hybrid workout', async () => {
    const app = await createTestApp()

    // Start new workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))

    // Add strength block first
    await app.user.click(app.getByRole('button', { name: /add first block/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))
    await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

    // Add AMRAP block
    await addTimedBlock(app, 'AMRAP')

    // Verify both blocks exist
    const playlistButtons = app.getPlaylistBlockButtons()
    expect(playlistButtons.length).toBe(2)

    // Start workout
    await app.startWorkout()

    // Wait for active mode on first block (strength)
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 2/i)).toBeTruthy()
    })

    // Verify strength view shows Complete Set button
    expect(app.queryByRole('button', { name: /complete set/i })).toBeTruthy()

    // Navigate to AMRAP block
    await app.user.click(findFooterButton('next'))

    await waitFor(() => {
      expect(app.queryByText(/block 2 of 2/i)).toBeTruthy()
    })

    // Verify AMRAP view shows Start button
    expect(app.queryByRole('button', { name: /start/i })).toBeTruthy()

    // Navigate back to strength block
    await app.user.click(findFooterButton('prev'))

    await waitFor(() => {
      expect(app.queryByText(/block 1 of 2/i)).toBeTruthy()
    })

    // Verify back on strength view
    expect(app.queryByRole('button', { name: /complete set/i })).toBeTruthy()

    app.cleanup()
  })

  it('AMRAP block allows incrementing rounds with +1 button', async () => {
    const app = await createTestApp()

    // Start new workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))

    // Add AMRAP block
    await addTimedBlock(app, 'AMRAP')

    // Verify block was added
    expect(app.getPlaylistBlockButtons().length).toBe(1)

    // Start the workout
    await app.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Verify AMRAP UI elements
    expect(app.queryByRole('heading', { name: /amrap/i })).toBeTruthy()
    expect(app.queryByRole('button', { name: /start/i })).toBeTruthy()
    expect(app.queryByText(/rounds/i)).toBeTruthy()

    // Start the timer by clicking Start
    await app.user.click(app.getByRole('button', { name: /start/i }))

    // Wait for +1 button to be enabled (timer must be running)
    await waitFor(() => {
      const plusButton = app.queryByRole('button', { name: /\+1/i })
      expect(plusButton).toBeTruthy()
      expect(plusButton).toHaveProperty('disabled', false)
    })

    // Increment rounds
    await app.user.click(app.getByRole('button', { name: /\+1/i }))
    await app.user.click(app.getByRole('button', { name: /\+1/i }))

    // End workout via menu
    await endWorkoutViaMenu(app)

    expect(app.router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

    app.cleanup()
  })
})
