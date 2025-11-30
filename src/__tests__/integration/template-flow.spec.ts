import { afterEach, describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/vue'
import { createTestApp } from '../helpers/createTestApp'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'
import { templatesRepository } from '@/db/repositories/templates'

describe('Template Flow Integration', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  describe('Create Template', () => {
    it('creates a new template with exercises from the workouts view', async () => {
      const app = await createTestApp()

      // Navigate to Workouts via bottom nav
      await app.user.click(app.getByRole('button', { name: /workouts/i }))
      expect(app.router.currentRoute.value.path).toBe('/workouts')

      // Wait for loading to complete
      await waitFor(() => {
        expect(app.queryByText(/loading/i)).toBeNull()
      })

      // Switch to Templates tab
      await app.user.click(app.getByRole('tab', { name: /templates/i }))

      // Click Create Template button
      await app.user.click(app.getByRole('button', { name: /create template/i }))
      expect(app.router.currentRoute.value.path).toBe('/templates/create')

      // Verify empty state message
      expect(app.getByText(/no exercises yet/i)).toBeDefined()

      // Save button should be disabled without name and exercises
      const saveButton = app.getByRole('button', { name: /save template/i })
      expect(saveButton).toHaveProperty('disabled', true)

      // Enter template name
      const nameInput = app.getByRole('textbox', { name: /template name/i })
      await app.user.type(nameInput, 'Push Day')

      // Save still disabled (no exercises)
      expect(saveButton).toHaveProperty('disabled', true)

      // Add first exercise
      await app.user.click(app.getByRole('button', { name: /add exercise/i }))
      await app.waitForDialog()
      await app.user.click(app.getDialogButton('Bench Press'))
      app.assertDialogClosed()

      // Verify exercise was added
      expect(app.getByText('Bench Press')).toBeDefined()
      expect(app.getByText('1')).toBeDefined() // Exercise count

      // Add second exercise
      await app.user.click(app.getByRole('button', { name: /add exercise/i }))
      await app.waitForDialog()
      await app.user.click(app.getDialogButton('Overhead Press'))
      app.assertDialogClosed()

      // Save button should now be enabled
      expect(saveButton).toHaveProperty('disabled', false)

      // Save the template
      await app.user.click(saveButton)

      // Wait for navigation to template detail
      await app.waitForRoute(/^\/templates\//)
      expect(app.router.currentRoute.value.path).toMatch(/^\/templates\//)

      // Verify template was saved by checking the detail view
      expect(await app.findByRole('heading', { name: /push day/i })).toBeDefined()
      expect(app.getByText('2 exercises')).toBeDefined()

      app.cleanup()
    })

    it('allows canceling template creation', async () => {
      const app = await createTestApp()
      await app.navigateTo('/templates/create')

      // Enter some data
      const nameInput = app.getByRole('textbox', { name: /template name/i })
      await app.user.type(nameInput, 'Test Template')

      // Click cancel
      await app.user.click(app.getByRole('button', { name: /cancel/i }))

      // Verify navigated back (router.back() goes to the previous page)
      await waitFor(() => {
        expect(app.router.currentRoute.value.path).not.toBe('/templates/create')
      })

      app.cleanup()
    })

    it('allows removing exercises from template before saving', async () => {
      const app = await createTestApp()
      await app.navigateTo('/templates/create')

      // Enter template name
      const nameInput = app.getByRole('textbox', { name: /template name/i })
      await app.user.type(nameInput, 'Test Template')

      // Add an exercise
      await app.user.click(app.getByRole('button', { name: /add exercise/i }))
      await app.waitForDialog()
      await app.user.click(app.getDialogButton('Bench Press'))
      app.assertDialogClosed()

      // Verify exercise count shows 1
      expect(app.getByText('1')).toBeDefined()

      // Remove the exercise
      await app.user.click(app.getByRole('button', { name: /remove exercise/i }))

      // Verify empty state returns
      expect(app.getByText(/no exercises yet/i)).toBeDefined()

      // Save button should be disabled again
      const saveButton = app.getByRole('button', { name: /save template/i })
      expect(saveButton).toHaveProperty('disabled', true)

      app.cleanup()
    })
  })

  describe('Template Detail View', () => {
    it('displays template details and allows editing', async () => {
      // Create a template first
      const template = await templatesRepository.create({
        name: 'Leg Day',
        blocks: [
          {
            kind: 'strength',
            exerciseDefinitionId: null,
            name: 'Squat',
            equipment: 'Barbell',
            targetReps: 8,
            thumbnail: '🏋️',
            defaultSetCount: 4,
          },
        ],
      })

      const app = await createTestApp()
      await app.navigateTo(`/templates/${template.id}`)

      // Wait for loading to complete
      await waitFor(() => {
        expect(app.queryByText(/loading/i)).toBeNull()
      })

      // Verify template details display
      expect(app.getByRole('heading', { name: /leg day/i })).toBeDefined()
      expect(app.getByText('1 exercises')).toBeDefined()
      expect(app.getByText('Squat')).toBeDefined()

      // Edit template name
      const nameInput = app.getByRole('textbox', { name: /template name/i })
      await app.user.clear(nameInput)
      await app.user.type(nameInput, 'Heavy Leg Day')

      // Verify edit buttons appear when changes are made
      expect(app.getByRole('button', { name: /save changes/i })).toBeDefined()
      expect(app.getByRole('button', { name: /cancel/i })).toBeDefined()

      // Save changes
      await app.user.click(app.getByRole('button', { name: /save changes/i }))

      // Wait for save to complete
      await waitFor(async () => {
        const updated = await templatesRepository.getById(template.id)
        expect(updated?.name).toBe('Heavy Leg Day')
      })

      app.cleanup()
    })

    it('allows adding exercises to existing template', async () => {
      // Create a template first
      const template = await templatesRepository.create({
        name: 'Upper Body',
        blocks: [
          {
            kind: 'strength',
            exerciseDefinitionId: null,
            name: 'Bench Press',
            equipment: 'Barbell',
            targetReps: 8,
            thumbnail: '🏋️',
            defaultSetCount: 3,
          },
        ],
      })

      const app = await createTestApp()
      await app.navigateTo(`/templates/${template.id}`)

      // Wait for loading to complete and content to render
      await waitFor(() => {
        expect(app.queryByText(/loading/i)).toBeNull()
        expect(app.getByText('Bench Press')).toBeDefined()
      })

      // Add exercise
      await app.user.click(app.getByRole('button', { name: /add exercise/i }))
      await app.waitForDialog()
      await app.user.click(app.getDialogButton('Dumbbell Curl'))
      app.assertDialogClosed()

      // Verify exercise count updated
      expect(app.getByText('2 exercises')).toBeDefined()

      // Save changes
      await app.user.click(app.getByRole('button', { name: /save changes/i }))

      // Verify changes persisted
      await waitFor(async () => {
        const updated = await templatesRepository.getById(template.id)
        expect(updated?.blocks.length).toBe(2)
      })

      app.cleanup()
    })
  })

  describe('Start Workout from Template', () => {
    it('starts a new workout with exercises from template', async () => {
      // Create a template with multiple exercises
      const template = await templatesRepository.create({
        name: 'Push Day',
        blocks: [
          {
            kind: 'strength',
            exerciseDefinitionId: null,
            name: 'Bench Press',
            equipment: 'Barbell',
            targetReps: 8,
            thumbnail: '🏋️',
            defaultSetCount: 3,
          },
          {
            kind: 'strength',
            exerciseDefinitionId: null,
            name: 'Overhead Press',
            equipment: 'Barbell',
            targetReps: 8,
            thumbnail: '🏋️',
            defaultSetCount: 3,
          },
        ],
      })

      const app = await createTestApp()
      await app.navigateTo(`/templates/${template.id}`)

      // Wait for loading to complete and content to render
      await waitFor(() => {
        expect(app.queryByText(/loading/i)).toBeNull()
        expect(app.getByText('Bench Press')).toBeDefined()
      })

      // Click Start Workout
      await app.user.click(app.getByRole('button', { name: /start workout/i }))

      // Verify navigated to active workout
      await app.waitForRoute(/^\/workout\/active/)

      // Verify first exercise from template is displayed (Bench Press is selected)
      expect(app.getByRole('heading', { name: /bench press/i })).toBeDefined()

      // Verify both exercises are in the carousel
      const exerciseButtons = app.getCarouselExerciseButtons()
      expect(exerciseButtons.length).toBe(2)

      // Verify each exercise has 3 sets (from template)
      const rows = document.querySelectorAll('tbody tr')
      expect(rows.length).toBe(3)

      app.cleanup()
    })

    it('updates template lastUsedAt when starting workout', async () => {
      const template = await templatesRepository.create({
        name: 'Test Template',
        blocks: [
          {
            kind: 'strength',
            exerciseDefinitionId: null,
            name: 'Squat',
            equipment: 'Barbell',
            targetReps: 8,
            thumbnail: '🏋️',
            defaultSetCount: 3,
          },
        ],
      })

      // Verify initial lastUsedAt is null
      expect(template.lastUsedAt).toBeNull()

      const app = await createTestApp()
      await app.navigateTo(`/templates/${template.id}`)

      // Wait for loading to complete and content to render
      await waitFor(() => {
        expect(app.queryByText(/loading/i)).toBeNull()
        expect(app.getByText('Squat')).toBeDefined()
      })

      // Start workout
      await app.user.click(app.getByRole('button', { name: /start workout/i }))
      await app.waitForRoute(/^\/workout\/active/)

      // Verify lastUsedAt was updated
      const updated = await templatesRepository.getById(template.id)
      expect(updated?.lastUsedAt).not.toBeNull()

      app.cleanup()
    })
  })

  describe('Delete Template', () => {
    it('deletes template after confirmation', async () => {
      // Create a template
      const template = await templatesRepository.create({
        name: 'To Delete',
        blocks: [
          {
            kind: 'strength',
            exerciseDefinitionId: null,
            name: 'Squat',
            equipment: 'Barbell',
            targetReps: 8,
            thumbnail: '🏋️',
            defaultSetCount: 3,
          },
        ],
      })

      const app = await createTestApp()
      await app.navigateTo(`/templates/${template.id}`)

      // Wait for loading to complete and content to render
      await waitFor(() => {
        expect(app.queryByText(/loading/i)).toBeNull()
        expect(app.getByText('Squat')).toBeDefined()
      })

      // Click Delete Template
      await app.user.click(app.getByRole('button', { name: /delete template/i }))

      // Confirm in dialog
      await app.waitForDialog()
      expect(app.getByRole('heading', { name: /delete template/i })).toBeDefined()
      await app.user.click(app.getDialogButton('Delete'))

      // Wait for navigation back to workouts
      await app.waitForRoute(/^\/workouts/)

      // Verify template was deleted
      const deleted = await templatesRepository.getById(template.id)
      expect(deleted).toBeUndefined()

      app.cleanup()
    })

    it('cancels delete when clicking cancel in dialog', async () => {
      const template = await templatesRepository.create({
        name: 'Keep Me',
        blocks: [
          {
            kind: 'strength',
            exerciseDefinitionId: null,
            name: 'Squat',
            equipment: 'Barbell',
            targetReps: 8,
            thumbnail: '🏋️',
            defaultSetCount: 3,
          },
        ],
      })

      const app = await createTestApp()
      await app.navigateTo(`/templates/${template.id}`)

      // Wait for loading to complete and content to render
      await waitFor(() => {
        expect(app.queryByText(/loading/i)).toBeNull()
        expect(app.getByText('Squat')).toBeDefined()
      })

      // Click Delete Template
      await app.user.click(app.getByRole('button', { name: /delete template/i }))
      await app.waitForDialog()

      // Click Cancel
      await app.user.click(app.getDialogButton('Cancel'))

      // Wait for dialog to close
      await waitFor(() => {
        app.assertDialogClosed()
      })

      // Verify still on template detail page
      expect(app.router.currentRoute.value.path).toBe(`/templates/${template.id}`)

      // Verify template still exists
      const existing = await templatesRepository.getById(template.id)
      expect(existing).toBeDefined()

      app.cleanup()
    })

    it('disables delete button when template has unsaved changes', async () => {
      const template = await templatesRepository.create({
        name: 'Test Template',
        blocks: [
          {
            kind: 'strength',
            exerciseDefinitionId: null,
            name: 'Squat',
            equipment: 'Barbell',
            targetReps: 8,
            thumbnail: '🏋️',
            defaultSetCount: 3,
          },
        ],
      })

      const app = await createTestApp()
      await app.navigateTo(`/templates/${template.id}`)

      // Wait for loading to complete and content to render
      await waitFor(() => {
        expect(app.queryByText(/loading/i)).toBeNull()
        expect(app.getByText('Squat')).toBeDefined()
      })

      // Delete button should be enabled initially
      const deleteButton = app.getByRole('button', { name: /delete template/i })
      expect(deleteButton).toHaveProperty('disabled', false)

      // Make a change
      const nameInput = app.getByRole('textbox', { name: /template name/i })
      await app.user.type(nameInput, ' Edited')

      // Delete button should now be disabled
      expect(deleteButton).toHaveProperty('disabled', true)

      app.cleanup()
    })
  })

  describe('Template List', () => {
    it('shows templates tab on workouts page after creating template through flow', async () => {
      const app = await createTestApp()

      // Start at home and navigate to workouts
      await app.user.click(app.getByRole('button', { name: /workouts/i }))

      // Wait for page to load
      await waitFor(() => {
        expect(app.queryByText(/loading/i)).toBeNull()
      })

      // Switch to Templates tab - should show empty state initially
      await app.user.click(app.getByRole('tab', { name: /templates/i }))

      // Verify empty state displays
      await waitFor(() => {
        expect(app.getByText(/no templates yet/i)).toBeDefined()
      })

      // Verify Create Template button exists
      expect(app.getByRole('button', { name: /create template/i })).toBeDefined()

      app.cleanup()
    })

    it('can navigate to create template from workouts page', async () => {
      const app = await createTestApp()

      // Navigate to workouts
      await app.user.click(app.getByRole('button', { name: /workouts/i }))

      // Wait for page to load
      await waitFor(() => {
        expect(app.queryByText(/loading/i)).toBeNull()
      })

      // Switch to Templates tab
      await app.user.click(app.getByRole('tab', { name: /templates/i }))

      // Click Create Template
      await app.user.click(app.getByRole('button', { name: /create template/i }))

      // Verify navigation to create template page
      expect(app.router.currentRoute.value.path).toBe('/templates/create')

      app.cleanup()
    })
  })
})
