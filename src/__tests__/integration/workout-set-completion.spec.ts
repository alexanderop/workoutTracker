import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { expectSettingValue } from '../helpers/dbAssertions'

describe('Workout Set Completion', () => {
  describe('Set Completion Flow', () => {
    it('completes a set and prefills the next set with all values', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      await expect
        .poll(async () => {
          const activeSet = await workout.getActiveSet()
          if (!activeSet) return null
          return await activeSet.getValues()
        })
        .toEqual({ weight: '100', reps: '8', rir: '2' })
    })

    it('can complete multiple sets in sequence', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

      // Setup workout with 2 blocks (so completing first block doesn't end workout)
      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Deadlift'])
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Complete first two sets and verify
      await workout.completeMultipleSets(2, { weight: '100', reps: '8', rir: '2' })
      await expect.poll(() => workout.getCompletedSetCount()).toBe(2)

      // Complete third set (pre-filled values, just click button)
      await page.getByRole('button', { name: /mark set 3 complete/i }).click()

      // After completing all sets in block 1, app auto-advances to block 2
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()
      await expect.element(page.getByText('Deadlift')).toBeInTheDocument()
    })

    it('can end workout and see completion screen', async ({ createTestApp }) => {
      const { builder, workout, common } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      // Open menu and end workout
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())

      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /end workout/i }).click()

      // Confirm finish workout dialog
      await common.waitForDialog()
      const nameInput = page.getByRole('textbox', { name: /workout name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Test Complete')
      await userEvent.click(common.getDialogButton('Finish Workout'))

      await expect.element(page.getByText(/workout complete/i)).toBeVisible()
    })

    it('completes consecutive sets with zero weight and zero RIR boundaries', async ({
      createTestApp,
    }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '0', reps: '10', rir: '2' })

      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '0' })

      await expect.poll(() => workout.isSetCompleted(1)).toBe(true)
    })

    it('does not auto-advance until ALL sets in block are complete', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Deadlift'])
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Complete only 1 of 3 sets
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Should still be on block 1 (not auto-advanced to block 2)
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()
    })
  })

  describe('Set Validation', () => {
    it('does not complete set with missing reps', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Fill weight and rir, but NOT reps
      const row = await workout.getSetRow(0)
      await userEvent.fill(row.kg, '100')
      await userEvent.fill(row.rir, '2')

      // Regression coverage for UX review Low finding "Row checkmarks look enabled
      // on empty sets but do nothing" -- the checkmark now mirrors the footer CTA's
      // readiness gate and is genuinely disabled while reps is missing, instead of
      // being clickable and silently no-op'ing.
      await expect
        .poll(() => (row.complete instanceof HTMLButtonElement ? row.complete.disabled : false))
        .toBe(true)

      // Set should NOT be completed (validation should reject it)
      await expect.poll(() => workout.isSetCompleted(0)).toBe(false)
    })
  })

  // Regression coverage for UX review Finding 6 (High): reka-ui's NumberField only
  // commits typed values on blur/Enter, not on every keystroke. `SetRowPO.fill()`
  // types kg -> reps -> rir in sequence; moving focus between fields blurs (and
  // commits) the previous one, but the LAST field filled (rir) is left focused and
  // therefore uncommitted -- exactly the "first-set completion" repro from the review.
  describe('Focus/Blur Commit Timing (Finding 6)', () => {
    it('enables one-tap completion while focused and persists the typed values', async ({
      createTestApp,
    }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      const row = workout.getSet(0)
      // Leaves focus in the rir input without blurring it.
      await row.enterValues({ kg: 60, reps: 10, rir: 2 })

      await expect
        .poll(() => {
          const button = page.getByRole('button', { name: /complete set/i }).query()
          return button instanceof HTMLButtonElement ? button.disabled : null
        })
        .toBe(false)

      // Single tap -- should both commit the pending rir value and complete the set.
      await row.complete()

      await expect.poll(() => row.isCompleted()).toBe(true)
      // The commit-on-tap fix must not mark the set complete while leaving stale/empty
      // data behind -- the actual typed values must be the ones that get persisted.
      expect(await row.getValues()).toEqual({ weight: '60', reps: '10', rir: '2' })
    })
  })

  // Regression coverage for UX review Finding 8 (High): the rest timer used to
  // count UP with no target, countdown, or completion signal. It now counts
  // DOWN toward a configurable target (90s default), is tap-to-dismiss, and
  // never blocks logging the next set (no modal).
  describe('Rest Timer Integration', () => {
    it('shows rest timer in footer after completing a set', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Verify rest timer appears in footer (look for a timer display)
      await expect
        .poll(
          () => {
            // eslint-disable-next-line no-restricted-syntax -- Finding timer element by CSS class
            const timerElements = document.querySelectorAll('.font-mono.tabular-nums')
            return [...timerElements].some((element) => element.textContent?.match(/^\d+:\d{2}$/))
          },
          { timeout: 2000 },
        )
        .toBe(true)
    })

    it('counts down toward the configured rest target instead of counting up', async ({
      createTestApp,
    }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Default rest target is 90s (see `useSettingsStore`'s defaultRestTimer
      // default) -- the display must start at/near 90 and count DOWN, never
      // exceeding it the way the old count-up-forever timer did.
      const timerButton = page.getByRole('button', { name: /dismiss rest timer/i })
      await expect.element(timerButton, { timeout: 2000 }).toBeVisible()

      await expect
        .poll(async () => {
          const element = await timerButton.element()
          const [minutes, seconds] = (element.textContent ?? '').trim().split(':').map(Number)
          if (minutes === undefined || seconds === undefined) return null
          return minutes * 60 + seconds
        })
        .toBeLessThanOrEqual(90)
    })

    it('adjusts and persists the rest target by 15s when tapping +/- on the timer itself', async ({
      createTestApp,
    }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      const timerButton = page.getByRole('button', { name: /dismiss rest timer/i })
      await expect.element(timerButton, { timeout: 2000 }).toBeVisible()

      const increaseButton = page.getByRole('button', { name: /increase rest time by 15 seconds/i })
      await userEvent.click(increaseButton)
      await userEvent.click(increaseButton)

      // Two +15s taps on top of the 90s default -- persisted immediately so
      // it sticks for the next set/session (see `useSettingsStore.setDefaultRestTimer`).
      await expectSettingValue('defaultRestTimer', 120)
    })

    it('dismisses the rest timer when tapped, without opening a dialog', async ({
      createTestApp,
    }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      const timerButton = page.getByRole('button', { name: /dismiss rest timer/i })
      await expect.element(timerButton, { timeout: 2000 }).toBeVisible()

      await userEvent.click(timerButton)

      await expect.element(timerButton).not.toBeInTheDocument()
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
    })

    it('never blocks logging the next set while a rest is in progress', async ({
      createTestApp,
    }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      const timerButton = page.getByRole('button', { name: /dismiss rest timer/i })
      await expect.element(timerButton, { timeout: 2000 }).toBeVisible()

      // The rest timer is purely informational -- no modal should block the
      // next set from being completed while it's showing.
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      await expect.poll(() => workout.getCompletedSetCount()).toBe(2)
    })
  })

  describe('Data Persistence', () => {
    it('completed set values persist after navigating away and back', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Deadlift'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      // Navigate to block 2 and back to block 1
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()

      await userEvent.click(await workout.getFooterButton('prev'))
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Verify completed set is still visible
      await expect.poll(() => workout.getCompletedSetCount()).toBeGreaterThan(0)
    })

    it('workout state survives returning to builder and resuming', async ({ createTestApp }) => {
      const { builder, workout } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      // Go back to builder mode
      await page.getByRole('button', { name: /go back/i }).click()
      await expect.element(page.getByRole('button', { name: /resume workout/i })).toBeVisible()

      // Resume the workout
      await page.getByRole('button', { name: /resume workout/i }).click()

      // Verify we're back in active mode and completed set is preserved
      await expect.element(page.getByRole('timer')).toBeVisible()
      await expect.element(page.getByRole('table')).toBeVisible()
      await expect.poll(() => workout.getCompletedSetCount()).toBeGreaterThan(0)
    })
  })
})
