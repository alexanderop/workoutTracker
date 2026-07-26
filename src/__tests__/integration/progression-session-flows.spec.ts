import { page } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { getProgressionsRepository } from '@/db'

/**
 * User flows for running an EMOM progression session:
 * starting the timer, finishing (success/failure), abandoning mid-session,
 * and recovering from stale/invalid session links.
 *
 * The EMOM timer runs in real time (setInterval, no fake timers in browser
 * mode). Tests that need the timer to finish shrink the session duration to
 * two seconds by updating `currentMinutes` in the repository (1/30 of a
 * minute) before entering the session, so a full user journey stays fast.
 *
 * Browser capability, per ADR 004's tiering rule, shared by every test below:
 * each one drives the real `setInterval` timer, a real completion dialog, or
 * real back-navigation between routes. The timer *state machine* itself is not
 * retested here — `unit/progressions/useProgressionSession.spec.ts` covers tick
 * cadence, minute derivation, self-stop, cancel and the error arms under
 * `vi.useFakeTimers()`. What is left here is the wiring: that the screen starts
 * the timer, that finishing raises the dialog, and that the answer reaches the
 * database.
 */

const TWO_SECOND_SESSION = 1 / 30

describe('Progression Session Flows', () => {
  // Browser: a real 2s EMOM runs to completion, raising the real dialog.
  it('runs a session to the end and advances the level after confirming success', async ({
    createTestApp,
  }) => {
    const app = await createTestApp()
    const repo = getProgressionsRepository()

    const progression = await repo.create({
      name: 'KB Swing Ladder',
      availableWeights: [16, 20],
    })
    await repo.update(progression.id, { currentMinutes: TWO_SECOND_SESSION })

    // User opens the detail page and starts a session
    await app.navigateTo(`/progressions/${progression.id}`)
    await app.progressions.clickStartSession()
    await expect.poll(() => app.router.currentRoute.value.path).toMatch(/\/session$/)

    // Ready screen shows the level and the start hint
    await expect.element(page.getByText(/tap to start/i)).toBeVisible()
    await expect.element(page.getByText(/reps per minute/i)).toBeVisible()

    // User starts the timer
    await app.progressions.clickPlayButton()

    // Active screen shows the countdown; a 2-second EMOM is in its last minute
    await expect.element(page.getByText(/last minute/i)).toBeVisible()

    // Timer finishes after ~2s and the completion dialog appears
    await expect.element(page.getByRole('dialog'), { timeout: 8000 }).toBeVisible()
    await expect.element(page.getByText(/did you complete all reps/i)).toBeVisible()

    // User confirms success and lands back on the detail page
    await app.progressions.confirmSessionCompleted()
    await expect
      .poll(() => app.router.currentRoute.value.path)
      .toBe(`/progressions/${progression.id}`)

    // The progression advanced (10 -> 12 reps) and the session was recorded
    await app.progressions.assertSessionsCompleted(1)
    const updated = await repo.getById(progression.id)
    expect(updated?.currentReps).toBe(12)
    expect(updated?.sessionsCompleted).toBe(1)

    const history = await repo.getSessionHistory(progression.id)
    expect(history).toHaveLength(1)
    expect(history[0]?.completed).toBe(true)
  }, 20_000)

  // Browser: same real timer + dialog, taking the "No, missed some" arm.
  it('records a failed session without advancing the level', async ({ createTestApp }) => {
    const app = await createTestApp()
    const repo = getProgressionsRepository()

    const progression = await repo.create({
      name: 'KB Swing Ladder',
      availableWeights: [16, 20],
    })
    await repo.update(progression.id, { currentMinutes: TWO_SECOND_SESSION })

    // User goes straight to the session (e.g. from a bookmark)
    await app.navigateTo(`/progressions/${progression.id}/session`)
    await expect.element(page.getByText(/tap to start/i)).toBeVisible()

    await app.progressions.clickPlayButton()

    // Timer finishes and the user admits missing reps
    await expect.element(page.getByRole('dialog'), { timeout: 8000 }).toBeVisible()
    await app.progressions.confirmSessionFailed()

    await expect
      .poll(() => app.router.currentRoute.value.path)
      .toBe(`/progressions/${progression.id}`)

    // Session counted, but the level did not advance
    await app.progressions.assertSessionsCompleted(1)
    await expect.element(page.getByText('Incomplete')).toBeVisible()

    const updated = await repo.getById(progression.id)
    expect(updated?.currentReps).toBe(10)
    expect(updated?.sessionsCompleted).toBe(1)

    const history = await repo.getSessionHistory(progression.id)
    expect(history[0]?.completed).toBe(false)
  }, 20_000)

  // Browser: back-navigation out of a *running* timer, twice, asserting the
  // interval leaves nothing behind.
  it('abandons an active session with the back button without recording anything', async ({
    createTestApp,
  }) => {
    const app = await createTestApp()
    const repo = getProgressionsRepository()

    const progression = await repo.create({
      name: 'KB Swing Ladder',
      availableWeights: [16],
    })

    await app.navigateTo(`/progressions/${progression.id}/session`)
    await expect.element(page.getByText(/tap to start/i)).toBeVisible()

    // User starts the 10-minute EMOM...
    await app.progressions.clickPlayButton()
    await expect.element(page.getByText(/minute 1 of 10/i)).toBeVisible()

    // ...then bails out via the back button
    await page.getByRole('button', { name: /go back/i }).click()
    await expect
      .poll(() => app.router.currentRoute.value.path)
      .toBe(`/progressions/${progression.id}`)

    // Nothing was recorded
    await app.progressions.assertSessionsCompleted(0)
    const unchanged = await repo.getById(progression.id)
    expect(unchanged?.sessionsCompleted).toBe(0)
    expect(await repo.getSessionHistory(progression.id)).toHaveLength(0)

    // Back again from the detail page returns to the progressions list
    await page.getByRole('button', { name: /go back/i }).click()
    await expect.poll(() => app.router.currentRoute.value.path).toBe('/progressions')
  })

  // Browser: back-navigation from the ready screen before any timer exists.
  it('leaves the ready session screen without starting the timer', async ({ createTestApp }) => {
    const app = await createTestApp()
    const repo = getProgressionsRepository()

    const progression = await repo.create({
      name: 'KB Swing Ladder',
      availableWeights: [16],
    })

    await app.navigateTo(`/progressions/${progression.id}/session`)
    await expect.element(page.getByText(/tap to start/i)).toBeVisible()

    // User changes their mind before pressing play
    await page.getByRole('button', { name: /go back/i }).click()
    await expect
      .poll(() => app.router.currentRoute.value.path)
      .toBe(`/progressions/${progression.id}`)

    expect(await repo.getSessionHistory(progression.id)).toHaveLength(0)
  })

  // Browser: a stale deep link renders the error screen, and the spurious
  // dialog button is a no-op against the real router.
  it('shows an error for a stale session link and recovers via back navigation', async ({
    createTestApp,
  }) => {
    const app = await createTestApp()
    const repo = getProgressionsRepository()

    // User follows a link to a progression that no longer exists
    await app.navigateTo('/progressions/does-not-exist/session')
    await expect.element(page.getByText(/error/i)).toBeVisible()

    // Confirming the (spurious) completion dialog is a safe no-op
    await page.getByRole('button', { name: /yes, completed/i }).click()
    expect(app.router.currentRoute.value.path).toBe('/progressions/does-not-exist/session')
    expect(await repo.getAll()).toHaveLength(0)

    // The detail page for the same stale id reports the progression is gone
    await app.navigateTo('/progressions/does-not-exist')
    await expect.element(page.getByText(/progression not found/i)).toBeVisible()
  })

  // Browser: asserts the timer control is absent from the DOM, a negative
  // only a real render can answer.
  it('refuses to start a session for an already finished progression', async ({
    createTestApp,
  }) => {
    const app = await createTestApp()
    const repo = getProgressionsRepository()

    const progression = await repo.create({
      name: 'Finished Ladder',
      availableWeights: [16],
    })
    await repo.update(progression.id, { isComplete: true })

    // User revisits the session URL of a completed progression
    await app.navigateTo(`/progressions/${progression.id}/session`)

    // No timer is offered, only the error state
    await expect.element(page.getByText(/error/i)).toBeVisible()
    await expect.element(page.getByText(/tap to start/i)).not.toBeInTheDocument()
  })

  // Browser: opens the real confirm dialog and cancels it.
  it('keeps the progression when deletion is cancelled', async ({ createTestApp }) => {
    const app = await createTestApp()
    const repo = getProgressionsRepository()

    const progression = await repo.create({
      name: 'Keep Me',
      availableWeights: [16],
    })

    await app.navigateTo(`/progressions/${progression.id}`)
    await app.progressions.assertCurrentLevel(16, 10, 10)

    // User opens the delete dialog, then cancels
    await app.progressions.clickDelete()
    await app.common.waitForDialog()
    await page.getByRole('button', { name: /cancel/i }).click()
    await app.common.waitForDialogClose()

    // Progression is still there, in the UI and in the database
    await expect.element(page.getByText('Keep Me')).toBeVisible()
    expect(await repo.getById(progression.id)).toBeDefined()
  })
})
