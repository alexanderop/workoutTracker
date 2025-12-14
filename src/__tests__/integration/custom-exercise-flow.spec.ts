import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Custom Exercise Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('creates a custom exercise and displays it in the exercises view', async () => {
    const { common, getByRole, queryByText, cleanup } = await createTestApp()

    // Step 1: Navigate to exercises view
    await common.navigateToExercises()

    // Step 2: Click create custom exercise button
    const createButton = getByRole('button', { name: /create.*custom/i })
    await userEvent.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    // Step 3: Fill in exercise name
    const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
    await userEvent.fill(nameInput, 'My Awesome Lift')

    // Step 4: Save the exercise
    const saveButton = getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)

    // Step 5: Should navigate back to exercises view
    await common.waitForRoute(/^\/exercises$/)

    // Step 6: Assert custom exercise appears in the list
    await waitFor(() => {
      expect(queryByText('My Awesome Lift')).toBeTruthy()
    })

    cleanup()
  })

  it('creates a custom exercise and shows it in the add exercise dialog', async () => {
    const { common, router, getByRole, queryByText, cleanup } = await createTestApp()

    // Create custom exercise via UI
    await common.navigateToExercises()

    const createButton = getByRole('button', { name: /create.*custom/i })
    await userEvent.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
    await userEvent.fill(nameInput, 'Custom Compound Move')

    const saveButton = getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)
    await common.waitForRoute(/^\/exercises$/)

    // Now start a workout and check the add exercise dialog
    await router.push({ name: RouteNames.Home })
    await userEvent.click(getByRole('button', { name: /start new workout/i }))
    await userEvent.click(getByRole('button', { name: /add.*block/i }))
    await common.waitForDialog()

    // Assert: Custom exercise appears in the dialog
    await waitFor(() => {
      expect(queryByText('Custom Compound Move')).toBeTruthy()
    })

    cleanup()
  })

  it('finds created custom exercise via search', async () => {
    const { common, getByRole, queryByText, cleanup } = await createTestApp()

    // Create custom exercise with unique name
    await common.navigateToExercises()

    const createButton = getByRole('button', { name: /create.*custom/i })
    await userEvent.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
    await userEvent.fill(nameInput, 'Zyzz Special Curl')

    const saveButton = getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)
    await common.waitForRoute(/^\/exercises$/)

    // Search for the custom exercise
    const searchInput = screen.getByPlaceholderText(/search/i)
    await userEvent.fill(searchInput, 'Zyzz')

    // Assert: Custom exercise found via search
    await waitFor(() => {
      expect(queryByText('Zyzz Special Curl')).toBeTruthy()
    })

    cleanup()
  })

  describe('Form Validation', () => {
    it('disables save button when exercise name is empty', async () => {
      const { common, getByRole, cleanup } = await createTestApp()

      // Navigate to create exercise page
      await common.navigateToExercises()
      await userEvent.click(getByRole('button', { name: /create.*custom/i }))
      await common.waitForRoute(/^\/create-exercise$/)

      // Assert save button is disabled when name is empty
      const saveButton = getByRole('button', { name: /save/i })
      expect(saveButton.hasAttribute('disabled')).toBe(true)

      cleanup()
    })

    it('disables save button when name contains only whitespace', async () => {
      const { common, getByRole, cleanup } = await createTestApp()

      // Navigate to create exercise page
      await common.navigateToExercises()
      await userEvent.click(getByRole('button', { name: /create.*custom/i }))
      await common.waitForRoute(/^\/create-exercise$/)

      // Type whitespace-only name
      const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
      await userEvent.fill(nameInput, '   ')

      // Assert save button remains disabled
      const saveButton = getByRole('button', { name: /save/i })
      expect(saveButton.hasAttribute('disabled')).toBe(true)

      cleanup()
    })

    it('enables save button when valid name is entered', async () => {
      const { common, getByRole, cleanup } = await createTestApp()

      // Navigate to create exercise page
      await common.navigateToExercises()
      await userEvent.click(getByRole('button', { name: /create.*custom/i }))
      await common.waitForRoute(/^\/create-exercise$/)

      // Initially disabled
      const saveButton = getByRole('button', { name: /save/i })
      expect(saveButton.hasAttribute('disabled')).toBe(true)

      // Type valid name
      const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
      await userEvent.fill(nameInput, 'Valid Exercise')

      // Assert save button is now enabled
      await waitFor(() => {
        expect(saveButton.hasAttribute('disabled')).toBe(false)
      })

      cleanup()
    })
  })

  describe('Full User Journey', () => {
    it('creates custom exercise and uses it to complete a workout', async () => {
      const { builder, common, workout, router, getByRole, queryByText, queryByRole, cleanup } =
        await createTestApp()

      // ========================================
      // PHASE 1: Create custom exercise
      // ========================================
      await common.navigateToExercises()
      await userEvent.click(getByRole('button', { name: /create.*custom/i }))
      await common.waitForRoute(/^\/create-exercise$/)

      const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
      await userEvent.fill(nameInput, 'My Custom Lift')
      await userEvent.click(getByRole('button', { name: /save/i }))
      await common.waitForRoute(/^\/exercises$/)

      // ========================================
      // PHASE 2: Start new workout
      // ========================================
      await router.push({ name: RouteNames.Home })
      await userEvent.click(getByRole('button', { name: /start new workout/i }))
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // ========================================
      // PHASE 3: Add custom exercise as block
      // ========================================
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('My Custom Lift'))
      await common.waitForDialogClose()

      // ========================================
      // PHASE 4: Start workout and complete a set
      // ========================================
      await builder.startWorkout()
      await waitFor(() => {
        expect(queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Fill and complete a set
      await workout.fillCardSetAndComplete({ weight: '60', reps: '12', rir: '3' })

      // ========================================
      // PHASE 5: Finish workout
      // ========================================
      await waitFor(() => expect(workout.getMenuTrigger()).toBeTruthy())
      await userEvent.click(workout.getMenuTrigger())

      await waitFor(() => {
        expect(queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
      })
      await userEvent.click(getByRole('menuitem', { name: /end workout/i }))

      await common.waitForDialog()
      const workoutNameInput = getByRole('textbox', { name: /workout name/i })
      await userEvent.clear(workoutNameInput)
      await userEvent.fill(workoutNameInput, 'Custom Exercise Session')
      await userEvent.click(common.getDialogButton('Finish Workout'))

      // ========================================
      // PHASE 6: Wait for completion screen
      // ========================================
      await waitFor(() => {
        expect(queryByText(/workout complete/i)).toBeTruthy()
      })

      // Wait for View Details button to be clickable (animation needs to complete)
      const viewDetailsButton = await waitFor(
        () => {
          const button = getByRole('button', { name: /view details/i })
          // Ensure button animation has started (not opacity-0)
          if (button.classList.contains('opacity-0')) {
            throw new Error('Button still has opacity-0')
          }
          return button
        },
        { timeout: 2000 },
      )
      // Wait for animation to complete (100ms enter delay + 600ms animation delay + 500ms animation)
      await new Promise((resolve) => setTimeout(resolve, 700))
      await userEvent.click(viewDetailsButton)

      // ========================================
      // PHASE 7: Verify summary
      // ========================================
      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })
  })
})
