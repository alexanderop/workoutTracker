/* eslint-disable vitest/no-conditional-in-test, vitest/no-conditional-expect -- Timer logging controls vary by current timer state. */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { expectWorkoutCount, getAllWorkouts, getWorkoutCount } from '../helpers/dbAssertions'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import type { DbAmrapBlock, DbForTimeBlock } from '@/db/schema'

type TestApp = Awaited<ReturnType<typeof createTestApp>>

/**
 * Helper to navigate to timers page from home.
 */
async function goToTimersPage(testApp: TestApp) {
  const quickTimerCard = testApp.getByText(/quick timer/i)
  await userEvent.click(quickTimerCard)
  await expect.element(page.getByText(/AMRAP/)).toBeVisible()
}

/**
 * Helper to open the custom configuration form for a timer type.
 */
async function openCustomForm(timerTypeName: RegExp) {
  await userEvent.click(page.getByRole('button', { name: timerTypeName }))
  await expect.element(page.getByText(/Custom/)).toBeVisible()
  await userEvent.click(page.getByRole('button', { name: /custom/i }))
}

/**
 * Helper to clear a numeric input and type a new value.
 */
async function fillNumberInput(input: ReturnType<typeof page.getByRole>, value: string) {
  await userEvent.clear(input)
  await userEvent.fill(input, value)
}

/**
 * Helper to start the timer from the custom form and wait for the runner UI.
 */
async function startCustomTimer() {
  await userEvent.click(page.getByRole('button', { name: /start/i }))
  await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()
}

/**
 * Helper to simulate timer completion via the test-only complete button
 * (see StandaloneTimerRunner's data-testid="complete-timer-test").
 */
async function completeTimer() {
  await userEvent.click(page.getByTestId('complete-timer-test'))
  await expect.element(page.getByText(/complete!/i)).toBeVisible()
}

/**
 * Helper to log the completed timer as a workout and wait for confirmation.
 */
async function logWorkout() {
  await userEvent.click(page.getByRole('button', { name: /log workout/i }))
  await expect.element(page.getByRole('button', { name: /logged/i })).toBeVisible()
}

function isAmrapBlock(block: { kind: string }): block is DbAmrapBlock {
  return block.kind === 'amrap'
}

function isForTimeBlock(block: { kind: string }): block is DbForTimeBlock {
  return block.kind === 'fortime'
}

/**
 * NOTE on EMOM / Tabata logging coverage:
 *
 * Clicking "Log Workout" after a standalone EMOM or Tabata timer currently
 * fails silently in production code with a DataCloneError: the timer result
 * is stored in a deep `ref` in StandaloneTimerRunner, which wraps the nested
 * result arrays (`missedMinutes` / `repsPerRound`) in reactive proxies, and
 * IndexedDB's structuredClone rejects proxies. The error is swallowed by
 * `tryCatch()` in useTimerWorkoutLogger's saveWorkout. AMRAP and For Time
 * results contain only primitives, so those log flows work.
 *
 * Because these tests must not modify production code and must not enshrine
 * the bug as expected behavior, the EMOM/Tabata journeys below stop at the
 * completion screen and do not assert on the (currently broken) save.
 */
