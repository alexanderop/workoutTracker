import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { db } from '@/db'
import type { DbAmrapBlock } from '@/db/schema'

type TestApp = Awaited<ReturnType<typeof createTestApp>>

/**
 * Helper to navigate to timers page from home
 */
async function goToTimersPage(testApp: TestApp) {
  const quickTimerCard = testApp.getByText(/quick timer/i)
  await userEvent.click(quickTimerCard)
  await expect.element(page.getByText(/AMRAP/)).toBeVisible()
}

/**
 * Helper to start an AMRAP timer with 5 min preset
 */
async function startAmrapTimer() {
  await userEvent.click(page.getByRole('button', { name: /AMRAP/i }))
  await expect.element(page.getByText('5 min', { exact: true })).toBeVisible()
  await userEvent.click(page.getByRole('button', { name: /Quick burst/i }))

  // Wait for timer UI
  await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()
}

/**
 * Helper to simulate timer completion.
 *
 * Since we can't fast-forward real timers in browser integration tests,
 * we trigger completion via a test-only mechanism. The StandaloneTimerRunner
 * component exposes a data-testid="complete-timer-test" button in test mode.
 */
async function completeTimer() {
  const completeTestBtn = page.getByTestId('complete-timer-test')
  await userEvent.click(completeTestBtn)

  // Wait for completion UI to appear
  await expect.element(page.getByText(/complete/i)).toBeVisible()
}

/**
 * Type guard for AMRAP blocks
 */
function isAmrapBlock(block: { kind: string }): block is DbAmrapBlock {
  return block.kind === 'amrap'
}

