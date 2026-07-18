import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import {
  expectWorkoutCount,
  seedCompletedWorkout,
  seedCompletedWorkouts,
} from '../helpers/dbAssertions'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { getSwipeableContainer, simulateSwipeLeft } from '../helpers/swipeHelpers'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'

/**
 * Integration tests for deleting workouts from the home page recent workouts section.
 * Tests the swipe-to-reveal-delete functionality.
 */
describe('Home Delete Workout', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Swipe to Reveal Delete', () => {
    it('reveals delete button when swiping left on recent workout', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed a workout
      const workout = databaseWorkoutBuilder()
        .withName('Morning Workout')
        .withStrengthBlock()
        .build()
      await seedCompletedWorkout(workout)

      // Navigate away and back to trigger reload of recent workouts
      await navigateTo({ name: RouteNames.History })
      await navigateTo({ name: RouteNames.Home })

      // Wait for recent workouts to load
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
      const workout = databaseWorkoutBuilder()
        .withName('Evening Session')
        .withStrengthBlock()
        .build()
      await seedCompletedWorkout(workout)

      // Navigate away and back to trigger reload
      await navigateTo({ name: RouteNames.History })
      await navigateTo({ name: RouteNames.Home })

      // Wait for recent workouts to load
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
      const workout = databaseWorkoutBuilder().withName('Leg Day').withStrengthBlock().build()
      await seedCompletedWorkout(workout)

      // Navigate away and back to trigger reload
      await navigateTo({ name: RouteNames.History })
      await navigateTo({ name: RouteNames.Home })

      // Wait for workout to appear
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

      cleanup()
    })

    it('keeps workout in list when cancel is clicked', async () => {
      const { navigateTo, common, cleanup } = await createTestApp()

      // Seed a workout
      const workout = databaseWorkoutBuilder().withName('Push Day').withStrengthBlock().build()
      await seedCompletedWorkout(workout)

      // Navigate away and back to trigger reload
      await navigateTo({ name: RouteNames.History })
      await navigateTo({ name: RouteNames.Home })

      // Wait for workout to appear
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

      cleanup()
    })

    it('closes previously swiped card when swiping another', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed multiple workouts
      const workout1 = databaseWorkoutBuilder().withName('Workout One').withStrengthBlock().build()
      const workout2 = databaseWorkoutBuilder().withName('Workout Two').withStrengthBlock().build()
      await seedCompletedWorkouts([workout1, workout2])

      // Navigate away and back to trigger reload
      await navigateTo({ name: RouteNames.History })
      await navigateTo({ name: RouteNames.Home })

      // Wait for both workouts to appear
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
      // (first card should have closed)
      const visibleDeleteButtons = await page.getByRole('button', { name: /delete/i }).all()
      expect(visibleDeleteButtons).toHaveLength(1)

      cleanup()
    })

    it('closes swipe when tapping card content', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed a workout
      const workout = databaseWorkoutBuilder().withName('Tap Test').withStrengthBlock().build()
      await seedCompletedWorkout(workout)

      // Navigate away and back to trigger reload
      await navigateTo({ name: RouteNames.History })
      await navigateTo({ name: RouteNames.Home })

      // Wait for workout to appear
      await expect.element(page.getByText('Tap Test')).toBeVisible()

      // Swipe to reveal delete
      const workoutCard = await page.getByText('Tap Test').element()
      const swipeableContainer = getSwipeableContainer(workoutCard)
      await simulateSwipeLeft(swipeableContainer)

      // Delete button should be visible
      await expect.element(page.getByRole('button', { name: /delete/i })).toBeVisible()

      // Click on the swipeable content to close it
      // We click the container itself rather than the text to avoid navigation
      // Find swipeable-content elements and click the one containing our workout text
      const swipeableContents = await page.getByTestId('swipeable-content').all()
      for (const content of swipeableContents) {
        const element = await content.element()
        if (element.textContent?.includes('Tap Test')) {
          await userEvent.click(element)
          break
        }
      }

      // Delete button should be removed from DOM after card closes
      await expect.poll(() => page.getByRole('button', { name: /delete/i }).query()).toBeNull()

      cleanup()
    })
  })
})
