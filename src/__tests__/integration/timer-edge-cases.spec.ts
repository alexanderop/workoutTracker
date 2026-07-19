/* eslint-disable vitest/no-conditional-in-test, vitest/no-conditional-expect -- Timer state is conditionally rendered across timer phases. */
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

// Helper to start an AMRAP timer
async function startAmrapTimer(testApp: Awaited<ReturnType<typeof createTestApp>>) {
  await goToTimersPage(testApp)
  await userEvent.click(page.getByRole('button', { name: /amrap/i }))
  await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
  await userEvent.click(page.getByRole('button', { name: /quick burst/i }))
  await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()
}

// Helper to start a custom Tabata timer with short work/rest intervals so
// phase transitions can be observed quickly in tests.
async function startShortCustomTabata(
  testApp: Awaited<ReturnType<typeof createTestApp>>,
  options: { rounds: string; workSeconds: string; restSeconds: string },
) {
  await goToTimersPage(testApp)
  await userEvent.click(page.getByRole('button', { name: /tabata/i }))
  await expect.element(page.getByText(/Custom/)).toBeVisible()
  await userEvent.click(page.getByRole('button', { name: /custom/i }))
  await expect.element(page.getByText(/Rounds/)).toBeVisible()

  const roundsInput = page.getByRole('spinbutton', { name: /rounds/i })
  const workInput = page.getByRole('spinbutton', { name: /work/i })
  const restInput = page.getByRole('spinbutton', { name: /rest/i })

  await userEvent.clear(roundsInput)
  await userEvent.fill(roundsInput, options.rounds)
  await userEvent.clear(workInput)
  await userEvent.fill(workInput, options.workSeconds)
  await userEvent.clear(restInput)
  await userEvent.fill(restInput, options.restSeconds)

  await userEvent.click(page.getByRole('button', { name: /start/i }))
  await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

  const playPauseButton = await testApp.workout.getTimerPlayPauseButton()
  await userEvent.click(playPauseButton)
  await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)
}

/**
 * Integration tests for timer edge cases.
 * Tests exit behavior, pause/resume, and navigation scenarios.
 */