describe('Timer Logging Flows', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Custom AMRAP timer', () => {
    it('configures a custom duration, completes the timer, and logs it', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await openCustomForm(/amrap/i)

      // Configure a 7 minute AMRAP
      const minutesInput = page.getByRole('spinbutton', { name: /duration/i })
      await fillNumberInput(minutesInput, '7')

      await startCustomTimer()
      await completeTimer()
      await logWorkout()

      await expectWorkoutCount(1)
      const workouts = await getAllWorkouts()
      const workout = workouts[0]
      if (!workout) throw new Error('No workout found')

      expect(workout.name).toBe('7 min AMRAP')
      expect(workout.blocks).toHaveLength(1)

      const block = workout.blocks[0]
      if (!block) throw new Error('No block found')
      expect(block.kind).toBe('amrap')
      if (isAmrapBlock(block)) {
        expect(block.config.durationSeconds).toBe(420)
        expect(block.exercises).toEqual([])
        expect(block.result).toBeDefined()
      }

      app.cleanup()
    })
  })

  describe('Custom For Time timer', () => {
    it('configures a time cap, completes the timer, and logs it', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await openCustomForm(/for time/i)

      // Time cap is enabled by default - set it to 12 minutes
      await expect.element(page.getByRole('checkbox', { name: /enable time cap/i })).toBeChecked()
      const capInput = page.getByRole('spinbutton', { name: /time cap/i })
      await fillNumberInput(capInput, '12')

      await startCustomTimer()
      await completeTimer()
      await logWorkout()

      await expectWorkoutCount(1)
      const workouts = await getAllWorkouts()
      const workout = workouts[0]
      if (!workout) throw new Error('No workout found')

      expect(workout.name).toBe('FOR TIME (12 min cap)')

      const block = workout.blocks[0]
      if (!block) throw new Error('No block found')
      expect(block.kind).toBe('fortime')
      if (isForTimeBlock(block)) {
        expect(block.config.timeCapSeconds).toBe(720)
        expect(block.exercises).toEqual([])
        expect(block.result).toBeDefined()
      }

      app.cleanup()
    })

    it('disables the time cap, completes the timer, and logs an uncapped workout', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await openCustomForm(/for time/i)

      // Disable the time cap - the minutes input should disappear
      const capCheckbox = page.getByRole('checkbox', { name: /enable time cap/i })
      await userEvent.click(capCheckbox)
      await expect
        .element(page.getByRole('spinbutton', { name: /time cap/i }))
        .not.toBeInTheDocument()

      await startCustomTimer()
      await completeTimer()
      await logWorkout()

      await expectWorkoutCount(1)
      const workouts = await getAllWorkouts()
      const workout = workouts[0]
      if (!workout) throw new Error('No workout found')

      // Uncapped For Time workouts have no cap suffix in the name
      expect(workout.name).toBe('FOR TIME')

      const block = workout.blocks[0]
      if (!block) throw new Error('No block found')
      expect(block.kind).toBe('fortime')
      if (isForTimeBlock(block)) {
        expect(block.config.timeCapSeconds).toBeNull()
      }

      app.cleanup()
    })
  })

  describe('Custom EMOM timer', () => {
    it('configures a custom duration and runs to the completion screen', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await openCustomForm(/emom/i)

      // Configure a 12 minute EMOM in the custom form
      const minutesInput = page.getByRole('spinbutton', { name: /duration/i })
      await fillNumberInput(minutesInput, '12')

      await startCustomTimer()

      // The runner shows the configured total minutes ("1 / 12 MIN")
      await expect.element(page.getByText('12', { exact: true })).toBeVisible()

      await completeTimer()

      // The completion screen offers logging plus restart/exit
      await expect.element(page.getByRole('button', { name: /log workout/i })).toBeEnabled()
      await expect.element(page.getByRole('button', { name: /again/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /^done$/i })).toBeVisible()

      app.cleanup()
    })
  })

  describe('Custom Tabata timer', () => {
    it('configures rounds/work/rest and runs to the completion screen', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await openCustomForm(/tabata/i)

      // Configure 6 rounds of 15s work / 10s rest
      await fillNumberInput(page.getByRole('spinbutton', { name: /rounds/i }), '6')
      await fillNumberInput(page.getByRole('spinbutton', { name: /work/i }), '15')
      await fillNumberInput(page.getByRole('spinbutton', { name: /rest/i }), '10')

      await startCustomTimer()

      // The runner reflects the custom config: round counter "1 / 6",
      // work-phase countdown starting at 15 seconds
      await expect.element(page.getByText('6', { exact: true })).toBeVisible()
      await expect.element(page.getByText('15', { exact: true })).toBeVisible()

      await completeTimer()

      // The completion screen offers logging plus restart/exit
      await expect.element(page.getByRole('button', { name: /log workout/i })).toBeEnabled()
      await expect.element(page.getByRole('button', { name: /again/i })).toBeVisible()

      app.cleanup()
    })
  })

  describe('Custom form navigation', () => {
    it('returns from the custom form to the preset list via Back', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await openCustomForm(/emom/i)

      // Custom form is showing
      await expect.element(page.getByText(/Duration \(minutes\)/)).toBeVisible()

      // Back returns to the preset list
      await userEvent.click(page.getByRole('button', { name: /^back$/i }))
      await expect.element(page.getByText('10 min', { exact: true })).toBeVisible()
      await expect.element(page.getByText(/quick session/i)).toBeVisible()

      app.cleanup()
    })
  })

  describe('Declining to log', () => {
    it('completing a timer and pressing Done without logging saves nothing', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)

      // Start an EMOM from a preset
      await userEvent.click(page.getByRole('button', { name: /emom/i }))
      await expect.element(page.getByText('10 min', { exact: true })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /quick session/i }))
      await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()

      await completeTimer()

      // User declines to log and just exits
      await userEvent.click(page.getByRole('button', { name: /^done$/i }))

      // Back at timer type selection, nothing was saved
      await expect.element(page.getByText(/As Many Rounds As Possible/)).toBeVisible()
      expect(await getWorkoutCount()).toBe(0)

      app.cleanup()
    })
  })
})
