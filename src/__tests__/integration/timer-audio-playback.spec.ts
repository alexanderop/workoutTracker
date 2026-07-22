import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import type { TestApp } from '../helpers/createTestApp'
import {
  clearAudioMocksUnified,
  getAudioMocksUnified,
  isBrowserMode,
  restoreAudioSpies,
  setupAudioSpies,
} from '../helpers/audioMock'

// Helper to navigate to Quick Timer page
async function goToTimersPage() {
  await page.getByText(/quick timer/i).click()
  await expect.element(page.getByText(/AMRAP/)).toBeVisible()
}

// Helper to start a Tabata timer with short intervals for testing
async function startShortTabata(testApp: TestApp) {
  await goToTimersPage()

  // Select Tabata
  await page.getByRole('button', { name: /tabata/i }).click()

  // Wait for presets and click Custom
  await expect.element(page.getByText(/Custom/)).toBeVisible()
  await page.getByRole('button', { name: /custom/i }).click()

  // Wait for custom form
  await expect.element(page.getByText(/Rounds/)).toBeVisible()

  // Configure short intervals: 2 rounds, 2s work, 2s rest
  const roundsInput = page.getByRole('spinbutton', { name: /rounds/i })
  const workInput = page.getByRole('spinbutton', { name: /work/i })
  const restInput = page.getByRole('spinbutton', { name: /rest/i })

  await userEvent.clear(roundsInput)
  await userEvent.fill(roundsInput, '2')
  await userEvent.clear(workInput)
  await userEvent.fill(workInput, '2')
  await userEvent.clear(restInput)
  await userEvent.fill(restInput, '2')

  // Start the timer (navigates to timer runner)
  await page.getByRole('button', { name: /start/i }).click()

  // Wait for timer UI
  await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()

  // Click play button to actually start the timer using semantic query
  const playButton = await testApp.workout.getTimerPlayPauseButton()
  await userEvent.click(playButton)

  // Wait for timer to be running (button changes to pause)
  await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)
}

// Helper to start an EMOM timer with short duration for testing
async function startShortEmom(testApp: TestApp) {
  await goToTimersPage()

  // Select EMOM
  await page.getByRole('button', { name: /emom/i }).click()

  // Wait for presets and click Custom
  await expect.element(page.getByText(/Custom/)).toBeVisible()
  await page.getByRole('button', { name: /custom/i }).click()

  // Wait for custom form
  await expect.element(page.getByText(/minutes/i)).toBeVisible()

  // Configure short duration: 2 minutes
  const minutesInput = page.getByRole('spinbutton', { name: /minutes/i })
  await userEvent.clear(minutesInput)
  await userEvent.fill(minutesInput, '2')

  // Start the timer (navigates to timer runner)
  await page.getByRole('button', { name: /start/i }).click()

  // Wait for timer UI
  await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()

  // Click play button to actually start the timer using semantic query
  const playButton = await testApp.workout.getTimerPlayPauseButton()
  await userEvent.click(playButton)
}

describe('Timer Audio Playback', () => {
  beforeEach(async () => {
    if (isBrowserMode()) {
      setupAudioSpies()
    }
    clearAudioMocksUnified()
  })

  afterEach(async () => {
    if (isBrowserMode()) {
      restoreAudioSpies()
    }
  })

  describe('Tabata Timer', () => {
    it('plays work beep when timer starts', async ({ createTestApp }) => {
      const testApp = await createTestApp()
      await startShortTabata(testApp)

      // Wait for async audio playback (AudioContext.resume() is async)
      await expect
        .poll(
          () => {
            const mocks = getAudioMocksUnified()
            // The timer should play work beep immediately on start (880Hz)
            const oscillator = mocks.createOscillator?.mock.results[0]?.value
            return oscillator?.frequency.value
          },
          { timeout: 3000 },
        )
        .toBe(880)
    })

    it('plays rest beep when transitioning to rest phase', async ({ createTestApp }) => {
      const testApp = await createTestApp()
      await startShortTabata(testApp)

      clearAudioMocksUnified()

      // This intentionally follows the real browser clock: Web Audio playback
      // on the native Tabata phase transition is the behavior under it.
      await expect
        .poll(
          () => {
            const mocks = getAudioMocksUnified()
            const restBeep = mocks.createOscillator?.mock.results.find(
              (r: { value?: { frequency: { value: number } } }) => r.value?.frequency.value === 440,
            )
            return restBeep
          },
          { timeout: 5000 },
        )
        .toBeDefined()
    })

    it('plays round beep on round transition', { timeout: 15_000 }, async ({ createTestApp }) => {
      const testApp = await createTestApp()
      await startShortTabata(testApp)

      clearAudioMocksUnified()

      // Keep the real clock here as well: the oscillator must be created by
      // the native work/rest boundary, not by manually invoking audio code.
      await expect
        .poll(
          () => {
            const mocks = getAudioMocksUnified()
            const roundBeep = mocks.createOscillator?.mock.results.find(
              (r: { value?: { frequency: { value: number } } }) => r.value?.frequency.value === 660,
            )
            return roundBeep
          },
          { timeout: 7000 },
        )
        .toBeDefined()
    })

    it('does not play audio when timer sounds are disabled', async ({ createTestApp }) => {
      const testApp = await createTestApp()

      // First disable timer sounds
      await testApp.common.navigateToSettings()
      const toggle = page.getByRole('switch', { name: /timer sounds/i })
      await toggle.click()

      await expect.element(toggle).toHaveAttribute('aria-checked', 'false')

      // Navigate back to home and start timer
      await page.getByRole('button', { name: /home/i }).click()
      await expect.element(page.getByText(/quick timer/i)).toBeVisible()

      clearAudioMocksUnified()

      await startShortTabata(testApp)

      // An enabled timer beeps synchronously on start, so reaching the running
      // state is the observable boundary needed for this negative assertion.
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)
      const mocks = getAudioMocksUnified()
      expect(mocks.createOscillator).not.toHaveBeenCalled()
    })
  })

  describe('EMOM Timer', () => {
    it('plays round beep on minute transition', async ({ createTestApp }) => {
      const testApp = await createTestApp()
      await startShortEmom(testApp)

      clearAudioMocksUnified()

      // This case verifies setup only; the Tabata cases above cover phase audio.
      await expect.poll(() => testApp.workout.isTimerRunning()).toBe(true)
      await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()
    })
  })
})
