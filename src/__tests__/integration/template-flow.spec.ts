import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbTemplate, createDbTemplateStrengthBlock } from '../factories'

describe('Template Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Test 1a: Create template from finished workout', () => {
    it('saves a completed workout as a template', async () => {
      const { builder, workout, getByRole, queryByRole, common, router, navigateTo, cleanup } =
        await createTestApp()

      // Start new workout from home page
      await userEvent.click(getByRole('button', { name: /start new workout/i }))
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add a strength block (Bench Press)
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add another strength block (Squat)
      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Squat'))
      await common.waitForDialogClose()

      // Start workout
      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Complete one set in Bench Press
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Finish the workout via menu
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())

      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await userEvent.click(getByRole('menuitem', { name: /end workout/i }))

      await common.waitForDialog()
      expect(queryByRole('heading', { name: /finish workout/i })).toBeTruthy()

      const nameInput = getByRole('textbox', { name: /workout name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Push Day')

      // Verify the input value was set correctly before proceeding
      await expect.poll(async () => {
        const el = await nameInput.element()
        if (!(el instanceof HTMLInputElement)) {
          return null
        }
        return el.value
      }).toBe('Push Day')

      await userEvent.click(common.getDialogButton('Finish Workout'))

      // Wait for completion screen
      await expect.element(page.getByText(/workout complete/i)).toBeVisible()

      // Wait for View Details button to be clickable (animation needs to complete)
      const viewDetailsButton = page.getByRole('button', { name: /view details/i })
      await expect.element(viewDetailsButton, { timeout: 2000 }).toBeVisible()
      await expect.element(viewDetailsButton).not.toHaveClass('opacity-0')
      // Wait for animation to complete (100ms enter delay + 600ms animation delay + 500ms animation)
      await new Promise((resolve) => setTimeout(resolve, 700))
      await viewDetailsButton.click()

      await common.waitForRoute(/^\/workout\/summary\//)

      // Wait for summary page to load and animation to complete
      const saveTemplateButton = page.getByRole('button', { name: /save as template/i })
      await expect.element(saveTemplateButton, { timeout: 3000 }).toBeVisible()
      await expect.poll(() => {
        const btn = document.querySelector('button[name*="template"], button:has([name*="template"])')
        return !btn?.parentElement?.classList.contains('opacity-0')
      }).toBe(true)
      // Wait for animation to complete (100ms enter delay + 1000ms animation delay + 500ms animation)
      await new Promise((resolve) => setTimeout(resolve, 800))
      await saveTemplateButton.click()
      await common.waitForDialog()

      // Verify dialog opened and template name is pre-filled
      expect(queryByRole('heading', { name: /save as template/i })).toBeTruthy()

      // Confirm save
      await userEvent.click(common.getDialogButton('Save Template'))

      // Wait for dialog to close
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

      // Verify template saved to DB
      const templates = await db.templates.toArray()
      expect(templates).toHaveLength(1)
      expect(templates[0]?.name).toBe('Push Day')
      expect(templates[0]?.blocks).toHaveLength(2)

      // Navigate to workouts page and verify template appears
      await navigateTo({ name: RouteNames.Workouts })

      // Wait for the page to finish loading
      await expect.element(page.getByRole('tab', { name: /templates/i })).toBeVisible()

      await userEvent.click(getByRole('tab', { name: /templates/i }))

      await expect.element(page.getByText('Push Day')).toBeVisible()

      cleanup()
    })
  })

  describe('Test 1b: Start workout from template', () => {
    it('starts a new workout from an existing template', async () => {
      const { builder, getByRole, getByText, common, router, navigateTo, cleanup } =
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
      await expect.element(page.getByRole('tab', { name: /templates/i })).toBeVisible()

      // Click Templates tab
      await userEvent.click(getByRole('tab', { name: /templates/i }))

      // Wait for template to appear and click it
      await expect.element(page.getByText('Leg Day')).toBeVisible()

      // Click on the template card
      const legDayEl = await getByText('Leg Day').element()
      const templateCard = legDayEl.closest('[role="button"]')
      if (!(templateCard instanceof HTMLElement)) {
        throw new Error('Template card not found')
      }
      await userEvent.click(templateCard)

      // Verify route is template detail
      await common.waitForRoute(/^\/templates\/tpl-leg-day/)
      expect(router.currentRoute.value.path).toBe('/templates/tpl-leg-day')

      // Wait for template detail to load
      await expect.element(page.getByRole('button', { name: /start workout/i })).toBeVisible()

      // Click "Start Workout" button
      await userEvent.click(getByRole('button', { name: /start workout/i }))

      // Verify route is workout active
      await common.waitForRoute(/^\/workout\/active/)
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Verify blocks match template - we should see 2 blocks in builder mode
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Verify template lastUsedAt was updated
      const updatedTemplate = await db.templates.get('tpl-leg-day')
      expect(updatedTemplate?.lastUsedAt).not.toBeNull()

      cleanup()
    })
  })

  describe('Test 1c: Edit and delete template', () => {
    it('edits a template name and adds an exercise', async () => {
      const { getByRole, common, navigateTo, cleanup } =
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
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Change the template name
      const nameInput = getByRole('textbox', { name: /template name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Updated Name')

      // Add an exercise
      await userEvent.click(getByRole('button', { name: /add exercise/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Squat'))
      await common.waitForDialogClose()

      // Save changes
      await userEvent.click(getByRole('button', { name: /save changes/i }))

      // Verify changes persisted in DB
      await expect.poll(async () => {
        const updated = await db.templates.get('tpl-edit-test')
        return updated?.name
      }).toBe('Updated Name')
      const updatedBlocks = await db.templates.get('tpl-edit-test')
      expect(updatedBlocks?.blocks).toHaveLength(2)

      cleanup()
    })

    it('deletes a template', async () => {
      const {  getByRole, queryByRole, common, router, navigateTo, cleanup } =
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
      await expect.element(page.getByRole('button', { name: /delete template/i })).toBeVisible()

      // Click delete button
      await userEvent.click(getByRole('button', { name: /delete template/i }))
      await common.waitForDialog()

      // Confirm deletion
      expect(queryByRole('heading', { name: /delete template/i })).toBeTruthy()
      await userEvent.click(common.getDialogButton('Delete'))

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
