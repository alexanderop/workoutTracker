import { screen } from '@testing-library/vue'
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

// Helper to navigate to timers page from home
async function goToTimersPage(testApp: Awaited<ReturnType<typeof createTestApp>>) {
  const quickTimerCard = testApp.getByText(/quick timer/i)
  await userEvent.click(quickTimerCard)
  await expect.element(page.getByText(/AMRAP/)).toBeVisible()
}

describe('Standalone Timers Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('navigates from home to timers page via Quick Timer card', async () => {
    const { getByText, queryByText, router, cleanup } = await createTestApp()

    // Find and click the Quick Timer card on home page
    const quickTimerCard = getByText(/quick timer/i)
    expect(quickTimerCard).toBeTruthy()

    await userEvent.click(quickTimerCard)

    // Verify navigation to timers page
    expect(router.currentRoute.value.path).toBe('/timers')

    // Verify timer selection UI is shown
    await expect.element(page.getByText(/AMRAP/)).toBeVisible()
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
    await userEvent.click(screen.getByRole('button', { name: /AMRAP/i }))

    // Verify presets are shown - use exact text to avoid matching "15 min"
    await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
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
    await userEvent.click(screen.getByRole('button', { name: /Tabata/i }))

    // Verify presets are shown
    await expect.element(page.getByText(/Classic/)).toBeVisible()
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
    await userEvent.click(screen.getByRole('button', { name: /AMRAP/i }))

    // Wait for presets and select 5 min preset
    await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: /Quick burst/i }))

    // Verify timer runner is shown with controls - use semantic queries with aria-labels
    await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

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
    await userEvent.click(screen.getByRole('button', { name: /EMOM/i }))

    // Wait for presets
    await expect.element(page.getByText('10 min', { exact: true })).toBeVisible()

    // Click back button
    await userEvent.click(screen.getByRole('button', { name: /go back/i }))

    // Should be back at timer selection
    await expect.element(page.getByText(/As Many Rounds As Possible/)).toBeVisible()

    testApp.cleanup()
  })

  it('shows custom configuration form for Tabata', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select Tabata
    await userEvent.click(screen.getByRole('button', { name: /Tabata/i }))

    // Wait for presets and click Custom
    await expect.element(page.getByText(/Custom/)).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: /Custom/i }))

    // Verify custom form fields appear
    await expect.element(page.getByText(/Rounds/)).toBeVisible()
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
    await userEvent.click(screen.getByRole('button', { name: /For Time/i }))

    // Verify presets are shown
    await expect.element(page.getByText('10 min cap')).toBeVisible()
    expect(testApp.queryByText('15 min cap')).toBeTruthy()
    expect(testApp.queryByText('20 min cap')).toBeTruthy()
    expect(testApp.queryByText('No cap')).toBeTruthy()

    testApp.cleanup()
  })

  it('exits timer and returns to timer selection', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select AMRAP and start 5 min preset
    await userEvent.click(screen.getByRole('button', { name: /AMRAP/i }))
    await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: /Quick burst/i }))

    // Wait for timer UI using semantic query
    await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

    // Find and click exit button using semantic query
    await userEvent.click(testApp.workout.getTimerControlButton('exit'))

    // Should return to timer selection
    await expect.element(page.getByText(/As Many Rounds As Possible/)).toBeVisible()

    testApp.cleanup()
  })

  it('starts EMOM timer and shows minute display', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select EMOM
    await userEvent.click(screen.getByRole('button', { name: /EMOM/i }))

    // Select 10 min preset
    await expect.element(page.getByText('10 min', { exact: true })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: /Quick session/i }))

    // Verify timer UI is shown with minute counter (format: "1 / 10 MIN")
    await expect.element(page.getByText(/min/i)).toBeVisible()

    testApp.cleanup()
  })

  describe('Play/Pause button toggle', () => {
    it('toggles from play to pause icon when timer is started', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP and start 5 min preset
      await userEvent.click(screen.getByRole('button', { name: /AMRAP/i }))
      await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
      await userEvent.click(screen.getByRole('button', { name: /Quick burst/i }))

      // Wait for timer UI
      await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Initially should show play icon (timer not running)
      expect(testApp.workout.isTimerRunning()).toBe(false)

      // Click play button
      const playPauseBtn = testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(playPauseBtn)

      // Should now show pause icon (timer running)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)

      testApp.cleanup()
    })

    it('toggles from pause to play icon when timer is paused', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select Tabata and start Classic preset
      await userEvent.click(screen.getByRole('button', { name: /Tabata/i }))
      await expect.element(page.getByText(/Classic/)).toBeVisible()
      await userEvent.click(screen.getByRole('button', { name: /Classic/i }))

      // Wait for timer UI
      await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Start the timer
      const playPauseBtn = testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(playPauseBtn)

      // Verify running
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Pause the timer
      await userEvent.click(playPauseBtn)

      // Should now show play icon (timer paused)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(false)

      testApp.cleanup()
    })
  })

  describe('PageLayout header visibility', () => {
    it('shows page header with timer type on preset selection screen', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP timer type
      await userEvent.click(screen.getByRole('button', { name: /AMRAP/i }))

      // Wait for preset screen
      await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()

      // Verify PageLayout header shows timer type as a heading
      // PageLayout renders title as an h1 heading element
      expect(testApp.queryByRole('heading', { name: /AMRAP/i, level: 1 })).toBeTruthy()

      testApp.cleanup()
    })

    it('shows page header with timer type on running timer screen', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP and start timer
      await userEvent.click(screen.getByRole('button', { name: /AMRAP/i }))
      await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
      await userEvent.click(screen.getByRole('button', { name: /Quick burst/i }))

      // Wait for timer UI
      await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Verify PageLayout header shows timer type as a heading
      expect(testApp.queryByRole('heading', { name: /AMRAP/i, level: 1 })).toBeTruthy()

      testApp.cleanup()
    })

    it('shows page header with timer type on running EMOM timer screen', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select EMOM and start timer
      await userEvent.click(screen.getByRole('button', { name: /EMOM/i }))
      await expect.element(page.getByText('10 min', { exact: true })).toBeVisible()
      await userEvent.click(screen.getByRole('button', { name: /Quick session/i }))

      // Wait for timer UI
      await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Verify PageLayout header shows timer type as a heading
      expect(testApp.queryByRole('heading', { name: /EMOM/i, level: 1 })).toBeTruthy()

      testApp.cleanup()
    })
  })
})