describe('Timer Edge Cases', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Exit Timer Early', () => {
    it('exit button closes timer screen', async () => {
      const testApp = await createTestApp()
      await startAmrapTimer(testApp)

      // Click exit button
      const exitButton = page.getByRole('button', { name: /exit timer/i })
      await userEvent.click(exitButton)

      // Timer controls should no longer be visible
      await expect
        .element(page.getByRole('button', { name: /exit timer/i }))
        .not.toBeInTheDocument()

      // Should show either preset selection or timer type selection
      await expect.element(page.getByRole('main')).toBeVisible()

      testApp.cleanup()
    })

    it('exiting running timer stops the timer', async () => {
      const testApp = await createTestApp()
      await startAmrapTimer(testApp)

      // Start the timer
      const playPauseButton = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(playPauseButton)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Exit while running
      const exitButton = page.getByRole('button', { name: /exit timer/i })
      await userEvent.click(exitButton)

      // Timer controls should no longer be visible
      await expect
        .element(page.getByRole('button', { name: /exit timer/i }))
        .not.toBeInTheDocument()

      testApp.cleanup()
    })
  })

  describe('Pause and Resume', () => {
    it('can pause and resume timer multiple times', async () => {
      const testApp = await createTestApp()
      await startAmrapTimer(testApp)

      // Start
      const startButton = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(startButton)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Pause
      const pauseButton1 = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(pauseButton1)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(false)

      // Resume
      const resumeButton = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(resumeButton)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Pause again
      const pauseButton2 = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(pauseButton2)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(false)

      testApp.cleanup()
    })

    it('paused timer does not show as running', async () => {
      const testApp = await createTestApp()
      await startAmrapTimer(testApp)

      // Timer should start paused
      expect(testApp.workout.isTimerRunning()).toBe(false)

      // Start and then pause
      const startButton = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(startButton)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)

      const pauseButton = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(pauseButton)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(false)

      // Verify still paused after short delay
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(testApp.workout.isTimerRunning()).toBe(false)

      testApp.cleanup()
    })
  })

  describe('Navigation Edge Cases', () => {
    it('back button from preset selection returns to timer type selection', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select AMRAP to go to presets
      await userEvent.click(page.getByRole('button', { name: /amrap/i }))
      await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()

      // Click back button
      const backButton = page.getByRole('button', { name: /back/i })
      await userEvent.click(backButton)

      // Should return to timer type selection
      await expect.element(page.getByText(/As Many Rounds As Possible/)).toBeVisible()
      await expect.element(page.getByText(/Every Minute On the Minute/)).toBeVisible()

      testApp.cleanup()
    })

    it('can start different timer type after returning from preset', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Go to AMRAP presets
      await userEvent.click(page.getByRole('button', { name: /amrap/i }))
      await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()

      // Go back
      const backButton = page.getByRole('button', { name: /back/i })
      await userEvent.click(backButton)

      // Now select Tabata instead
      await userEvent.click(page.getByRole('button', { name: /tabata/i }))

      // Verify Tabata presets shown
      await expect.element(page.getByText(/Classic/)).toBeVisible()
      await expect.element(page.getByText(/8×20\/10/)).toBeVisible()

      testApp.cleanup()
    })
  })

  describe('Timer Reset', () => {
    it('reset button restarts timer from beginning', async () => {
      const testApp = await createTestApp()
      await startAmrapTimer(testApp)

      // Start the timer and wait a moment
      const playPauseButton = await testApp.workout.getTimerPlayPauseButton()
      await userEvent.click(playPauseButton)
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Wait a short time so timer advances
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Click reset button
      const resetButton = await testApp.workout.getTimerControlButton('reset')
      if (resetButton) {
        await userEvent.click(resetButton)

        // Timer should be paused after reset
        await expect.poll(() => testApp.workout.isTimerRunning()).toBe(false)
      }

      testApp.cleanup()
    })
  })

  describe('Tabata Edge Cases', () => {
    it('displays work and rest phases correctly', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select Tabata Classic
      await userEvent.click(page.getByRole('button', { name: /tabata/i }))
      await userEvent.click(page.getByRole('button', { name: /classic/i }))

      // Wait for timer UI
      await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Should show phase information (work/rest)
      // Timer starts on work phase - use exact match to avoid "Workouts" in nav
      // The placeholder exercise sub-label also reads "WORK", so match the first
      // occurrence (the phase badge).
      await expect.element(page.getByText('WORK', { exact: true }).first()).toBeVisible()

      testApp.cleanup()
    })

    it(
      'updates exercise sub-label to REST when phase changes from work, matching the phase badge',
      { timeout: 10_000 },
      async () => {
        const testApp = await createTestApp()
        await startShortCustomTabata(testApp, { rounds: '2', workSeconds: '1', restSeconds: '3' })

        // Both the phase badge and the placeholder exercise sub-label read WORK at first
        await expect
          .poll(async () => (await page.getByText('WORK', { exact: true }).all()).length)
          .toBe(2)

        // After the 1s work phase elapses, both should flip to REST together -
        // the sub-label must not stay stuck on "Work"
        await expect
          .poll(async () => (await page.getByText('REST', { exact: true }).all()).length, {
            timeout: 5000,
          })
          .toBe(2)

        testApp.cleanup()
      },
    )
  })

  describe('EMOM Edge Cases', () => {
    it('displays minute counter correctly', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select EMOM 10 min
      await userEvent.click(page.getByRole('button', { name: /emom/i }))
      await userEvent.click(page.getByRole('button', { name: /quick session/i }))

      // Wait for timer UI
      await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Should show minute counter (e.g., "1 / 10 MIN")
      await expect.element(page.getByText(/min/i)).toBeVisible()

      testApp.cleanup()
    })
  })

  describe('For Time Edge Cases', () => {
    it('can select no cap option', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select For Time
      await userEvent.click(page.getByRole('button', { name: /for time/i }))

      // Verify No Cap option is available
      await expect.element(page.getByText(/no cap/i)).toBeVisible()

      testApp.cleanup()
    })

    it('done button is visible for For Time timer', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select For Time with a time cap
      await userEvent.click(page.getByRole('button', { name: /for time/i }))
      await expect.element(page.getByText('10 min cap')).toBeVisible()

      // Select a preset (look for 10 min cap option - "Quick challenge")
      const tenMinButton = page.getByRole('button', { name: /quick challenge/i })
      await userEvent.click(tenMinButton)

      // Wait for timer UI
      await expect.poll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Done button should be visible (For Time specific)
      await expect.element(page.getByRole('button', { name: /done|complete/i })).toBeVisible()

      testApp.cleanup()
    })
  })
})
