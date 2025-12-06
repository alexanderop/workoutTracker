import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

// Helper to navigate to timers page from home
async function goToTimersPage(testApp: Awaited<ReturnType<typeof createTestApp>>) {
  const quickTimerCard = testApp.getByText(/quick timer/i)
  await testApp.user.click(quickTimerCard)
  await waitFor(() => {
    expect(testApp.queryByText(/AMRAP/)).toBeTruthy()
  })
}

describe('Standalone Timers Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('navigates from home to timers page via Quick Timer card', async () => {
    const { user, getByText, queryByText, router, cleanup } = await createTestApp()

    // Find and click the Quick Timer card on home page
    const quickTimerCard = getByText(/quick timer/i)
    expect(quickTimerCard).toBeTruthy()

    await user.click(quickTimerCard)

    // Verify navigation to timers page
    expect(router.currentRoute.value.path).toBe('/timers')

    // Verify timer selection UI is shown
    await waitFor(() => {
      expect(queryByText(/AMRAP/)).toBeTruthy()
    })
    expect(queryByText(/EMOM/)).toBeTruthy()
    expect(queryByText(/Tabata/)).toBeTruthy()
    expect(queryByText(/For Time/)).toBeTruthy()

    cleanup()
  })

  it('displays all four timer type options on timers page', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Verify all timer types are shown with descriptions
    expect(testApp.queryByText(/As Many Rounds As Possible/)).toBeTruthy()

    expect(testApp.queryByText(/EMOM/)).toBeTruthy()
    expect(testApp.queryByText(/Every Minute On the Minute/)).toBeTruthy()

    expect(testApp.queryByText(/Tabata/)).toBeTruthy()
    expect(testApp.queryByText(/Work\/Rest Intervals/)).toBeTruthy()

    expect(testApp.queryByText(/For Time/)).toBeTruthy()
    expect(testApp.queryByText(/Race Against the Clock/)).toBeTruthy()

    testApp.cleanup()
  })

  it('shows AMRAP presets when selecting AMRAP timer', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Click AMRAP button
    await testApp.user.click(screen.getByRole('button', { name: /AMRAP/i }))

    // Verify presets are shown - use exact text to avoid matching "15 min"
    await waitFor(() => {
      expect(testApp.queryByText('5 min')).toBeTruthy()
    })
    expect(testApp.queryByText('10 min')).toBeTruthy()
    expect(testApp.queryByText('15 min')).toBeTruthy()
    expect(testApp.queryByText('20 min')).toBeTruthy()
    expect(testApp.queryByText(/Custom/)).toBeTruthy()

    testApp.cleanup()
  })

  it('shows Tabata presets including Nordic protocol', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Click Tabata button
    await testApp.user.click(screen.getByRole('button', { name: /Tabata/i }))

    // Verify presets are shown
    await waitFor(() => {
      expect(testApp.queryByText(/Classic/)).toBeTruthy()
    })
    expect(testApp.queryByText(/8×20\/10/)).toBeTruthy()
    expect(testApp.queryByText(/Long/)).toBeTruthy()
    expect(testApp.queryByText(/Short/)).toBeTruthy()
    expect(testApp.queryByText(/Nordic/)).toBeTruthy()
    expect(testApp.queryByText(/4×4min\/3min/)).toBeTruthy()

    testApp.cleanup()
  })

  it('starts AMRAP timer from preset and shows timer UI with controls', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select AMRAP
    await testApp.user.click(screen.getByRole('button', { name: /AMRAP/i }))

    // Wait for presets and select 5 min preset
    await waitFor(() => {
      expect(testApp.queryByText('5 min')).toBeTruthy()
    })
    await testApp.user.click(screen.getByRole('button', { name: /Quick burst/i }))

    // Verify timer runner is shown with controls - use semantic queries with aria-labels
    await waitFor(() => {
      expect(testApp.workout.getTimerControlButton('exit')).toBeTruthy()
    })

    // Verify rounds display exists
    expect(testApp.queryByText(/Rounds/)).toBeTruthy()

    // Verify exit and reset buttons exist using semantic queries
    expect(testApp.workout.getTimerControlButton('exit')).toBeTruthy()
    expect(testApp.workout.getTimerControlButton('reset')).toBeTruthy()

    testApp.cleanup()
  })

  it('allows navigating back from preset selection to timer selection', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select EMOM
    await testApp.user.click(screen.getByRole('button', { name: /EMOM/i }))

    // Wait for presets
    await waitFor(() => {
      expect(testApp.queryByText('10 min')).toBeTruthy()
    })

    // Click back button
    await testApp.user.click(screen.getByRole('button', { name: /go back/i }))

    // Should be back at timer selection
    await waitFor(() => {
      expect(testApp.queryByText(/As Many Rounds As Possible/)).toBeTruthy()
    })

    testApp.cleanup()
  })

  it('shows custom configuration form for Tabata', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select Tabata
    await testApp.user.click(screen.getByRole('button', { name: /Tabata/i }))

    // Wait for presets and click Custom
    await waitFor(() => {
      expect(testApp.queryByText(/Custom/)).toBeTruthy()
    })
    await testApp.user.click(screen.getByRole('button', { name: /Custom/i }))

    // Verify custom form fields appear
    await waitFor(() => {
      expect(testApp.queryByText(/Rounds/)).toBeTruthy()
    })
    expect(testApp.queryByText(/Work \(seconds\)/)).toBeTruthy()
    expect(testApp.queryByText(/Rest \(seconds\)/)).toBeTruthy()

    // Verify Start button in form
    expect(testApp.queryByRole('button', { name: /Start/ })).toBeTruthy()

    testApp.cleanup()
  })

  it('shows For Time presets including No cap option', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Click For Time button
    await testApp.user.click(screen.getByRole('button', { name: /For Time/i }))

    // Verify presets are shown
    await waitFor(() => {
      expect(testApp.queryByText('10 min cap')).toBeTruthy()
    })
    expect(testApp.queryByText('15 min cap')).toBeTruthy()
    expect(testApp.queryByText('20 min cap')).toBeTruthy()
    expect(testApp.queryByText('No cap')).toBeTruthy()

    testApp.cleanup()
  })

  it('exits timer and returns to timer selection', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select AMRAP and start 5 min preset
    await testApp.user.click(screen.getByRole('button', { name: /AMRAP/i }))
    await waitFor(() => {
      expect(testApp.queryByText('5 min')).toBeTruthy()
    })
    await testApp.user.click(screen.getByRole('button', { name: /Quick burst/i }))

    // Wait for timer UI using semantic query
    await waitFor(() => {
      expect(testApp.workout.getTimerControlButton('exit')).toBeTruthy()
    })

    // Find and click exit button using semantic query
    await testApp.user.click(testApp.workout.getTimerControlButton('exit'))

    // Should return to timer selection
    await waitFor(() => {
      expect(testApp.queryByText(/As Many Rounds As Possible/)).toBeTruthy()
    })

    testApp.cleanup()
  })

  it('starts EMOM timer and shows minute display', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select EMOM
    await testApp.user.click(screen.getByRole('button', { name: /EMOM/i }))

    // Select 10 min preset
    await waitFor(() => {
      expect(testApp.queryByText('10 min')).toBeTruthy()
    })
    await testApp.user.click(screen.getByRole('button', { name: /Quick session/i }))

    // Verify timer UI is shown with minute display (uppercase)
    await waitFor(() => {
      expect(testApp.queryByText(/MINUTE 1 OF 10/)).toBeTruthy()
    })

    testApp.cleanup()
  })

  describe('PageLayout header visibility', () => {
    it('shows page header with timer type on preset selection screen', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP timer type
      await testApp.user.click(screen.getByRole('button', { name: /AMRAP/i }))

      // Wait for preset screen
      await waitFor(() => {
        expect(testApp.queryByText('5 min')).toBeTruthy()
      })

      // Verify PageLayout header shows timer type as a heading
      // PageLayout renders title as an h1 heading element
      expect(testApp.queryByRole('heading', { name: /AMRAP/i, level: 1 })).toBeTruthy()

      testApp.cleanup()
    })

    it('shows page header with timer type on running timer screen', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP and start timer
      await testApp.user.click(screen.getByRole('button', { name: /AMRAP/i }))
      await waitFor(() => {
        expect(testApp.queryByText('5 min')).toBeTruthy()
      })
      await testApp.user.click(screen.getByRole('button', { name: /Quick burst/i }))

      // Wait for timer UI
      await waitFor(() => {
        expect(testApp.workout.getTimerControlButton('exit')).toBeTruthy()
      })

      // Verify PageLayout header shows timer type as a heading
      expect(testApp.queryByRole('heading', { name: /AMRAP/i, level: 1 })).toBeTruthy()

      testApp.cleanup()
    })

    it('shows page header with timer type on running EMOM timer screen', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select EMOM and start timer
      await testApp.user.click(screen.getByRole('button', { name: /EMOM/i }))
      await waitFor(() => {
        expect(testApp.queryByText('10 min')).toBeTruthy()
      })
      await testApp.user.click(screen.getByRole('button', { name: /Quick session/i }))

      // Wait for timer UI
      await waitFor(() => {
        expect(testApp.workout.getTimerControlButton('exit')).toBeTruthy()
      })

      // Verify PageLayout header shows timer type as a heading
      expect(testApp.queryByRole('heading', { name: /EMOM/i, level: 1 })).toBeTruthy()

      testApp.cleanup()
    })
  })
})
