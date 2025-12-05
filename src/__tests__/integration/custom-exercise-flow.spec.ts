import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

describe('Custom Exercise Flow', () => {
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

  it('creates a custom exercise and displays it in the exercises view', async () => {
    const { common, user, getByRole, queryByText, cleanup } = await createTestApp()

    // Step 1: Navigate to exercises view
    const exercisesNavButton = getByRole('button', { name: /exercises/i })
    await user.click(exercisesNavButton)
    await common.waitForRoute(/^\/exercises$/)

    // Step 2: Click create custom exercise button
    const createButton = getByRole('button', { name: /create.*custom/i })
    await user.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    // Step 3: Fill in exercise name
    const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
    await user.type(nameInput, 'My Awesome Lift')

    // Step 4: Save the exercise
    const saveButton = getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Step 5: Should navigate back to exercises view
    await common.waitForRoute(/^\/exercises$/)

    // Step 6: Assert custom exercise appears in the list
    await waitFor(() => {
      expect(queryByText('My Awesome Lift')).toBeTruthy()
    })

    cleanup()
  })

  it('creates a custom exercise and shows it in the add exercise dialog', async () => {
    const { common, router, user, getByRole, queryByText, cleanup } = await createTestApp()

    // Create custom exercise via UI
    const exercisesNavButton = getByRole('button', { name: /exercises/i })
    await user.click(exercisesNavButton)
    await common.waitForRoute(/^\/exercises$/)

    const createButton = getByRole('button', { name: /create.*custom/i })
    await user.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
    await user.type(nameInput, 'Custom Compound Move')

    const saveButton = getByRole('button', { name: /save/i })
    await user.click(saveButton)
    await common.waitForRoute(/^\/exercises$/)

    // Now start a workout and check the add exercise dialog
    await router.push('/')
    await user.click(getByRole('button', { name: /get started/i }))
    await user.click(getByRole('button', { name: /add.*block/i }))
    await common.waitForDialog()

    // Assert: Custom exercise appears in the dialog
    await waitFor(() => {
      expect(queryByText('Custom Compound Move')).toBeTruthy()
    })

    cleanup()
  })

  it('finds created custom exercise via search', async () => {
    const { common, user, getByRole, queryByText, cleanup } = await createTestApp()

    // Create custom exercise with unique name
    const exercisesNavButton = getByRole('button', { name: /exercises/i })
    await user.click(exercisesNavButton)
    await common.waitForRoute(/^\/exercises$/)

    const createButton = getByRole('button', { name: /create.*custom/i })
    await user.click(createButton)
    await common.waitForRoute(/^\/create-exercise$/)

    const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
    await user.type(nameInput, 'Zyzz Special Curl')

    const saveButton = getByRole('button', { name: /save/i })
    await user.click(saveButton)
    await common.waitForRoute(/^\/exercises$/)

    // Search for the custom exercise
    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'Zyzz')

    // Assert: Custom exercise found via search
    await waitFor(() => {
      expect(queryByText('Zyzz Special Curl')).toBeTruthy()
    })

    cleanup()
  })

  describe('Form Validation', () => {
    it('disables save button when exercise name is empty', async () => {
      const { common, user, getByRole, cleanup } = await createTestApp()

      // Navigate to create exercise page
      await user.click(getByRole('button', { name: /exercises/i }))
      await common.waitForRoute(/^\/exercises$/)
      await user.click(getByRole('button', { name: /create.*custom/i }))
      await common.waitForRoute(/^\/create-exercise$/)

      // Assert save button is disabled when name is empty
      const saveButton = getByRole('button', { name: /save/i })
      expect(saveButton.hasAttribute('disabled')).toBe(true)

      cleanup()
    })

    it('disables save button when name contains only whitespace', async () => {
      const { common, user, getByRole, cleanup } = await createTestApp()

      // Navigate to create exercise page
      await user.click(getByRole('button', { name: /exercises/i }))
      await common.waitForRoute(/^\/exercises$/)
      await user.click(getByRole('button', { name: /create.*custom/i }))
      await common.waitForRoute(/^\/create-exercise$/)

      // Type whitespace-only name
      const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
      await user.type(nameInput, '   ')

      // Assert save button remains disabled
      const saveButton = getByRole('button', { name: /save/i })
      expect(saveButton.hasAttribute('disabled')).toBe(true)

      cleanup()
    })

    it('enables save button when valid name is entered', async () => {
      const { common, user, getByRole, cleanup } = await createTestApp()

      // Navigate to create exercise page
      await user.click(getByRole('button', { name: /exercises/i }))
      await common.waitForRoute(/^\/exercises$/)
      await user.click(getByRole('button', { name: /create.*custom/i }))
      await common.waitForRoute(/^\/create-exercise$/)

      // Initially disabled
      const saveButton = getByRole('button', { name: /save/i })
      expect(saveButton.hasAttribute('disabled')).toBe(true)

      // Type valid name
      const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
      await user.type(nameInput, 'Valid Exercise')

      // Assert save button is now enabled
      await waitFor(() => {
        expect(saveButton.hasAttribute('disabled')).toBe(false)
      })

      cleanup()
    })
  })

  describe('Full User Journey', () => {
    it('creates custom exercise and uses it to complete a workout', async () => {
      const { builder, common, workout, router, user, getByRole, queryByText, queryByRole, cleanup } =
        await createTestApp()

      // ========================================
      // PHASE 1: Create custom exercise
      // ========================================
      await user.click(getByRole('button', { name: /exercises/i }))
      await common.waitForRoute(/^\/exercises$/)
      await user.click(getByRole('button', { name: /create.*custom/i }))
      await common.waitForRoute(/^\/create-exercise$/)

      const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
      await user.type(nameInput, 'My Custom Lift')
      await user.click(getByRole('button', { name: /save/i }))
      await common.waitForRoute(/^\/exercises$/)

      // ========================================
      // PHASE 2: Start new workout
      // ========================================
      await router.push('/')
      await user.click(getByRole('button', { name: /get started/i }))
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // ========================================
      // PHASE 3: Add custom exercise as block
      // ========================================
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('My Custom Lift'))
      await waitFor(() => expect(queryByRole('dialog')).toBeNull())

      // ========================================
      // PHASE 4: Start workout and complete a set
      // ========================================
      await builder.startWorkout()
      await waitFor(() => {
        expect(queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Fill in set data
      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
      const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

      await user.type(weightInput, '60')
      await user.type(repsInput, '12')
      await user.type(rirInput, '3')
      await user.click(getByRole('button', { name: /complete set/i }))

      // ========================================
      // PHASE 5: Finish workout
      // ========================================
      await waitFor(() => expect(workout.getMenuTrigger()).toBeTruthy())
      await user.click(workout.getMenuTrigger())

      await waitFor(() => {
        expect(queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
      })
      await user.click(getByRole('menuitem', { name: /end workout/i }))

      await common.waitForDialog()
      const workoutNameInput = getByRole('textbox', { name: /workout name/i })
      await user.clear(workoutNameInput)
      await user.type(workoutNameInput, 'Custom Exercise Session')
      await user.click(common.getDialogButton('Finish Workout'))

      // ========================================
      // PHASE 6: Verify summary
      // ========================================
      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })
  })
})
