import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import type { TestApp } from '../helpers/createTestApp'

// Helper to navigate to timers page from home
async function goToTimersPage(testApp: TestApp) {
  const quickTimerCard = testApp.getByText(/quick timer/i)
  await userEvent.click(quickTimerCard)
  await expect.element(page.getByText(/AMRAP/)).toBeVisible()
}

describe('Standalone Timers Flow', () => {
  it('navigates from home to timers page via Quick Timer card', async ({ createTestApp }) => {
    const { router } = await createTestApp()

    // Find and click the Quick Timer card on home page
    const quickTimerCard = page.getByText(/quick timer/i)
    await expect.element(quickTimerCard).toBeVisible()

    await userEvent.click(quickTimerCard)

    // Verify navigation to timers page
    expect(router.currentRoute.value.path).toBe('/timers')

    // Verify timer selection UI is shown
    await expect.element(page.getByText(/AMRAP/)).toBeVisible()
    await expect.element(page.getByText(/EMOM/)).toBeVisible()
    await expect.element(page.getByText(/Tabata/)).toBeVisible()
    await expect.element(page.getByText(/For Time/)).toBeVisible()
  })

  it('displays all four timer type options on timers page', async ({ createTestApp }) => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Verify all timer types are shown with descriptions
    await expect.element(page.getByText(/As Many Rounds As Possible/)).toBeVisible()

    await expect.element(page.getByText(/EMOM/)).toBeVisible()
    await expect.element(page.getByText(/Every Minute On the Minute/)).toBeVisible()

    await expect.element(page.getByText(/Tabata/)).toBeVisible()
    await expect.element(page.getByText(/Work\/Rest Intervals/)).toBeVisible()

    await expect.element(page.getByText(/For Time/)).toBeVisible()
    await expect.element(page.getByText(/Race Against the Clock/)).toBeVisible()
  })

  it('shows AMRAP presets when selecting AMRAP timer', async ({ createTestApp }) => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Click AMRAP button
    await userEvent.click(page.getByRole('button', { name: /amrap/i }))

    // Verify presets are shown - use exact text to avoid matching "15 min"
    await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
    await expect.element(page.getByText('10 min')).toBeVisible()
    await expect.element(page.getByText('15 min')).toBeVisible()
    await expect.element(page.getByText('20 min')).toBeVisible()
    await expect.element(page.getByText(/Custom/)).toBeVisible()
  })

  it('shows Tabata presets including Nordic protocol', async ({ createTestApp }) => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Click Tabata button
    await userEvent.click(page.getByRole('button', { name: /tabata/i }))

    // Verify presets are shown
    await expect.element(page.getByText(/Classic/)).toBeVisible()
    await expect.element(page.getByText(/8×20\/10/)).toBeVisible()
    await expect.element(page.getByText(/Long/)).toBeVisible()
    await expect.element(page.getByText(/Short/)).toBeVisible()
    await expect.element(page.getByText(/Nordic/)).toBeVisible()
    await expect.element(page.getByText(/4×4min\/3min/)).toBeVisible()
  })

  it('starts AMRAP timer from preset and shows timer UI with controls', async ({
    createTestApp,
  }) => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select AMRAP
    await userEvent.click(page.getByRole('button', { name: /amrap/i }))

    // Wait for presets and select 5 min preset
    await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: /quick burst/i }))

    // Verify timer runner is shown with controls - use semantic queries with aria-labels
    await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()

    // Verify rounds display exists
    await expect.element(page.getByText(/Rounds/)).toBeVisible()

    // Verify exit and reset buttons exist using semantic queries
    await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()
    await expect.element(page.getByRole('button', { name: /reset timer/i })).toBeVisible()
  })

  it('allows navigating back from preset selection to timer selection', async ({
    createTestApp,
  }) => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select EMOM
    await userEvent.click(page.getByRole('button', { name: /emom/i }))

    // Wait for presets
    await expect.element(page.getByText('10 min', { exact: true })).toBeVisible()

    // Click back button
    await userEvent.click(page.getByRole('button', { name: /go back/i }))

    // Should be back at timer selection
    await expect.element(page.getByText(/As Many Rounds As Possible/)).toBeVisible()
  })

  it('shows custom configuration form for Tabata', async ({ createTestApp }) => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select Tabata
    await userEvent.click(page.getByRole('button', { name: /tabata/i }))

    // Wait for presets and click Custom
    await expect.element(page.getByText(/Custom/)).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: /custom/i }))

    // Verify custom form fields appear
    await expect.element(page.getByText(/Rounds/)).toBeVisible()
    await expect.element(page.getByText(/Work \(seconds\)/)).toBeVisible()
    await expect.element(page.getByText(/Rest \(seconds\)/)).toBeVisible()

    // Verify Start button in form
    await expect.element(page.getByRole('button', { name: /Start/ })).toBeVisible()
  })

  it('shows For Time presets including No cap option', async ({ createTestApp }) => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Click For Time button
    await userEvent.click(page.getByRole('button', { name: /for time/i }))

    // Verify presets are shown
    await expect.element(page.getByText('10 min cap')).toBeVisible()
    await expect.element(page.getByText('15 min cap')).toBeVisible()
    await expect.element(page.getByText('20 min cap')).toBeVisible()
    await expect.element(page.getByText('No cap')).toBeVisible()
  })

  it('exits timer and returns to timer selection', async ({ createTestApp }) => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select AMRAP and start 5 min preset
    await userEvent.click(page.getByRole('button', { name: /amrap/i }))
    await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: /quick burst/i }))

    // Wait for timer UI using semantic query
    await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

    // Find and click exit button using semantic query
    await userEvent.click(await testApp.workout.getTimerControlButton('exit'))

    // Should return to timer selection
    await expect.element(page.getByText(/As Many Rounds As Possible/)).toBeVisible()
  })

  it('starts EMOM timer and shows minute display', async ({ createTestApp }) => {
    const testApp = await createTestApp()
    await goToTimersPage(testApp)

    // Select EMOM
    await userEvent.click(page.getByRole('button', { name: /emom/i }))

    // Select 10 min preset
    await expect.element(page.getByText('10 min', { exact: true })).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: /quick session/i }))

    // Verify timer UI is shown with minute counter (format: "1 / 10 MIN")
    await expect.element(page.getByText(/min/i)).toBeVisible()
  })

  describe('Play/Pause button toggle', () => {
    it('toggles from play to pause icon when timer is started', async ({ createTestApp }) => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP and start 5 min preset
      await userEvent.click(page.getByRole('button', { name: /amrap/i }))
      await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /quick burst/i }))

      // Wait for timer UI
      await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Initially should show play icon (timer not running)
      expect(testApp.workout.isTimerRunning()).toBe(false)

      // Click play button
      const playPauseButton = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(playPauseButton)

      // Should now show pause icon (timer running)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)
    })

    it('toggles from pause to play icon when timer is paused', async ({ createTestApp }) => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select Tabata and start Classic preset
      await userEvent.click(page.getByRole('button', { name: /tabata/i }))
      await expect.element(page.getByText(/Classic/)).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /classic/i }))

      // Wait for timer UI
      await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Start the timer
      const startButton = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(startButton)

      // Verify running
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Pause the timer - get fresh reference as button may have changed
      const pauseButton = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(pauseButton)

      // Should now show play icon (timer paused)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(false)
    })
  })

  describe('PageLayout header visibility', () => {
    it('shows page header with timer type on preset selection screen', async ({
      createTestApp,
    }) => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP timer type
      await userEvent.click(page.getByRole('button', { name: /amrap/i }))

      // Wait for preset screen
      await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()

      // Verify PageLayout header shows timer type as a heading
      // PageLayout renders title as an h1 heading element
      await expect.element(page.getByRole('heading', { name: /amrap/i, level: 1 })).toBeVisible()
    })

    it('shows page header with timer type on running timer screen', async ({ createTestApp }) => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP and start timer
      await userEvent.click(page.getByRole('button', { name: /amrap/i }))
      await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /quick burst/i }))

      // Wait for timer UI
      await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()

      // Verify PageLayout header shows timer type as a heading
      await expect.element(page.getByRole('heading', { name: /amrap/i, level: 1 })).toBeVisible()
    })

    it('shows page header with timer type on running EMOM timer screen', async ({
      createTestApp,
    }) => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select EMOM and start timer
      await userEvent.click(page.getByRole('button', { name: /emom/i }))
      await expect.element(page.getByText('10 min', { exact: true })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /quick session/i }))

      // Wait for timer UI
      await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()

      // Verify PageLayout header shows timer type as a heading
      await expect.element(page.getByRole('heading', { name: /emom/i, level: 1 })).toBeVisible()
    })
  })
})
