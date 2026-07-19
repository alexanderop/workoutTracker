import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import {
  expectWorkoutCount,
  seedCompletedWorkout,
  seedCompletedWorkouts,
} from '../helpers/dbAssertions'
import { getSwipeableContainer, simulateSwipeLeft } from '../helpers/swipeHelpers'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'

/**
 * Integration tests for deleting workouts from the history view.
 * Tests the swipe-to-reveal-delete functionality.
 */
describe('History Delete Workout', () => {
  describe('Swipe to Reveal Delete', () => {
    it('reveals delete button when swiping left on history workout', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()

      // Seed a workout
      const workout = databaseWorkoutBuilder()
        .withName('Morning Workout')
        .withStrengthBlock()
        .build()
      await seedCompletedWorkout(workout)

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
    })

    it('shows confirmation dialog when delete button is tapped', async ({ createTestApp }) => {
      const { navigateTo, common } = await createTestApp()

      // Seed a workout
      const workout = databaseWorkoutBuilder()
        .withName('Evening Session')
        .withStrengthBlock()
        .build()
      await seedCompletedWorkout(workout)

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
    })

    it('removes workout from list after confirming delete', async ({ createTestApp }) => {
      const { navigateTo, common } = await createTestApp()

      // Seed a workout
      const workout = databaseWorkoutBuilder().withName('Leg Day').withStrengthBlock().build()
      await seedCompletedWorkout(workout)

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
      await expectWorkoutCount(0)
    })

    it('keeps workout in list when cancel is clicked', async ({ createTestApp }) => {
      const { navigateTo, common } = await createTestApp()

      // Seed a workout
      const workout = databaseWorkoutBuilder().withName('Push Day').withStrengthBlock().build()
      await seedCompletedWorkout(workout)

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
      await expectWorkoutCount(1)
    })

    it('shows empty state after deleting last workout in history', async ({ createTestApp }) => {
      const { navigateTo, common } = await createTestApp()

      // Seed a single workout
      const workout = databaseWorkoutBuilder().withName('Only Workout').withStrengthBlock().build()
      await seedCompletedWorkout(workout)

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
    })

    it('updates month grouping when workout is deleted', async ({ createTestApp }) => {
      const { navigateTo, common } = await createTestApp()

      const now = Date.now()
      const oneMonthAgo = now - 31 * 24 * 60 * 60 * 1000

      // Seed workouts in different months
      await seedCompletedWorkouts([
        databaseWorkoutBuilder()
          .withName('Recent Workout')
          .withStrengthBlock()
          .withTimestamps(now - 3_600_000, now)
          .build(),
        databaseWorkoutBuilder()
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
    })

    it('closes previously swiped card when swiping another', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()

      // Seed multiple workouts
      const workout1 = databaseWorkoutBuilder().withName('Workout One').withStrengthBlock().build()
      const workout2 = databaseWorkoutBuilder().withName('Workout Two').withStrengthBlock().build()
      await seedCompletedWorkouts([workout1, workout2])

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
      expect(deleteButtons).toHaveLength(1)

      // Swipe second card
      const card2 = await page.getByText('Workout Two').element()
      const swipeable2 = getSwipeableContainer(card2)
      await simulateSwipeLeft(swipeable2)

      // Only second delete button should be visible now
      const visibleDeleteButtons = await page.getByRole('button', { name: /delete/i }).all()
      expect(visibleDeleteButtons).toHaveLength(1)
    })
  })
})
