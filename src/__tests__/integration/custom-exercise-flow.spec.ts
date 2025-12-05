import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
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
    const app = await createTestApp()

    // Step 1: Navigate to exercises view
    const exercisesNavButton = app.getByRole('button', { name: /exercises/i })
    await app.user.click(exercisesNavButton)
    await app.waitForRoute(/^\/exercises$/)

    // Step 2: Click create custom exercise button
    const createButton = app.getByRole('button', { name: /create.*custom/i })
    await app.user.click(createButton)
    await app.waitForRoute(/^\/create-exercise$/)

    // Step 3: Fill in exercise name
    const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
    await app.user.type(nameInput, 'My Awesome Lift')

    // Step 4: Save the exercise
    const saveButton = app.getByRole('button', { name: /save/i })
    await app.user.click(saveButton)

    // Step 5: Should navigate back to exercises view
    await app.waitForRoute(/^\/exercises$/)

    // Step 6: Assert custom exercise appears in the list
    await waitFor(() => {
      expect(app.queryByText('My Awesome Lift')).toBeTruthy()
    })

    app.cleanup()
  })

  it('creates a custom exercise and shows it in the add exercise dialog', async () => {
    const app = await createTestApp()

    // Create custom exercise via UI
    const exercisesNavButton = app.getByRole('button', { name: /exercises/i })
    await app.user.click(exercisesNavButton)
    await app.waitForRoute(/^\/exercises$/)

    const createButton = app.getByRole('button', { name: /create.*custom/i })
    await app.user.click(createButton)
    await app.waitForRoute(/^\/create-exercise$/)

    const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
    await app.user.type(nameInput, 'Custom Compound Move')

    const saveButton = app.getByRole('button', { name: /save/i })
    await app.user.click(saveButton)
    await app.waitForRoute(/^\/exercises$/)

    // Now start a workout and check the add exercise dialog
    await app.navigateTo('/')
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    await app.user.click(app.getByRole('button', { name: /add.*block/i }))
    await app.waitForDialog()

    // Assert: Custom exercise appears in the dialog
    await waitFor(() => {
      expect(app.queryByText('Custom Compound Move')).toBeTruthy()
    })

    app.cleanup()
  })

  it('finds created custom exercise via search', async () => {
    const app = await createTestApp()

    // Create custom exercise with unique name
    const exercisesNavButton = app.getByRole('button', { name: /exercises/i })
    await app.user.click(exercisesNavButton)
    await app.waitForRoute(/^\/exercises$/)

    const createButton = app.getByRole('button', { name: /create.*custom/i })
    await app.user.click(createButton)
    await app.waitForRoute(/^\/create-exercise$/)

    const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
    await app.user.type(nameInput, 'Zyzz Special Curl')

    const saveButton = app.getByRole('button', { name: /save/i })
    await app.user.click(saveButton)
    await app.waitForRoute(/^\/exercises$/)

    // Search for the custom exercise
    const searchInput = screen.getByPlaceholderText(/search/i)
    await app.user.type(searchInput, 'Zyzz')

    // Assert: Custom exercise found via search
    await waitFor(() => {
      expect(app.queryByText('Zyzz Special Curl')).toBeTruthy()
    })

    app.cleanup()
  })

  describe('Form Validation', () => {
    it('disables save button when exercise name is empty', async () => {
      const app = await createTestApp()

      // Navigate to create exercise page
      await app.user.click(app.getByRole('button', { name: /exercises/i }))
      await app.waitForRoute(/^\/exercises$/)
      await app.user.click(app.getByRole('button', { name: /create.*custom/i }))
      await app.waitForRoute(/^\/create-exercise$/)

      // Assert save button is disabled when name is empty
      const saveButton = app.getByRole('button', { name: /save/i })
      expect(saveButton.hasAttribute('disabled')).toBe(true)

      app.cleanup()
    })

    it('disables save button when name contains only whitespace', async () => {
      const app = await createTestApp()

      // Navigate to create exercise page
      await app.user.click(app.getByRole('button', { name: /exercises/i }))
      await app.waitForRoute(/^\/exercises$/)
      await app.user.click(app.getByRole('button', { name: /create.*custom/i }))
      await app.waitForRoute(/^\/create-exercise$/)

      // Type whitespace-only name
      const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
      await app.user.type(nameInput, '   ')

      // Assert save button remains disabled
      const saveButton = app.getByRole('button', { name: /save/i })
      expect(saveButton.hasAttribute('disabled')).toBe(true)

      app.cleanup()
    })

    it('enables save button when valid name is entered', async () => {
      const app = await createTestApp()

      // Navigate to create exercise page
      await app.user.click(app.getByRole('button', { name: /exercises/i }))
      await app.waitForRoute(/^\/exercises$/)
      await app.user.click(app.getByRole('button', { name: /create.*custom/i }))
      await app.waitForRoute(/^\/create-exercise$/)

      // Initially disabled
      const saveButton = app.getByRole('button', { name: /save/i })
      expect(saveButton.hasAttribute('disabled')).toBe(true)

      // Type valid name
      const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
      await app.user.type(nameInput, 'Valid Exercise')

      // Assert save button is now enabled
      await waitFor(() => {
        expect(saveButton.hasAttribute('disabled')).toBe(false)
      })

      app.cleanup()
    })
  })

  describe('Full User Journey', () => {
    it('creates custom exercise and uses it to complete a workout', async () => {
      const app = await createTestApp()

      // ========================================
      // PHASE 1: Create custom exercise
      // ========================================
      await app.user.click(app.getByRole('button', { name: /exercises/i }))
      await app.waitForRoute(/^\/exercises$/)
      await app.user.click(app.getByRole('button', { name: /create.*custom/i }))
      await app.waitForRoute(/^\/create-exercise$/)

      const nameInput = screen.getByPlaceholderText(/name.*e\.g\./i)
      await app.user.type(nameInput, 'My Custom Lift')
      await app.user.click(app.getByRole('button', { name: /save/i }))
      await app.waitForRoute(/^\/exercises$/)

      // ========================================
      // PHASE 2: Start new workout
      // ========================================
      await app.navigateTo('/')
      await app.user.click(app.getByRole('button', { name: /get started/i }))
      expect(app.router.currentRoute.value.path).toBe('/workout/active')

      // ========================================
      // PHASE 3: Add custom exercise as block
      // ========================================
      await app.user.click(app.getByRole('button', { name: /add first block/i }))
      await app.waitForDialog()
      await app.user.click(app.getDialogButton('My Custom Lift'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

      // ========================================
      // PHASE 4: Start workout and complete a set
      // ========================================
      await app.startWorkout()
      await waitFor(() => {
        expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Fill in set data
      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
      const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

      await app.user.type(weightInput, '60')
      await app.user.type(repsInput, '12')
      await app.user.type(rirInput, '3')
      await app.user.click(app.getByRole('button', { name: /complete set/i }))

      // ========================================
      // PHASE 5: Finish workout
      // ========================================
      await waitFor(() => expect(app.getMenuTrigger()).toBeTruthy())
      await app.user.click(app.getMenuTrigger())

      await waitFor(() => {
        expect(app.queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
      })
      await app.user.click(app.getByRole('menuitem', { name: /end workout/i }))

      await app.waitForDialog()
      const workoutNameInput = app.getByRole('textbox', { name: /workout name/i })
      await app.user.clear(workoutNameInput)
      await app.user.type(workoutNameInput, 'Custom Exercise Session')
      await app.user.click(app.getDialogButton('Finish Workout'))

      // ========================================
      // PHASE 6: Verify summary
      // ========================================
      await app.waitForRoute(/^\/workout\/summary\//)
      expect(app.router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      app.cleanup()
    })
  })
})
