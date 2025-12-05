import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

describe('Continue Workout Flow', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  describe('Continue Workout Button', () => {
    it('shows "Start Workout" with Play icon for fresh workout', async () => {
      const { common, user, getByRole, cleanup } = await createTestApp()

      // Navigate to workout builder
      await user.click(getByRole('button', { name: /get started/i }))

      // Add an exercise block
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Verify the button shows "Start Workout" (not "Resume")
      const startButton = getByRole('button', { name: /start workout/i })
      expect(startButton).toBeDefined()

      // Verify Play icon is present (not RotateCcw)
      const playIcon = startButton.querySelector('svg.lucide-play')
      const rotateIcon = startButton.querySelector('svg.lucide-rotate-ccw')
      expect(playIcon).toBeTruthy()
      expect(rotateIcon).toBeFalsy()

      // Verify no pulsing animation class
      expect(startButton.className).not.toContain('animate-pulse-ring')

      cleanup()
    })

    it('shows "Resume Workout" with RotateCcw icon after completing a set', async () => {
      const { builder, common, user, getByRole, queryByRole, cleanup } = await createTestApp()

      // Navigate to workout builder
      await user.click(getByRole('button', { name: /get started/i }))

      // Add an exercise block
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Start the workout
      await builder.startWorkout()

      // Fill in set values and complete the first set
      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
      const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

      await user.type(weightInput, '100')
      await user.type(repsInput, '8')
      await user.type(rirInput, '2')
      await user.click(getByRole('button', { name: /complete set/i }))

      // Go back to builder mode - find back button by chevron icon
      const backButton = document.querySelector('header button')
      if (!(backButton instanceof HTMLElement)) {
        throw new Error('Back button not found')
      }
      await user.click(backButton)

      // Wait for builder mode to render
      await waitFor(() => {
        expect(queryByRole('button', { name: /resume workout/i })).toBeTruthy()
      })

      // Verify the button shows "Resume Workout"
      const resumeButton = getByRole('button', { name: /resume workout/i })
      expect(resumeButton).toBeDefined()

      // Verify RotateCcw icon is present (not Play)
      const rotateIcon = resumeButton.querySelector('svg.lucide-rotate-ccw')
      const playIcon = resumeButton.querySelector('svg.lucide-play')
      expect(rotateIcon).toBeTruthy()
      expect(playIcon).toBeFalsy()

      // Verify pulsing animation class is applied
      expect(resumeButton.className).toContain('animate-pulse-ring')

      cleanup()
    })

    it('allows resuming workout from Continue button', async () => {
      const { builder, common, user, getByRole, queryByRole, getByText, cleanup } =
        await createTestApp()

      // Navigate to workout builder
      await user.click(getByRole('button', { name: /get started/i }))

      // Add an exercise block
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Start workout, complete a set, go back
      await builder.startWorkout()
      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
      const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })
      await user.type(weightInput, '100')
      await user.type(repsInput, '8')
      await user.type(rirInput, '2')
      await user.click(getByRole('button', { name: /complete set/i }))

      // Go back to builder mode - find back button in header
      const backButton = document.querySelector('header button')
      if (!(backButton instanceof HTMLElement)) {
        throw new Error('Back button not found')
      }
      await user.click(backButton)

      // Wait for builder mode
      await waitFor(() => {
        expect(queryByRole('button', { name: /resume workout/i })).toBeTruthy()
      })

      // Click Resume Workout
      await user.click(getByRole('button', { name: /resume workout/i }))

      // Verify we're back in active mode by checking for timer badge
      await waitFor(() => {
        const timerIcon = document.querySelector('svg[class*="lucide-timer"]')
        expect(timerIcon).toBeTruthy()
      })

      // Verify completed set is still visible in history
      expect(getByText(/100kg × 8/)).toBeDefined()

      cleanup()
    })
  })

  describe('Duration Timer Badge', () => {
    it('shows duration badge with timer icon and pulsing indicator in active mode', async () => {
      const { builder, common, user, getByRole, cleanup } = await createTestApp()

      // Navigate to workout builder
      await user.click(getByRole('button', { name: /get started/i }))

      // Add an exercise block
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode to render and verify duration badge appears
      await waitFor(() => {
        // Look for the duration badge with timer icon (lucide-timer-icon class)
        const timerIcon = document.querySelector('svg[class*="lucide-timer"]')
        expect(timerIcon).toBeTruthy()
      })

      // Verify the badge contains a time format (m:ss or mm:ss)
      const badge = document.querySelector('.tabular-nums')
      expect(badge).toBeTruthy()
      expect(badge?.textContent).toMatch(/^\d+:\d{2}$/)

      // Verify the pulsing dot indicator exists (animate-ping class)
      const pulsingDot = document.querySelector('.animate-ping')
      expect(pulsingDot).toBeTruthy()

      cleanup()
    })
  })
})
