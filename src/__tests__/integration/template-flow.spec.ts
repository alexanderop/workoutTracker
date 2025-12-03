import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'
import { createDbTemplate, createDbTemplateStrengthBlock } from '../factories'

describe('Template Flow', () => {
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

  describe('Test 1a: Create template from finished workout', () => {
    it('saves a completed workout as a template', async () => {
      const app = await createTestApp()

      // Start new workout from home page
      await app.user.click(app.getByRole('button', { name: /get started/i }))
      expect(app.router.currentRoute.value.path).toBe('/workout/active')

      // Add a strength block (Bench Press)
      await app.user.click(app.getByRole('button', { name: /add first block/i }))
      await app.waitForDialog()
      await app.user.click(app.getDialogButton('Bench Press'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

      // Add another strength block (Squat)
      await app.user.click(app.getByRole('button', { name: /add block/i }))
      await app.waitForDialog()
      await app.user.click(app.getDialogButton('Squat'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

      // Start workout
      await app.startWorkout()
      await waitFor(() => expect(app.queryByText(/block 1 of 2/i)).toBeTruthy())

      // Complete one set in Bench Press using semantic queries
      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
      const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

      await app.user.type(weightInput, '80')
      await app.user.type(repsInput, '10')
      await app.user.type(rirInput, '2')
      await app.user.click(app.getByRole('button', { name: /complete set/i }))

      // Finish the workout via menu
      await waitFor(() => expect(app.getMenuTrigger()).toBeTruthy())
      await app.user.click(app.getMenuTrigger())

      await waitFor(() => {
        expect(app.queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
      })
      await app.user.click(app.getByRole('menuitem', { name: /end workout/i }))

      await app.waitForDialog()
      expect(app.queryByRole('heading', { name: /finish workout/i })).toBeTruthy()

      const nameInput = app.getByRole('textbox', { name: /workout name/i })
      await app.user.clear(nameInput)
      await app.user.type(nameInput, 'Push Day')

      await app.user.click(app.getDialogButton('Finish Workout'))

      await app.waitForRoute(/^\/workout\/summary\//)

      // Wait for summary page to finish loading
      await waitFor(() => {
        expect(app.queryByText('Workout Complete!')).toBeTruthy()
      })

      // Click "Save as Template" button
      await app.user.click(app.getByRole('button', { name: /save as template/i }))
      await app.waitForDialog()

      // Verify dialog opened and template name is pre-filled
      expect(app.queryByRole('heading', { name: /save as template/i })).toBeTruthy()

      // Confirm save
      await app.user.click(app.getDialogButton('Save Template'))

      // Wait for dialog to close
      await waitFor(() => {
        expect(app.queryByRole('dialog')).toBeNull()
      })

      // Verify template saved to DB
      const templates = await db.templates.toArray()
      expect(templates).toHaveLength(1)
      expect(templates[0]?.name).toBe('Push Day')
      expect(templates[0]?.blocks).toHaveLength(2)

      // Navigate to workouts page and verify template appears
      await app.navigateTo('/workouts')

      // Wait for the page to finish loading
      await waitFor(() => {
        expect(app.queryByRole('tab', { name: /templates/i })).toBeTruthy()
      })

      await app.user.click(app.getByRole('tab', { name: /templates/i }))

      await waitFor(() => {
        expect(app.queryByText('Push Day')).toBeTruthy()
      })

      app.cleanup()
    })
  })

  describe('Test 1b: Start workout from template', () => {
    it('starts a new workout from an existing template', async () => {
      const app = await createTestApp()

      // Pre-seed DB with a template (after app creation to ensure DB is ready)
      const template = createDbTemplate({
        id: 'tpl-leg-day',
        name: 'Leg Day',
        blocks: [
          createDbTemplateStrengthBlock({ name: 'Squat', equipment: 'Barbell' }),
          createDbTemplateStrengthBlock({ name: 'Romanian Deadlift', equipment: 'Barbell' }),
        ],
      })
      await db.templates.add(template)

      // Navigate to workouts page
      await app.navigateTo('/workouts')

      // Wait for page to finish loading
      await waitFor(() => {
        expect(app.queryByRole('tab', { name: /templates/i })).toBeTruthy()
      })

      // Click Templates tab
      await app.user.click(app.getByRole('tab', { name: /templates/i }))

      // Wait for template to appear and click it
      await waitFor(() => {
        expect(app.queryByText('Leg Day')).toBeTruthy()
      })

      // Click on the template card
      const templateCard = app.getByText('Leg Day').closest('[role="button"]')
      if (!(templateCard instanceof HTMLElement)) {
        throw new Error('Template card not found')
      }
      await app.user.click(templateCard)

      // Verify route is template detail
      await app.waitForRoute(/^\/templates\/tpl-leg-day/)
      expect(app.router.currentRoute.value.path).toBe('/templates/tpl-leg-day')

      // Wait for template detail to load
      await waitFor(() => {
        expect(app.queryByRole('button', { name: /start workout/i })).toBeTruthy()
      })

      // Click "Start Workout" button
      await app.user.click(app.getByRole('button', { name: /start workout/i }))

      // Verify route is workout active
      await app.waitForRoute(/^\/workout\/active/)
      expect(app.router.currentRoute.value.path).toBe('/workout/active')

      // Verify blocks match template - we should see 2 blocks in builder mode
      const playlistButtons = app.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Verify template lastUsedAt was updated
      const updatedTemplate = await db.templates.get('tpl-leg-day')
      expect(updatedTemplate?.lastUsedAt).not.toBeNull()

      app.cleanup()
    })
  })

  describe('Test 1c: Edit and delete template', () => {
    it('edits a template name and adds an exercise', async () => {
      const app = await createTestApp()

      // Pre-seed DB with a template (after app creation to ensure DB is ready)
      const template = createDbTemplate({
        id: 'tpl-edit-test',
        name: 'Original Name',
        blocks: [createDbTemplateStrengthBlock({ name: 'Bench Press' })],
      })
      await db.templates.add(template)

      // Navigate to template detail page
      await app.navigateTo('/templates/tpl-edit-test')

      // Wait for template page to finish loading
      await waitFor(() => {
        expect(app.queryByRole('textbox', { name: /template name/i })).toBeTruthy()
      })

      // Change the template name
      const nameInput = app.getByRole('textbox', { name: /template name/i })
      await app.user.clear(nameInput)
      await app.user.type(nameInput, 'Updated Name')

      // Add an exercise
      await app.user.click(app.getByRole('button', { name: /add exercise/i }))
      await app.waitForDialog()
      await app.user.click(app.getDialogButton('Squat'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

      // Save changes
      await app.user.click(app.getByRole('button', { name: /save changes/i }))

      // Verify changes persisted in DB
      await waitFor(async () => {
        const updated = await db.templates.get('tpl-edit-test')
        expect(updated?.name).toBe('Updated Name')
        expect(updated?.blocks).toHaveLength(2)
      })

      app.cleanup()
    })

    it('deletes a template', async () => {
      const app = await createTestApp()

      // Pre-seed DB with a template (after app creation to ensure DB is ready)
      const template = createDbTemplate({
        id: 'tpl-delete-test',
        name: 'Template to Delete',
        blocks: [createDbTemplateStrengthBlock()],
      })
      await db.templates.add(template)

      // Navigate to template detail page
      await app.navigateTo('/templates/tpl-delete-test')

      // Wait for template page to finish loading
      await waitFor(() => {
        expect(app.queryByRole('button', { name: /delete template/i })).toBeTruthy()
      })

      // Click delete button
      await app.user.click(app.getByRole('button', { name: /delete template/i }))
      await app.waitForDialog()

      // Confirm deletion
      expect(app.queryByRole('heading', { name: /delete template/i })).toBeTruthy()
      await app.user.click(app.getDialogButton('Delete'))

      // Verify redirect to /workouts
      await app.waitForRoute(/^\/workouts/)
      expect(app.router.currentRoute.value.path).toBe('/workouts')

      // Verify template removed from DB
      const deleted = await db.templates.get('tpl-delete-test')
      expect(deleted).toBeUndefined()

      app.cleanup()
    })
  })
})
