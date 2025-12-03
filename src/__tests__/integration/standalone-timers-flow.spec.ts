import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

// Helper to navigate to timers page from home
async function goToTimersPage(app: Awaited<ReturnType<typeof createTestApp>>) {
  const quickTimerCard = app.getByText(/quick timer/i)
  await app.user.click(quickTimerCard)
  await waitFor(() => {
    expect(app.queryByText(/AMRAP/)).toBeTruthy()
  })
}

describe('Standalone Timers Flow', () => {
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

  it('navigates from home to timers page via Quick Timer card', async () => {
    const app = await createTestApp()

    // Find and click the Quick Timer card on home page
    const quickTimerCard = app.getByText(/quick timer/i)
    expect(quickTimerCard).toBeTruthy()

    await app.user.click(quickTimerCard)

    // Verify navigation to timers page
    expect(app.router.currentRoute.value.path).toBe('/timers')

    // Verify timer selection UI is shown
    await waitFor(() => {
      expect(app.queryByText(/AMRAP/)).toBeTruthy()
    })
    expect(app.queryByText(/EMOM/)).toBeTruthy()
    expect(app.queryByText(/Tabata/)).toBeTruthy()
    expect(app.queryByText(/For Time/)).toBeTruthy()

    app.cleanup()
  })

  it('displays all four timer type options on timers page', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Verify all timer types are shown with descriptions
    expect(app.queryByText(/As Many Rounds As Possible/)).toBeTruthy()

    expect(app.queryByText(/EMOM/)).toBeTruthy()
    expect(app.queryByText(/Every Minute On the Minute/)).toBeTruthy()

    expect(app.queryByText(/Tabata/)).toBeTruthy()
    expect(app.queryByText(/Work\/Rest Intervals/)).toBeTruthy()

    expect(app.queryByText(/For Time/)).toBeTruthy()
    expect(app.queryByText(/Race Against the Clock/)).toBeTruthy()

    app.cleanup()
  })

  it('shows AMRAP presets when selecting AMRAP timer', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Click AMRAP button
    await app.user.click(screen.getByRole('button', { name: /AMRAP/i }))

    // Verify presets are shown - use exact text to avoid matching "15 min"
    await waitFor(() => {
      expect(app.queryByText('5 min')).toBeTruthy()
    })
    expect(app.queryByText('10 min')).toBeTruthy()
    expect(app.queryByText('15 min')).toBeTruthy()
    expect(app.queryByText('20 min')).toBeTruthy()
    expect(app.queryByText(/Custom/)).toBeTruthy()

    app.cleanup()
  })

  it('shows Tabata presets including Nordic protocol', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Click Tabata button
    await app.user.click(screen.getByRole('button', { name: /Tabata/i }))

    // Verify presets are shown
    await waitFor(() => {
      expect(app.queryByText(/Classic/)).toBeTruthy()
    })
    expect(app.queryByText(/8×20\/10/)).toBeTruthy()
    expect(app.queryByText(/Long/)).toBeTruthy()
    expect(app.queryByText(/Short/)).toBeTruthy()
    expect(app.queryByText(/Nordic/)).toBeTruthy()
    expect(app.queryByText(/4×4min\/3min/)).toBeTruthy()

    app.cleanup()
  })

  it('starts AMRAP timer from preset and shows timer UI with controls', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Select AMRAP
    await app.user.click(screen.getByRole('button', { name: /AMRAP/i }))

    // Wait for presets and select 5 min preset
    await waitFor(() => {
      expect(app.queryByText('5 min')).toBeTruthy()
    })
    await app.user.click(screen.getByRole('button', { name: /Quick burst/i }))

    // Verify timer runner is shown with controls - use semantic queries with aria-labels
    await waitFor(() => {
      expect(app.getTimerControlButton('exit')).toBeTruthy()
    })

    // Verify rounds display exists
    expect(app.queryByText(/Rounds/)).toBeTruthy()

    // Verify exit and reset buttons exist using semantic queries
    expect(app.getTimerControlButton('exit')).toBeTruthy()
    expect(app.getTimerControlButton('reset')).toBeTruthy()

    app.cleanup()
  })

  it('allows navigating back from preset selection to timer selection', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Select EMOM
    await app.user.click(screen.getByRole('button', { name: /EMOM/i }))

    // Wait for presets
    await waitFor(() => {
      expect(app.queryByText('10 min')).toBeTruthy()
    })

    // Click back button
    await app.user.click(screen.getByRole('button', { name: /go back/i }))

    // Should be back at timer selection
    await waitFor(() => {
      expect(app.queryByText(/As Many Rounds As Possible/)).toBeTruthy()
    })

    app.cleanup()
  })

  it('shows custom configuration form for Tabata', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Select Tabata
    await app.user.click(screen.getByRole('button', { name: /Tabata/i }))

    // Wait for presets and click Custom
    await waitFor(() => {
      expect(app.queryByText(/Custom/)).toBeTruthy()
    })
    await app.user.click(screen.getByRole('button', { name: /Custom/i }))

    // Verify custom form fields appear
    await waitFor(() => {
      expect(app.queryByText(/Rounds/)).toBeTruthy()
    })
    expect(app.queryByText(/Work \(seconds\)/)).toBeTruthy()
    expect(app.queryByText(/Rest \(seconds\)/)).toBeTruthy()

    // Verify Start button in form
    expect(app.queryByRole('button', { name: /Start/ })).toBeTruthy()

    app.cleanup()
  })

  it('shows For Time presets including No cap option', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Click For Time button
    await app.user.click(screen.getByRole('button', { name: /For Time/i }))

    // Verify presets are shown
    await waitFor(() => {
      expect(app.queryByText('10 min cap')).toBeTruthy()
    })
    expect(app.queryByText('15 min cap')).toBeTruthy()
    expect(app.queryByText('20 min cap')).toBeTruthy()
    expect(app.queryByText('No cap')).toBeTruthy()

    app.cleanup()
  })

  it('exits timer and returns to timer selection', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Select AMRAP and start 5 min preset
    await app.user.click(screen.getByRole('button', { name: /AMRAP/i }))
    await waitFor(() => {
      expect(app.queryByText('5 min')).toBeTruthy()
    })
    await app.user.click(screen.getByRole('button', { name: /Quick burst/i }))

    // Wait for timer UI using semantic query
    await waitFor(() => {
      expect(app.getTimerControlButton('exit')).toBeTruthy()
    })

    // Find and click exit button using semantic query
    await app.user.click(app.getTimerControlButton('exit'))

    // Should return to timer selection
    await waitFor(() => {
      expect(app.queryByText(/As Many Rounds As Possible/)).toBeTruthy()
    })

    app.cleanup()
  })

  it('starts EMOM timer and shows minute display', async () => {
    const app = await createTestApp()
    await goToTimersPage(app)

    // Select EMOM
    await app.user.click(screen.getByRole('button', { name: /EMOM/i }))

    // Select 10 min preset
    await waitFor(() => {
      expect(app.queryByText('10 min')).toBeTruthy()
    })
    await app.user.click(screen.getByRole('button', { name: /Quick session/i }))

    // Verify timer UI is shown with minute display (uppercase)
    await waitFor(() => {
      expect(app.queryByText(/MINUTE 1 OF 10/)).toBeTruthy()
    })

    app.cleanup()
  })
})
