import { page } from '../helpers/locator'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

// Helper to navigate to timers page from home
async function goToTimersPage(_testApp: Awaited<ReturnType<typeof createTestApp>>) {
  const quickTimerCard = page.getByText(/quick timer/i)
  await quickTimerCard.click()
  await expectElement(page.getByText(/AMRAP/)).toBeVisible()
}

describe('Standalone Timers Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('navigates from home to timers page via Quick Timer card', async () => {
    const { router, cleanup } = await createTestApp()

    // Find and click the Quick Timer card on home page
    const quickTimerCard = page.getByText(/quick timer/i)
    await expectElement(quickTimerCard).toBeVisible()

    await quickTimerCard.click()

    // Verify navigation to timers page
    expect(router.currentRoute.value.path).toBe('/timers')

    // Verify timer selection UI is shown
    await expectElement(page.getByText(/AMRAP/)).toBeVisible()
    await expectElement(page.getByText(/EMOM/)).toBeVisible()
    await expectElement(page.getByText(/Tabata/)).toBeVisible()
    await expectElement(page.getByText(/For Time/)).toBeVisible()

    cleanup()
  })

  it('displays all four timer type options on timers page', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Verify all timer types are shown with descriptions
    await expectElement(page.getByText(/As Many Rounds As Possible/)).toBeVisible()

    await expectElement(page.getByText(/EMOM/)).toBeVisible()
    await expectElement(page.getByText(/Every Minute On the Minute/)).toBeVisible()

    await expectElement(page.getByText(/Tabata/)).toBeVisible()
    await expectElement(page.getByText(/Work\/Rest Intervals/)).toBeVisible()

    await expectElement(page.getByText(/For Time/)).toBeVisible()
    await expectElement(page.getByText(/Race Against the Clock/)).toBeVisible()

    testApp.cleanup()
  })

  it('shows AMRAP presets when selecting AMRAP timer', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Click AMRAP button
    await page.getByRole('button', { name: /amrap/i }).click()

    // Verify presets are shown - use exact text to avoid matching "15 min"
    await expectElement(page.getByText('5 min', { exact: true })).toBeVisible()
    await expectElement(page.getByText('10 min')).toBeVisible()
    await expectElement(page.getByText('15 min')).toBeVisible()
    await expectElement(page.getByText('20 min')).toBeVisible()
    await expectElement(page.getByText(/Custom/)).toBeVisible()

    testApp.cleanup()
  })

  it('shows Tabata presets including Nordic protocol', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Click Tabata button
    await page.getByRole('button', { name: /tabata/i }).click()

    // Verify presets are shown
    await expectElement(page.getByText(/Classic/)).toBeVisible()
    await expectElement(page.getByText(/8×20\/10/)).toBeVisible()
    await expectElement(page.getByText(/Long/)).toBeVisible()
    await expectElement(page.getByText(/Short/)).toBeVisible()
    await expectElement(page.getByText(/Nordic/)).toBeVisible()
    await expectElement(page.getByText(/4×4min\/3min/)).toBeVisible()

    testApp.cleanup()
  })

  it('starts AMRAP timer from preset and shows timer UI with controls', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select AMRAP
    await page.getByRole('button', { name: /amrap/i }).click()

    // Wait for presets and select 5 min preset
    await expectElement(page.getByText('5 min', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /quick burst/i }).click()

    // Verify timer runner is shown with controls - use semantic queries with aria-labels
    await expectElement(page.getByRole('button', { name: /exit timer/i })).toBeVisible()

    // Verify rounds display exists
    await expectElement(page.getByText(/Rounds/)).toBeVisible()

    // Verify exit and reset buttons exist using semantic queries
    await expectElement(page.getByRole('button', { name: /exit timer/i })).toBeVisible()
    await expectElement(page.getByRole('button', { name: /reset timer/i })).toBeVisible()

    testApp.cleanup()
  })

  it('allows navigating back from preset selection to timer selection', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select EMOM
    await page.getByRole('button', { name: /emom/i }).click()

    // Wait for presets
    await expectElement(page.getByText('10 min', { exact: true })).toBeVisible()

    // Click back button
    await page.getByRole('button', { name: /go back/i }).click()

    // Should be back at timer selection
    await expectElement(page.getByText(/As Many Rounds As Possible/)).toBeVisible()

    testApp.cleanup()
  })

  it('shows custom configuration form for Tabata', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select Tabata
    await page.getByRole('button', { name: /tabata/i }).click()

    // Wait for presets and click Custom
    await expectElement(page.getByText(/Custom/)).toBeVisible()
    await page.getByRole('button', { name: /custom/i }).click()

    // Verify custom form fields appear
    await expectElement(page.getByText(/Rounds/)).toBeVisible()
    await expectElement(page.getByText(/Work \(seconds\)/)).toBeVisible()
    await expectElement(page.getByText(/Rest \(seconds\)/)).toBeVisible()

    // Verify Start button in form
    await expectElement(page.getByRole('button', { name: /Start/ })).toBeVisible()

    testApp.cleanup()
  })

  it('shows For Time presets including No cap option', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Click For Time button
    await page.getByRole('button', { name: /for time/i }).click()

    // Verify presets are shown
    await expectElement(page.getByText('10 min cap')).toBeVisible()
    await expectElement(page.getByText('15 min cap')).toBeVisible()
    await expectElement(page.getByText('20 min cap')).toBeVisible()
    await expectElement(page.getByText('No cap')).toBeVisible()

    testApp.cleanup()
  })

  it('exits timer and returns to timer selection', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select AMRAP and start 5 min preset
    await page.getByRole('button', { name: /amrap/i }).click()
    await expectElement(page.getByText('5 min', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /quick burst/i }).click()

    // Wait for timer UI using semantic query
    await expectPoll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

    // Find and click exit button using semantic query
    const exitButton = await testApp.workout.getTimerControlButton('exit')
    await exitButton.click()

    // Should return to timer selection
    await expectElement(page.getByText(/As Many Rounds As Possible/)).toBeVisible()

    testApp.cleanup()
  })

  it('starts EMOM timer and shows minute display', async () => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select EMOM
    await page.getByRole('button', { name: /emom/i }).click()

    // Select 10 min preset
    await expectElement(page.getByText('10 min', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /quick session/i }).click()

    // Verify timer UI is shown with minute counter (format: "1 / 10 MIN")
    await expectElement(page.getByText(/min/i)).toBeVisible()

    testApp.cleanup()
  })

  describe('Play/Pause button toggle', () => {
    it('toggles from play to pause icon when timer is started', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP and start 5 min preset
      await page.getByRole('button', { name: /amrap/i }).click()
      await expectElement(page.getByText('5 min', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: /quick burst/i }).click()

      // Wait for timer UI
      await expectPoll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Initially should show play icon (timer not running)
      expect(testApp.workout.isTimerRunning()).toBe(false)

      // Click play button
      const playPauseButton = await testApp.workout.getTimerPlayPauseButton()
      await playPauseButton.click()

      // Should now show pause icon (timer running)
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(true)

      testApp.cleanup()
    })

    it('toggles from pause to play icon when timer is paused', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select Tabata and start Classic preset
      await page.getByRole('button', { name: /tabata/i }).click()
      await expectElement(page.getByText(/Classic/)).toBeVisible()
      await page.getByRole('button', { name: /classic/i }).click()

      // Wait for timer UI
      await expectPoll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Start the timer
      const startButton = await testApp.workout.getTimerPlayPauseButton()
      await startButton.click()

      // Verify running
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Pause the timer - get fresh reference as button may have changed
      const pauseButton = await testApp.workout.getTimerPlayPauseButton()
      await pauseButton.click()

      // Should now show play icon (timer paused)
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(false)

      testApp.cleanup()
    })
  })

  describe('PageLayout header visibility', () => {
    it('shows page header with timer type on preset selection screen', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP timer type
      await page.getByRole('button', { name: /amrap/i }).click()

      // Wait for preset screen
      await expectElement(page.getByText('5 min', { exact: true })).toBeVisible()

      // Verify PageLayout header shows timer type as a heading
      // PageLayout renders title as an h1 heading element
      await expectElement(page.getByRole('heading', { name: /amrap/i, level: 1 })).toBeVisible()

      testApp.cleanup()
    })

    it('shows page header with timer type on running timer screen', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP and start timer
      await page.getByRole('button', { name: /amrap/i }).click()
      await expectElement(page.getByText('5 min', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: /quick burst/i }).click()

      // Wait for timer UI
      await expectElement(page.getByRole('button', { name: /exit timer/i })).toBeVisible()

      // Verify PageLayout header shows timer type as a heading
      await expectElement(page.getByRole('heading', { name: /amrap/i, level: 1 })).toBeVisible()

      testApp.cleanup()
    })

    it('shows page header with timer type on running EMOM timer screen', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select EMOM and start timer
      await page.getByRole('button', { name: /emom/i }).click()
      await expectElement(page.getByText('10 min', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: /quick session/i }).click()

      // Wait for timer UI
      await expectElement(page.getByRole('button', { name: /exit timer/i })).toBeVisible()

      // Verify PageLayout header shows timer type as a heading
      await expectElement(page.getByRole('heading', { name: /emom/i, level: 1 })).toBeVisible()

      testApp.cleanup()
    })
  })
})
