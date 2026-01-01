import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { getSwipeableContainer, simulateSwipeLeft } from '../helpers/swipeHelpers'
import { dbWorkoutBuilder } from '../factories'

/**
 * Integration tests for deleting workouts from the history view.
 * Tests the swipe-to-reveal-delete functionality.
 */
describe('History Delete Workout', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Swipe to Reveal Delete', () => {
    it('reveals delete button when swiping left on history workout', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed a workout
      const workout = dbWorkoutBuilder()
        .withName('Morning Workout')
        .withStrengthBlock()
        .build()
      await db.workouts.add(workout)

      // Navigate to history view
      await navigateTo({ name: RouteNames.History })

      // Wait for workout to load
      await expect.element(page.getByText('Morning Workout')).toBeVisible()

      // Get the workout card element and swipe
      const workoutCard = await page.getByText('Morning Workout').element()
      const swipeableContainer = getSwipeableContainer(workoutCard)
      await simulateSwipeLeft(swipeableContainer)

      // Delete button should be visible
      await expect.element(page.getByRole('button', { name: /delete/i })).toBeVisible()

      cleanup()
    })

    it('shows confirmation dialog when delete button is tapped', async () => {
      const { navigateTo, common, cleanup } = await createTestApp()

      // Seed a workout
      const workout = dbWorkoutBuilder()
        .withName('Evening Session')
        .withStrengthBlock()
        .build()
      await db.workouts.add(workout)

      // Navigate to history view
      await navigateTo({ name: RouteNames.History })
      await expect.element(page.getByText('Evening Session')).toBeVisible()

      // Get the workout card and swipe
      const workoutCard = await page.getByText('Evening Session').element()
      const swipeableContainer = getSwipeableContainer(workoutCard)
      await simulateSwipeLeft(swipeableContainer)

      // Click delete button
      await userEvent.click(page.getByRole('button', { name: /delete/i }))

      // Confirmation dialog should appear
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /delete workout/i })).toBeVisible()
      // Check dialog description contains the workout name
      await expect.element(page.getByText(/are you sure you want to delete/i)).toBeVisible()

      cleanup()
    })

    it('removes workout from list after confirming delete', async () => {
      const { navigateTo, common, cleanup } = await createTestApp()

      // Seed a workout
      const workout = dbWorkoutBuilder()
        .withName('Leg Day')
        .withStrengthBlock()
        .build()
      await db.workouts.add(workout)

      // Navigate to history view
      await navigateTo({ name: RouteNames.History })
      await expect.element(page.getByText('Leg Day')).toBeVisible()

      // Swipe and delete
      const workoutCard = await page.getByText('Leg Day').element()
      const swipeableContainer = getSwipeableContainer(workoutCard)
      await simulateSwipeLeft(swipeableContainer)
      await userEvent.click(page.getByRole('button', { name: /delete/i }))

      // Confirm deletion
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Delete'))

      // Workout should be removed from the list
      await expect.element(page.getByText('Leg Day')).not.toBeInTheDocument()

      // Verify it's deleted from database
      const count = await db.workouts.count()
      expect(count).toBe(0)

      cleanup()
    })

    it('keeps workout in list when cancel is clicked', async () => {
      const { navigateTo, common, cleanup } = await createTestApp()

      // Seed a workout
      const workout = dbWorkoutBuilder()
        .withName('Push Day')
        .withStrengthBlock()
        .build()
      await db.workouts.add(workout)

      // Navigate to history view
      await navigateTo({ name: RouteNames.History })
      await expect.element(page.getByText('Push Day')).toBeVisible()

      // Swipe and click delete
      const workoutCard = await page.getByText('Push Day').element()
      const swipeableContainer = getSwipeableContainer(workoutCard)
      await simulateSwipeLeft(swipeableContainer)
      await userEvent.click(page.getByRole('button', { name: /delete/i }))

      // Click cancel in dialog
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Cancel'))

      // Workout should still be visible
      await expect.element(page.getByText('Push Day')).toBeVisible()

      // Verify it's still in database
      const count = await db.workouts.count()
      expect(count).toBe(1)

      cleanup()
    })

    it('shows empty state after deleting last workout in history', async () => {
      const { navigateTo, common, cleanup } = await createTestApp()

      // Seed a single workout
      const workout = dbWorkoutBuilder()
        .withName('Only Workout')
        .withStrengthBlock()
        .build()
      await db.workouts.add(workout)

      // Navigate to history view
      await navigateTo({ name: RouteNames.History })
      await expect.element(page.getByText('Only Workout')).toBeVisible()

      // Swipe and delete
      const workoutCard = await page.getByText('Only Workout').element()
      const swipeableContainer = getSwipeableContainer(workoutCard)
      await simulateSwipeLeft(swipeableContainer)
      await userEvent.click(page.getByRole('button', { name: /delete/i }))

      // Confirm deletion
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Delete'))

      // Empty state should now be visible
      await expect.element(page.getByText(/no workouts yet/i)).toBeVisible()

      cleanup()
    })

    it('updates month grouping when workout is deleted', async () => {
      const { navigateTo, common, cleanup } = await createTestApp()

      const now = Date.now()
      const oneMonthAgo = now - 31 * 24 * 60 * 60 * 1000

      // Seed workouts in different months
      await db.workouts.bulkAdd([
        dbWorkoutBuilder()
          .withName('Recent Workout')
          .withStrengthBlock()
          .withTimestamps(now - 3_600_000, now)
          .build(),
        dbWorkoutBuilder()
          .withName('Old Workout')
          .withStrengthBlock()
          .withTimestamps(oneMonthAgo - 3_600_000, oneMonthAgo)
          .build(),
      ])

      // Navigate to history view
      await navigateTo({ name: RouteNames.History })
      await expect.element(page.getByText('Recent Workout')).toBeVisible()
      await expect.element(page.getByText('Old Workout')).toBeVisible()

      // Delete the recent workout
      const workoutCard = await page.getByText('Recent Workout').element()
      const swipeableContainer = getSwipeableContainer(workoutCard)
      await simulateSwipeLeft(swipeableContainer)
      await userEvent.click(page.getByRole('button', { name: /delete/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Delete'))

      // Recent workout should be gone, old one should remain
      await expect.element(page.getByText('Recent Workout')).not.toBeInTheDocument()
      await expect.element(page.getByText('Old Workout')).toBeVisible()

      cleanup()
    })

    it('closes previously swiped card when swiping another', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed multiple workouts
      const workout1 = dbWorkoutBuilder()
        .withName('Workout One')
        .withStrengthBlock()
        .build()
      const workout2 = dbWorkoutBuilder()
        .withName('Workout Two')
        .withStrengthBlock()
        .build()
      await db.workouts.bulkAdd([workout1, workout2])

      // Navigate to history view
      await navigateTo({ name: RouteNames.History })
      await expect.element(page.getByText('Workout One')).toBeVisible()
      await expect.element(page.getByText('Workout Two')).toBeVisible()

      // Swipe first card
      const card1 = await page.getByText('Workout One').element()
      const swipeable1 = getSwipeableContainer(card1)
      await simulateSwipeLeft(swipeable1)

      // First delete button should be visible
      const deleteButtons = await page.getByRole('button', { name: /delete/i }).all()
      expect(deleteButtons.length).toBe(1)

      // Swipe second card
      const card2 = await page.getByText('Workout Two').element()
      const swipeable2 = getSwipeableContainer(card2)
      await simulateSwipeLeft(swipeable2)

      // Only second delete button should be visible now
      const visibleDeleteButtons = await page.getByRole('button', { name: /delete/i }).all()
      expect(visibleDeleteButtons.length).toBe(1)

      cleanup()
    })
  })
})