describe('Timer Workout Logging', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Log Workout button on completion', () => {
    it('shows Log Workout button when timer completes', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()

      // Verify "Log Workout" button is visible on completion screen
      await expect.element(page.getByRole('button', { name: /log workout/i })).toBeVisible()

      // Also verify existing buttons are still there
      await expect.element(page.getByRole('button', { name: /again/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /done/i })).toBeVisible()

      app.cleanup()
    })

    it('changes button to "Logged ✓" after clicking Log Workout', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()

      // Click Log Workout
      const logButton = page.getByRole('button', { name: /log workout/i })
      await userEvent.click(logButton)

      // Button should change to "Logged ✓" and be disabled
      await expect.element(page.getByRole('button', { name: /logged/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /logged/i })).toBeDisabled()

      app.cleanup()
    })

    it('saves workout to database when Log Workout is clicked', async () => {
      const app = await createTestApp()

      // Verify database is empty before
      expect(await db.workouts.count()).toBe(0)

      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()

      // Click Log Workout
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))

      // Verify workout was saved to database
      await expect.poll(async () => await db.workouts.count()).toBe(1)

      // Verify workout data
      const workouts = await db.workouts.toArray()
      const savedWorkout = workouts[0]
      if (!savedWorkout) throw new Error('No workout found')

      expect(savedWorkout.name).toMatch(/amrap/i)
      expect(savedWorkout.blocks).toHaveLength(1)
      expect(savedWorkout.blocks[0]?.kind).toBe('amrap')
      // In test mode, timer completes instantly so duration can be 0
      expect(savedWorkout.durationSeconds).toBeGreaterThanOrEqual(0)

      app.cleanup()
    })

    it('allows logging workout and then running another timer', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()

      // Log the workout
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))
      await expect.element(page.getByRole('button', { name: /logged/i })).toBeVisible()

      // Click "Again" to restart
      await userEvent.click(page.getByRole('button', { name: /again/i }))

      // Should be back in timer running state (not completion)
      await expect.element(page.getByRole('button', { name: /start timer/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /logged/i })).not.toBeInTheDocument()

      app.cleanup()
    })

    it('resets logged state when clicking Done and starting new timer', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()

      // Log the workout
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))
      await expect.element(page.getByRole('button', { name: /logged/i })).toBeVisible()

      // Click "Done" to exit
      await userEvent.click(page.getByRole('button', { name: /^done$/i }))

      // Should be back at timer selection
      await expect.element(page.getByText(/As Many Rounds As Possible/)).toBeVisible()

      // Start a new timer
      await startAmrapTimer()
      await completeTimer()

      // Log Workout button should be available again (not "Logged ✓")
      await expect.element(page.getByRole('button', { name: /log workout/i })).toBeVisible()

      app.cleanup()
    })
  })

  describe('Logged workout data', () => {
    it('creates workout with correct AMRAP block structure', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()

      await userEvent.click(page.getByRole('button', { name: /log workout/i }))

      // Wait for save
      await expect.poll(async () => await db.workouts.count()).toBe(1)

      const workouts = await db.workouts.toArray()
      const workout = workouts[0]
      if (!workout) throw new Error('No workout found')

      const block = workout.blocks[0]
      if (!block) throw new Error('No block found')

      // Verify block structure
      expect(block.kind).toBe('amrap')
      if (isAmrapBlock(block)) {
        expect(block.config.durationSeconds).toBe(300) // 5 min preset
        expect(block.exercises).toEqual([]) // Empty exercises (user chose optional)
        expect(block.result).toBeDefined()
        expect(block.result?.rounds).toBeGreaterThanOrEqual(0)
      }

      app.cleanup()
    })

    it('generates auto-name for logged workout', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()

      await userEvent.click(page.getByRole('button', { name: /log workout/i }))

      await expect.poll(async () => await db.workouts.count()).toBe(1)

      const workouts = await db.workouts.toArray()
      const workout = workouts[0]
      if (!workout) throw new Error('No workout found')

      // Name should include timer type and/or duration
      expect(workout.name).toMatch(/5.*min.*amrap|amrap.*5.*min/i)

      app.cleanup()
    })

    it('uses timer timestamps for workout startedAt and completedAt', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()

      const beforeStart = Date.now()
      await completeTimer()
      const afterComplete = Date.now()

      await userEvent.click(page.getByRole('button', { name: /log workout/i }))

      await expect.poll(async () => await db.workouts.count()).toBe(1)

      const workouts = await db.workouts.toArray()
      const workout = workouts[0]
      if (!workout) throw new Error('No workout found')

      // Timestamps should be within the test execution window
      expect(workout.startedAt).toBeGreaterThanOrEqual(beforeStart - 1000) // Allow 1s tolerance
      expect(workout.completedAt).toBeLessThanOrEqual(afterComplete + 1000)
      // In test mode, completion is instant so timestamps can be equal
      expect(workout.completedAt).toBeGreaterThanOrEqual(workout.startedAt)

      app.cleanup()
    })
  })

  describe('Edge cases and error scenarios', () => {
    it('handles rapid clicking of Log Workout button', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()

      // Click multiple times rapidly
      const logButton = page.getByRole('button', { name: /log workout/i })
      await userEvent.click(logButton)
      await userEvent.click(logButton)
      await userEvent.click(logButton)

      // Only one workout should be saved
      await expect.poll(async () => await db.workouts.count()).toBe(1)
      await expect.element(page.getByRole('button', { name: /logged/i })).toBeVisible()

      app.cleanup()
    })

    it('preserves logged state when pausing and resuming timer', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()

      // Pause the timer
      await userEvent.click(page.getByRole('button', { name: /pause/i }))

      // Resume
      await userEvent.click(page.getByRole('button', { name: /play/i }))

      // Complete
      await completeTimer()

      // Log workout
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))
      await expect.element(page.getByRole('button', { name: /logged/i })).toBeVisible()

      expect(await db.workouts.count()).toBe(1)

      app.cleanup()
    })

    it('does not show logged state after clicking Done without logging', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()

      // Click Done without logging
      await userEvent.click(page.getByRole('button', { name: /^done$/i }))

      // Start another timer
      await startAmrapTimer()
      await completeTimer()

      // Log Workout button should be available (not Logged)
      await expect.element(page.getByRole('button', { name: /log workout/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /logged/i })).not.toBeInTheDocument()

      app.cleanup()
    })

    it('saves correct timestamps even with instant completion in test mode', async () => {
      const app = await createTestApp()

      const beforeTest = Date.now()

      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))

      const afterTest = Date.now()

      await expect.poll(async () => await db.workouts.count()).toBe(1)

      const workouts = await db.workouts.toArray()
      const workout = workouts[0]
      if (!workout) throw new Error('No workout found')

      // Timestamps should be within test execution window
      expect(workout.startedAt).toBeGreaterThanOrEqual(beforeTest - 100)
      expect(workout.startedAt).toBeLessThanOrEqual(afterTest + 100)
      expect(workout.completedAt).toBeGreaterThanOrEqual(beforeTest - 100)
      expect(workout.completedAt).toBeLessThanOrEqual(afterTest + 100)

      app.cleanup()
    })

    it('maintains separate workout instances when logging multiple times', async () => {
      const app = await createTestApp()

      // First workout
      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))
      await expect.poll(async () => await db.workouts.count()).toBe(1)

      // Second workout
      await userEvent.click(page.getByRole('button', { name: /again/i }))
      await completeTimer()
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))
      await expect.poll(async () => await db.workouts.count()).toBe(2)

      // Verify both workouts are distinct
      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.id).not.toBe(workouts[1]?.id)
      expect(workouts[0]?.startedAt).not.toBe(workouts[1]?.startedAt)

      app.cleanup()
    })

    it('shows Log Workout button after reset and completion', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)
      await startAmrapTimer()
      await completeTimer()

      // Log the workout
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))
      await expect.element(page.getByRole('button', { name: /logged/i })).toBeVisible()

      // Click Again
      await userEvent.click(page.getByRole('button', { name: /again/i }))

      // Reset the timer
      await userEvent.click(page.getByRole('button', { name: /reset/i }))

      // Complete again
      await completeTimer()

      // Should show Log Workout button again
      await expect.element(page.getByRole('button', { name: /log workout/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /logged/i })).not.toBeInTheDocument()

      app.cleanup()
    })
  })

  describe('Different timer types', () => {
    it('can log EMOM timer workouts', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)

      // Start EMOM timer
      await userEvent.click(page.getByRole('button', { name: /EMOM/i }))
      await expect.element(page.getByText('10 min', { exact: true })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /Quick session/i }))

      await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()
      await completeTimer()

      // Log the workout
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))

      await expect.poll(async () => await db.workouts.count()).toBe(1)

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.blocks[0]?.kind).toBe('emom')
      expect(workouts[0]?.name).toMatch(/emom/i)

      app.cleanup()
    })

    it('can log Tabata timer workouts', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)

      // Start Tabata timer
      await userEvent.click(page.getByRole('button', { name: /Tabata/i }))
      await expect.element(page.getByText(/8 rounds/i)).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /Classic/i }))

      await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()
      await completeTimer()

      // Log the workout
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))

      await expect.poll(async () => await db.workouts.count()).toBe(1)

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.blocks[0]?.kind).toBe('tabata')
      expect(workouts[0]?.name).toMatch(/tabata/i)

      app.cleanup()
    })

    it('can log For Time timer workouts', async () => {
      const app = await createTestApp()
      await goToTimersPage(app)

      // Start For Time timer
      await userEvent.click(page.getByRole('button', { name: /For Time/i }))
      await expect.element(page.getByText(/Race Against/i)).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /Standard cap/i }))

      await expect.element(page.getByRole('button', { name: /exit timer/i })).toBeVisible()
      await completeTimer()

      // Log the workout
      await userEvent.click(page.getByRole('button', { name: /log workout/i }))

      await expect.poll(async () => await db.workouts.count()).toBe(1)

      const workouts = await db.workouts.toArray()
      expect(workouts[0]?.blocks[0]?.kind).toBe('fortime')
      expect(workouts[0]?.name).toMatch(/for time/i)

      app.cleanup()
    })
  })
})
