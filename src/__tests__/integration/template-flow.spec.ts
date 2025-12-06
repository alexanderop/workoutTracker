import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../helpers/resetDatabase'
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
      const { builder, workout, user, getByRole, queryByRole, queryByText, common, router, navigateTo, cleanup } =
        await createTestApp()

      // Start new workout from home page
      await user.click(getByRole('button', { name: /get started/i }))
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add a strength block (Bench Press)
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add another strength block (Squat)
      await user.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Squat'))
      await common.waitForDialogClose()

      // Start workout
      await builder.startWorkout()
      await waitFor(() => expect(queryByText(/block 1 of 2/i)).toBeTruthy())

      // Complete one set in Bench Press using semantic queries
      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
      const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

      // Fill inputs and wait for button (handles jsdom vs browser differences)
      const completeButton = getByRole('button', { name: /complete set/i })
      await common.fillStrengthSetAndWaitForButton(
        { weight: weightInput, reps: repsInput, rir: rirInput },
        { weight: '80', reps: '10', rir: '2' },
        completeButton,
      )
      await user.click(completeButton)

      // Finish the workout via menu
      await waitFor(() => expect(workout.getMenuTrigger()).toBeTruthy())
      await user.click(workout.getMenuTrigger())

      await waitFor(() => {
        expect(queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
      })
      await user.click(getByRole('menuitem', { name: /end workout/i }))

      await common.waitForDialog()
      expect(queryByRole('heading', { name: /finish workout/i })).toBeTruthy()

      const nameInput = getByRole('textbox', { name: /workout name/i })
      await user.clear(nameInput)
      await user.type(nameInput, 'Push Day')

      await user.click(common.getDialogButton('Finish Workout'))

      await common.waitForRoute(/^\/workout\/summary\//)

      // Wait for summary page to finish loading
      await waitFor(() => {
        expect(queryByText('Workout Complete!')).toBeTruthy()
      })

      // Click "Save as Template" button
      await user.click(getByRole('button', { name: /save as template/i }))
      await common.waitForDialog()

      // Verify dialog opened and template name is pre-filled
      expect(queryByRole('heading', { name: /save as template/i })).toBeTruthy()

      // Confirm save
      await user.click(common.getDialogButton('Save Template'))

      // Wait for dialog to close
      await waitFor(() => {
        expect(queryByRole('dialog')).toBeNull()
      })

      // Verify template saved to DB
      const templates = await db.templates.toArray()
      expect(templates).toHaveLength(1)
      expect(templates[0]?.name).toBe('Push Day')
      expect(templates[0]?.blocks).toHaveLength(2)

      // Navigate to workouts page and verify template appears
      await navigateTo({ name: RouteNames.Workouts })

      // Wait for the page to finish loading
      await waitFor(() => {
        expect(queryByRole('tab', { name: /templates/i })).toBeTruthy()
      })

      await user.click(getByRole('tab', { name: /templates/i }))

      await waitFor(() => {
        expect(queryByText('Push Day')).toBeTruthy()
      })

      cleanup()
    })
  })

  describe('Test 1b: Start workout from template', () => {
    it('starts a new workout from an existing template', async () => {
      const { builder, user, getByRole, queryByRole, queryByText, getByText, common, router, navigateTo, cleanup } =
        await createTestApp()

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
      await navigateTo({ name: RouteNames.Workouts })

      // Wait for page to finish loading
      await waitFor(() => {
        expect(queryByRole('tab', { name: /templates/i })).toBeTruthy()
      })

      // Click Templates tab
      await user.click(getByRole('tab', { name: /templates/i }))

      // Wait for template to appear and click it
      await waitFor(() => {
        expect(queryByText('Leg Day')).toBeTruthy()
      })

      // Click on the template card
      const templateCard = getByText('Leg Day').closest('[role="button"]')
      if (!(templateCard instanceof HTMLElement)) {
        throw new Error('Template card not found')
      }
      await user.click(templateCard)

      // Verify route is template detail
      await common.waitForRoute(/^\/templates\/tpl-leg-day/)
      expect(router.currentRoute.value.path).toBe('/templates/tpl-leg-day')

      // Wait for template detail to load
      await waitFor(() => {
        expect(queryByRole('button', { name: /start workout/i })).toBeTruthy()
      })

      // Click "Start Workout" button
      await user.click(getByRole('button', { name: /start workout/i }))

      // Verify route is workout active
      await common.waitForRoute(/^\/workout\/active/)
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Verify blocks match template - we should see 2 blocks in builder mode
      const playlistButtons = builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Verify template lastUsedAt was updated
      const updatedTemplate = await db.templates.get('tpl-leg-day')
      expect(updatedTemplate?.lastUsedAt).not.toBeNull()

      cleanup()
    })
  })

  describe('Test 1c: Edit and delete template', () => {
    it('edits a template name and adds an exercise', async () => {
      const { user, getByRole, queryByRole, common, navigateTo, cleanup } =
        await createTestApp()

      // Pre-seed DB with a template (after app creation to ensure DB is ready)
      const template = createDbTemplate({
        id: 'tpl-edit-test',
        name: 'Original Name',
        blocks: [createDbTemplateStrengthBlock({ name: 'Bench Press' })],
      })
      await db.templates.add(template)

      // Navigate to template detail page
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-edit-test' } })

      // Wait for template page to finish loading
      await waitFor(() => {
        expect(queryByRole('textbox', { name: /template name/i })).toBeTruthy()
      })

      // Change the template name
      const nameInput = getByRole('textbox', { name: /template name/i })
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      // Add an exercise
      await user.click(getByRole('button', { name: /add exercise/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Squat'))
      await common.waitForDialogClose()

      // Save changes
      await user.click(getByRole('button', { name: /save changes/i }))

      // Verify changes persisted in DB
      await waitFor(async () => {
        const updated = await db.templates.get('tpl-edit-test')
        expect(updated?.name).toBe('Updated Name')
        expect(updated?.blocks).toHaveLength(2)
      })

      cleanup()
    })

    it('deletes a template', async () => {
      const { user, getByRole, queryByRole, common, router, navigateTo, cleanup } =
        await createTestApp()

      // Pre-seed DB with a template (after app creation to ensure DB is ready)
      const template = createDbTemplate({
        id: 'tpl-delete-test',
        name: 'Template to Delete',
        blocks: [createDbTemplateStrengthBlock()],
      })
      await db.templates.add(template)

      // Navigate to template detail page
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-delete-test' } })

      // Wait for template page to finish loading
      await waitFor(() => {
        expect(queryByRole('button', { name: /delete template/i })).toBeTruthy()
      })

      // Click delete button
      await user.click(getByRole('button', { name: /delete template/i }))
      await common.waitForDialog()

      // Confirm deletion
      expect(queryByRole('heading', { name: /delete template/i })).toBeTruthy()
      await user.click(common.getDialogButton('Delete'))

      // Verify redirect to /workouts
      await common.waitForRoute(/^\/workouts/)
      expect(router.currentRoute.value.path).toBe('/workouts')

      // Verify template removed from DB
      const deleted = await db.templates.get('tpl-delete-test')
      expect(deleted).toBeUndefined()

      cleanup()
    })
  })
})
