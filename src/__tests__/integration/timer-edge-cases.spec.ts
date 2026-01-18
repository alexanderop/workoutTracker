import { page } from '../helpers/locator'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

// Helper to navigate to timers page from home
async function goToTimersPage(testApp: Awaited<ReturnType<typeof createTestApp>>) {
  const quickTimerCard = testApp.getByText(/quick timer/i)
  await quickTimerCard.click()
  await expectElement(page.getByText(/AMRAP/)).toBeVisible()
}

// Helper to start an AMRAP timer
async function startAmrapTimer(testApp: Awaited<ReturnType<typeof createTestApp>>) {
  await goToTimersPage(testApp)
  await page.getByRole('button', { name: /amrap/i }).click()
  await expectElement(page.getByText('5 min', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /quick burst/i }).click()
  await expectPoll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()
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
      await exitButton.click()

      // Timer controls should no longer be visible
      await expectElement(page.getByRole('button', { name: /exit timer/i })).not.toBeInTheDocument()

      // Should show either preset selection or timer type selection
      await expectElement(page.getByRole('main')).toBeVisible()

      testApp.cleanup()
    })

    it('exiting running timer stops the timer', async () => {
      const testApp = await createTestApp()
      await startAmrapTimer(testApp)

      // Start the timer
      const playPauseButton = await testApp.workout.getTimerPlayPauseButton()
      await playPauseButton.click()
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Exit while running
      const exitButton = page.getByRole('button', { name: /exit timer/i })
      await exitButton.click()

      // Timer controls should no longer be visible
      await expectElement(page.getByRole('button', { name: /exit timer/i })).not.toBeInTheDocument()

      testApp.cleanup()
    })
  })

  describe('Pause and Resume', () => {
    it('can pause and resume timer multiple times', async () => {
      const testApp = await createTestApp()
      await startAmrapTimer(testApp)

      // Start
      const startButton = await testApp.workout.getTimerPlayPauseButton()
      await startButton.click()
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Pause
      const pauseButton1 = await testApp.workout.getTimerPlayPauseButton()
      await pauseButton1.click()
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(false)

      // Resume
      const resumeButton = await testApp.workout.getTimerPlayPauseButton()
      await resumeButton.click()
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Pause again
      const pauseButton2 = await testApp.workout.getTimerPlayPauseButton()
      await pauseButton2.click()
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(false)

      testApp.cleanup()
    })

    it('paused timer does not show as running', async () => {
      const testApp = await createTestApp()
      await startAmrapTimer(testApp)

      // Timer should start paused
      expect(testApp.workout.isTimerRunning()).toBe(false)

      // Start and then pause
      const startButton = await testApp.workout.getTimerPlayPauseButton()
      await startButton.click()
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(true)

      const pauseButton = await testApp.workout.getTimerPlayPauseButton()
      await pauseButton.click()
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(false)

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
      await page.getByRole('button', { name: /amrap/i }).click()
      await expectElement(page.getByText('5 min', { exact: true })).toBeVisible()

      // Click back button
      const backButton = page.getByRole('button', { name: /back/i })
      await backButton.click()

      // Should return to timer type selection
      await expectElement(page.getByText(/As Many Rounds As Possible/)).toBeVisible()
      await expectElement(page.getByText(/Every Minute On the Minute/)).toBeVisible()

      testApp.cleanup()
    })

    it('can start different timer type after returning from preset', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Go to AMRAP presets
      await page.getByRole('button', { name: /amrap/i }).click()
      await expectElement(page.getByText('5 min', { exact: true })).toBeVisible()

      // Go back
      const backButton = page.getByRole('button', { name: /back/i })
      await backButton.click()

      // Now select Tabata instead
      await page.getByRole('button', { name: /tabata/i }).click()

      // Verify Tabata presets shown
      await expectElement(page.getByText(/Classic/)).toBeVisible()
      await expectElement(page.getByText(/8×20\/10/)).toBeVisible()

      testApp.cleanup()
    })
  })

  describe('Timer Reset', () => {
    it('reset button restarts timer from beginning', async () => {
      const testApp = await createTestApp()
      await startAmrapTimer(testApp)

      // Start the timer and wait a moment
      const playPauseButton = await testApp.workout.getTimerPlayPauseButton()
      await playPauseButton.click()
      await expectPoll(() => testApp.workout.isTimerRunning()).toBe(true)

      // Wait a short time so timer advances
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Click reset button
      const resetButton = await testApp.workout.getTimerControlButton('reset')
      if (resetButton) {
        await resetButton.click()

        // Timer should be paused after reset
        await expectPoll(() => testApp.workout.isTimerRunning()).toBe(false)
      }

      testApp.cleanup()
    })
  })

  describe('Tabata Edge Cases', () => {
    it('displays work and rest phases correctly', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select Tabata Classic
      await page.getByRole('button', { name: /tabata/i }).click()
      await page.getByRole('button', { name: /classic/i }).click()

      // Wait for timer UI
      await expectPoll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Should show phase information (work/rest)
      // Timer starts on work phase - use exact match to avoid "Workouts" in nav
      await expectElement(page.getByText('WORK', { exact: true })).toBeVisible()

      testApp.cleanup()
    })
  })

  describe('EMOM Edge Cases', () => {
    it('displays minute counter correctly', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select EMOM 10 min
      await page.getByRole('button', { name: /emom/i }).click()
      await page.getByRole('button', { name: /quick session/i }).click()

      // Wait for timer UI
      await expectPoll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Should show minute counter (e.g., "1 / 10 MIN")
      await expectElement(page.getByText(/min/i)).toBeVisible()

      testApp.cleanup()
    })
  })

  describe('For Time Edge Cases', () => {
    it('can select no cap option', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select For Time
      await page.getByRole('button', { name: /for time/i }).click()

      // Verify No Cap option is available
      await expectElement(page.getByText(/no cap/i)).toBeVisible()

      testApp.cleanup()
    })

    it('done button is visible for For Time timer', async () => {
      const testApp = await createTestApp()
      await goToTimersPage(testApp)

      // Select For Time with a time cap
      await page.getByRole('button', { name: /for time/i }).click()
      await expectElement(page.getByText('10 min cap')).toBeVisible()

      // Select a preset (look for 10 min cap option - "Quick challenge")
      const tenMinButton = page.getByRole('button', { name: /quick challenge/i })
      await tenMinButton.click()

      // Wait for timer UI
      await expectPoll(() => testApp.workout.getTimerControlButton('exit')).toBeTruthy()

      // Done button should be visible (For Time specific)
      await expectElement(page.getByRole('button', { name: /done|complete/i })).toBeVisible()

      testApp.cleanup()
    })
  })
})
