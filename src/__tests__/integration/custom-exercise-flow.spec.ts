import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { page } from '../helpers/locator'
import { expectElement, expectPoll } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Custom Exercise Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('creates a custom exercise and displays it in the exercises view', async () => {
    const { common, cleanup } = await createTestApp()

    // Step 1: Navigate to exercises view
    await common.navigateToExercises()

    // Step 2: Click create custom exercise button
    const createButton = page.getByRole('button', { name: /create.*custom/i })
    await createButton.click()
    await common.waitForRoute(/^\/create-exercise$/)

    // Step 3: Fill in exercise name
    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await nameInput.fill('My Awesome Lift')

    // Step 4: Save the exercise
    const saveButton = page.getByRole('button', { name: /save/i })
    await saveButton.click()

    // Step 5: Should navigate back to exercises view
    await common.waitForRoute(/^\/exercises$/)

    // Step 6: Assert custom exercise appears in the list
    await expectElement(page.getByText('My Awesome Lift')).toBeVisible()

    cleanup()
  })

  it('creates a custom exercise and shows it in the add exercise dialog', async () => {
    const { common, router, cleanup } = await createTestApp()

    // Create custom exercise via UI
    await common.navigateToExercises()

    const createButton = page.getByRole('button', { name: /create.*custom/i })
    await createButton.click()
    await common.waitForRoute(/^\/create-exercise$/)

    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await nameInput.fill('Custom Compound Move')

    const saveButton = page.getByRole('button', { name: /save/i })
    await saveButton.click()
    await common.waitForRoute(/^\/exercises$/)

    // Now start a workout and check the add exercise dialog
    await router.push({ name: RouteNames.Home })
    const startButton = page.getByRole('button', { name: /start new workout/i })
    await startButton.click()
    const addBlockButton = page.getByRole('button', { name: /add.*block/i })
    await addBlockButton.click()
    await common.waitForDialog()

    // Assert: Custom exercise appears in the dialog
    await expectElement(page.getByText('Custom Compound Move')).toBeVisible()

    cleanup()
  })

  it('finds created custom exercise via search', async () => {
    const { common, cleanup } = await createTestApp()

    // Create custom exercise with unique name
    await common.navigateToExercises()

    const createButton = page.getByRole('button', { name: /create.*custom/i })
    await createButton.click()
    await common.waitForRoute(/^\/create-exercise$/)

    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await nameInput.fill('Zyzz Special Curl')

    const saveButton = page.getByRole('button', { name: /save/i })
    await saveButton.click()
    await common.waitForRoute(/^\/exercises$/)

    // Search for the custom exercise
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('Zyzz')

    // Assert: Custom exercise found via search
    await expectElement(page.getByText('Zyzz Special Curl')).toBeVisible()

    cleanup()
  })

  describe('Form Validation', () => {
    it('disables save button when exercise name is empty', async () => {
      const { common, cleanup } = await createTestApp()

      // Navigate to create exercise page
      await common.navigateToExercises()
      const createButton = page.getByRole('button', { name: /create.*custom/i })
      await createButton.click()
      await common.waitForRoute(/^\/create-exercise$/)

      // Assert save button is disabled when name is empty
      const saveButton = page.getByRole('button', { name: /save/i })
      await expectElement(saveButton).toBeDisabled()

      cleanup()
    })

    it('disables save button when name contains only whitespace', async () => {
      const { common, cleanup } = await createTestApp()

      // Navigate to create exercise page
      await common.navigateToExercises()
      const createButton = page.getByRole('button', { name: /create.*custom/i })
      await createButton.click()
      await common.waitForRoute(/^\/create-exercise$/)

      // Type whitespace-only name
      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await nameInput.fill('   ')

      // Assert save button remains disabled
      const saveButton = page.getByRole('button', { name: /save/i })
      await expectElement(saveButton).toBeDisabled()

      cleanup()
    })

    it('enables save button when valid name is entered', async () => {
      const { common, cleanup } = await createTestApp()

      // Navigate to create exercise page
      await common.navigateToExercises()
      const createButton = page.getByRole('button', { name: /create.*custom/i })
      await createButton.click()
      await common.waitForRoute(/^\/create-exercise$/)

      // Initially disabled
      const saveButton = page.getByRole('button', { name: /save/i })
      await expectElement(saveButton).toBeDisabled()

      // Type valid name
      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await nameInput.fill('Valid Exercise')

      // Assert save button is now enabled
      await expectElement(saveButton).not.toBeDisabled()

      cleanup()
    })
  })

  describe('Full User Journey', () => {
    it('creates custom exercise and uses it to complete a workout', async () => {
      const { builder, common, workout, router, cleanup } =
        await createTestApp()

      // ========================================
      // PHASE 1: Create custom exercise
      // ========================================
      await common.navigateToExercises()
      const createButton = page.getByRole('button', { name: /create.*custom/i })
      await createButton.click()
      await common.waitForRoute(/^\/create-exercise$/)

      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await nameInput.fill('My Custom Lift')
      const saveButton = page.getByRole('button', { name: /save/i })
      await saveButton.click()
      await common.waitForRoute(/^\/exercises$/)

      // ========================================
      // PHASE 2: Start new workout
      // ========================================
      await router.push({ name: RouteNames.Home })
      const startButton = page.getByRole('button', { name: /start new workout/i })
      await startButton.click()
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // ========================================
      // PHASE 3: Add custom exercise as block
      // ========================================
      const addBlockButton = page.getByRole('button', { name: /add first block/i })
      await addBlockButton.click()
      await common.waitForDialog()
      const dialogButton = common.getDialogButton('My Custom Lift')
      await dialogButton.click()
      await common.waitForDialogClose()

      // ========================================
      // PHASE 4: Start workout and complete a set
      // ========================================
      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Fill and complete a set
      await workout.fillCardSetAndComplete({ weight: '60', reps: '12', rir: '3' })

      // ========================================
      // PHASE 5: Finish workout
      // ========================================
      await expectPoll(() => workout.getMenuTrigger()).toBeTruthy()
      const menuTrigger = await workout.getMenuTrigger()
      await menuTrigger.click()

      await expectElement(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      const endWorkoutItem = page.getByRole('menuitem', { name: /end workout/i })
      await endWorkoutItem.click()

      await common.waitForDialog()
      const workoutNameInput = page.getByRole('textbox', { name: /workout name/i })
      await workoutNameInput.clear()
      await workoutNameInput.fill('Custom Exercise Session')
      const finishButton = common.getDialogButton('Finish Workout')
      await finishButton.click()

      // ========================================
      // PHASE 6: Wait for completion screen
      // ========================================
      await expectElement(page.getByText(/workout complete/i)).toBeVisible()

      // Wait for View Details button to be clickable (animation needs to complete)
      const viewDetailsButton = page.getByRole('button', { name: /view details/i })
      await expectElement(viewDetailsButton, { timeout: 2000 }).toBeVisible()
      await expectElement(viewDetailsButton).not.toHaveClass('opacity-0')
      // Wait for animation to complete (100ms enter delay + 600ms animation delay + 500ms animation)
      await new Promise((resolve) => setTimeout(resolve, 700))
      await viewDetailsButton.click()

      // ========================================
      // PHASE 7: Verify summary
      // ========================================
      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })
  })
})
