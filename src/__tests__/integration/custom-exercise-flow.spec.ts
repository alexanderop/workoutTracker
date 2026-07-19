import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'

describe('Custom Exercise Flow', () => {
  it('creates a custom exercise and displays it in the exercises view', async ({
    createTestApp,
  }) => {
    const { common, exercises, getByRole } = await createTestApp()

    // Step 1: Navigate to exercises view
    await common.navigateToExercises()

    // Step 2: Click create custom exercise button
    const createButton = getByRole('button', { name: /create.*custom/i })
    await userEvent.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    // Step 3: Fill in exercise name and required muscle group (Finding M5)
    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await userEvent.fill(nameInput, 'My Awesome Lift')
    await exercises.selectMuscle('Back')

    // Step 4: Save the exercise
    const saveButton = getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)

    // Step 5: Should navigate back to exercises view
    await common.waitForRoute(/^\/exercises$/)

    // Step 6: Assert custom exercise appears in the list
    await expect.element(page.getByText('My Awesome Lift')).toBeVisible()
  })

  it('creates a custom exercise and shows it in the add exercise dialog', async ({
    createTestApp,
  }) => {
    const { common, exercises, router, getByRole } = await createTestApp()

    // Create custom exercise via UI
    await common.navigateToExercises()

    const createButton = getByRole('button', { name: /create.*custom/i })
    await userEvent.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await userEvent.fill(nameInput, 'Custom Compound Move')
    await exercises.selectMuscle('Chest')

    const saveButton = getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)
    await common.waitForRoute(/^\/exercises$/)

    // Now start a workout and check the add exercise dialog
    await router.push({ name: RouteNames.Home })
    const startButton = getByRole('button', { name: /start new workout/i })
    await userEvent.click(startButton)
    const addBlockButton = getByRole('button', { name: /add.*block/i })
    await userEvent.click(addBlockButton)
    await common.waitForDialog()

    // Assert: Custom exercise appears in the dialog
    await expect.element(page.getByText('Custom Compound Move')).toBeVisible()
  })

  it('finds created custom exercise via search', async ({ createTestApp }) => {
    const { common, exercises, getByRole } = await createTestApp()

    // Create custom exercise with unique name
    await common.navigateToExercises()

    const createButton = getByRole('button', { name: /create.*custom/i })
    await userEvent.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await userEvent.fill(nameInput, 'Zyzz Special Curl')
    await exercises.selectMuscle('Arms')

    const saveButton = getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)
    await common.waitForRoute(/^\/exercises$/)

    // Search for the custom exercise
    const searchInput = page.getByPlaceholder(/search/i)
    await userEvent.fill(searchInput, 'Zyzz')

    // Assert: Custom exercise found via search
    await expect.element(page.getByText('Zyzz Special Curl')).toBeVisible()
  })

  describe('Form Validation', () => {
    it('disables save button when exercise name is empty', async ({ createTestApp }) => {
      const { common, getByRole } = await createTestApp()

      // Navigate to create exercise page
      await common.navigateToExercises()
      const createButton = getByRole('button', { name: /create.*custom/i })
      await userEvent.click(createButton)
      await common.waitForRoute(/^\/create-exercise$/)

      // Assert save button is disabled when name is empty
      const saveButton = getByRole('button', { name: /save/i })
      await expect.element(saveButton).toBeDisabled()
    })

    it('disables save button when name contains only whitespace', async ({ createTestApp }) => {
      const { common, getByRole } = await createTestApp()

      // Navigate to create exercise page
      await common.navigateToExercises()
      const createButton = getByRole('button', { name: /create.*custom/i })
      await userEvent.click(createButton)
      await common.waitForRoute(/^\/create-exercise$/)

      // Type whitespace-only name
      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await userEvent.fill(nameInput, ' '.repeat(3))

      // Assert save button remains disabled
      const saveButton = getByRole('button', { name: /save/i })
      await expect.element(saveButton).toBeDisabled()
    })

    it('keeps save disabled with only a name -- a muscle group is also required (Finding M5)', async ({
      createTestApp,
    }) => {
      const { common, getByRole } = await createTestApp()

      // Navigate to create exercise page
      await common.navigateToExercises()
      const createButton = getByRole('button', { name: /create.*custom/i })
      await userEvent.click(createButton)
      await common.waitForRoute(/^\/create-exercise$/)

      // Initially disabled
      const saveButton = getByRole('button', { name: /save/i })
      await expect.element(saveButton).toBeDisabled()

      // Type valid name
      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await userEvent.fill(nameInput, 'Valid Exercise')

      // Name alone is not enough -- a muscle-less exercise is invisible in
      // every filtered library view, so save stays disabled.
      await expect.element(saveButton).toBeDisabled()
    })

    it('enables save button when a valid name and muscle group are entered', async ({
      createTestApp,
    }) => {
      const { common, exercises, getByRole } = await createTestApp()

      // Navigate to create exercise page
      await common.navigateToExercises()
      const createButton = getByRole('button', { name: /create.*custom/i })
      await userEvent.click(createButton)
      await common.waitForRoute(/^\/create-exercise$/)

      // Type valid name
      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await userEvent.fill(nameInput, 'Valid Exercise')

      const saveButton = getByRole('button', { name: /save/i })
      await expect.element(saveButton).toBeDisabled()

      // Selecting a muscle group is what enables save
      await exercises.selectMuscle('Legs')

      await expect.element(saveButton).not.toBeDisabled()
    })
  })

  describe('Full User Journey', () => {
    it('creates custom exercise and uses it to complete a workout', async ({ createTestApp }) => {
      const { builder, common, exercises, workout, router, getByRole } = await createTestApp()

      // ========================================
      // PHASE 1: Create custom exercise
      // ========================================
      await common.navigateToExercises()
      const createButton = getByRole('button', { name: /create.*custom/i })
      await userEvent.click(createButton)
      await common.waitForRoute(/^\/create-exercise$/)

      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await userEvent.fill(nameInput, 'My Custom Lift')
      await exercises.selectMuscle('Back')
      const saveButton = getByRole('button', { name: /save/i })
      await userEvent.click(saveButton)
      await common.waitForRoute(/^\/exercises$/)

      // ========================================
      // PHASE 2: Start new workout
      // ========================================
      await router.push({ name: RouteNames.Home })
      const startButton = getByRole('button', { name: /start new workout/i })
      await userEvent.click(startButton)
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // ========================================
      // PHASE 3: Add custom exercise as block
      // ========================================
      const addBlockButton = getByRole('button', { name: /add first block/i })
      await userEvent.click(addBlockButton)
      await common.waitForDialog()
      const dialogButton = common.getDialogButton('My Custom Lift')
      await userEvent.click(dialogButton)
      await common.waitForDialogClose()

      // ========================================
      // PHASE 4: Start workout and complete a set
      // ========================================
      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Fill and complete a set
      await workout.fillCardSetAndComplete({ weight: '60', reps: '12', rir: '3' })

      // ========================================
      // PHASE 5: Finish workout
      // ========================================
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      const menuTrigger = await workout.getMenuTrigger()
      await userEvent.click(menuTrigger)

      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      const endWorkoutItem = getByRole('menuitem', { name: /end workout/i })
      await userEvent.click(endWorkoutItem)

      await common.waitForDialog()
      const workoutNameInput = getByRole('textbox', { name: /workout name/i })
      await userEvent.clear(workoutNameInput)
      await userEvent.fill(workoutNameInput, 'Custom Exercise Session')
      const finishButton = common.getDialogButton('Finish Workout')
      await userEvent.click(finishButton)

      // ========================================
      // PHASE 6: Wait for completion screen
      // ========================================
      await expect.element(page.getByText(/workout complete/i)).toBeVisible()

      // Wait for View Details button to be clickable (animation needs to complete)
      const viewDetailsButton = page.getByRole('button', { name: /view details/i })
      await expect.element(viewDetailsButton, { timeout: 2000 }).toBeVisible()
      await expect.element(viewDetailsButton).not.toHaveClass('opacity-0')
      await viewDetailsButton.click()

      // ========================================
      // PHASE 7: Verify summary
      // ========================================
      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)
    })
  })
})
