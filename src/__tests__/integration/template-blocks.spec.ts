import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import {
  createDbTemplate,
  createDbTemplateStrengthBlock,
  createDbTemplateAmrapBlock,
  createDbTemplateEmomBlock,
  createDbTemplateCardioBlock,
  createDbTemplateBlockExercise,
} from '../factories'

describe('Template Blocks - Timed and Cardio Support', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Create template with timed blocks', () => {
    it('creates a template with an AMRAP block', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Template page
      await navigateTo({ name: RouteNames.CreateTemplate })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Fill in template name
      await userEvent.fill(getByRole('textbox', { name: /template name/i }), 'Full Body Circuit')

      // Click add block button
      await userEvent.click(getByRole('button', { name: /add/i }))
      await common.waitForDialog()

      // Switch to Timed Blocks tab
      await userEvent.click(getByRole('tab', { name: /timed/i }))

      // Select AMRAP block type
      await userEvent.click(page.getByText('AMRAP'))
      await common.waitForDialog()

      // Add exercise to AMRAP
      await userEvent.click(getByRole('button', { name: /add exercise/i }))

      // Select an exercise (overlay picker within the dialog)
      await expect.element(page.getByText('Burpees')).toBeVisible()
      await userEvent.click(common.getDialogButton('Burpees'))

      // Wait for exercise to appear in the block config (overlay closes, dialog stays open)
      await expect.element(page.getByText('Burpees')).toBeVisible()

      // Confirm AMRAP block
      await userEvent.click(common.getDialogButton('Add Block'))
      await common.waitForDialogClose()

      // Verify AMRAP block appears in the template (check for the block title)
      await expect.element(page.getByRole('heading', { name: /blocks/i })).toBeVisible()
      await expect.element(page.getByText(/amrap/i).first()).toBeVisible()

      // Save template
      await userEvent.click(getByRole('button', { name: /save template/i }))

      // Wait for navigation to template detail
      await common.waitForRoute(/^\/templates\//)

      // Verify template saved to DB with AMRAP block
      await expect.poll(async () => {
        const templates = await db.templates.toArray()
        return templates.find((t) => t.name === 'Full Body Circuit')
      }).toBeDefined()

      const templates = await db.templates.toArray()
      const template = templates.find((t) => t.name === 'Full Body Circuit')
      expect(template).toBeDefined()
      expect(template?.blocks).toHaveLength(1)
      expect(template?.blocks[0]?.kind).toBe('amrap')

      cleanup()
    })

    it('creates a template with a cardio block', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Template page
      await navigateTo({ name: RouteNames.CreateTemplate })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Fill in template name
      await userEvent.fill(getByRole('textbox', { name: /template name/i }), 'Cardio Day')

      // Click add block button
      await userEvent.click(getByRole('button', { name: /add/i }))
      await common.waitForDialog()

      // Switch to Timed Blocks tab
      await userEvent.click(getByRole('tab', { name: /timed/i }))

      // Select Cardio block type
      await userEvent.click(page.getByText('Cardio'))
      await common.waitForDialog()

      // Select running activity
      await userEvent.click(page.getByText(/running/i))

      // Confirm cardio block
      await userEvent.click(common.getDialogButton('Add Block'))
      await common.waitForDialogClose()

      // Verify cardio block appears in the template
      await expect.element(page.getByText(/cardio/i)).toBeVisible()

      // Save template
      await userEvent.click(getByRole('button', { name: /save template/i }))

      // Wait for navigation to template detail
      await common.waitForRoute(/^\/templates\//)

      // Verify template saved to DB with cardio block
      const templates = await db.templates.toArray()
      const template = templates.find((t) => t.name === 'Cardio Day')
      expect(template).toBeDefined()
      expect(template?.blocks[0]?.kind).toBe('cardio')

      cleanup()
    })

    it('creates a template with mixed blocks (strength + EMOM)', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Template page
      await navigateTo({ name: RouteNames.CreateTemplate })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Fill in template name
      await userEvent.fill(getByRole('textbox', { name: /template name/i }), 'Mixed Workout')

      // Add a strength block first
      await userEvent.click(getByRole('button', { name: /add/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add an EMOM block
      await userEvent.click(getByRole('button', { name: /add/i }))
      await common.waitForDialog()
      await userEvent.click(getByRole('tab', { name: /timed/i }))
      await userEvent.click(page.getByText('EMOM'))
      await common.waitForDialog()

      // Add exercise to EMOM
      await userEvent.click(getByRole('button', { name: /add exercise/i }))
      await expect.element(page.getByText('Burpees')).toBeVisible()
      await userEvent.click(common.getDialogButton('Burpees'))
      await expect.element(page.getByText('Burpees')).toBeVisible()

      // Confirm EMOM block
      await userEvent.click(common.getDialogButton('Add Block'))
      await common.waitForDialogClose()

      // Verify both blocks appear
      await expect.element(page.getByText('Bench Press')).toBeVisible()
      await expect.element(page.getByText(/emom/i).first()).toBeVisible()

      // Save template
      await userEvent.click(getByRole('button', { name: /save template/i }))
      await common.waitForRoute(/^\/templates\//)

      // Verify template saved with both blocks
      const templates = await db.templates.toArray()
      const template = templates.find((t) => t.name === 'Mixed Workout')
      expect(template?.blocks).toHaveLength(2)
      expect(template?.blocks[0]?.kind).toBe('strength')
      expect(template?.blocks[1]?.kind).toBe('emom')

      cleanup()
    })
  })

  describe('Edit template with timed blocks', () => {
    it('adds an AMRAP block to an existing template', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      // Seed template with strength block
      const template = createDbTemplate({
        id: 'tpl-add-amrap',
        name: 'Original Template',
        blocks: [createDbTemplateStrengthBlock({ name: 'Squat' })],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-add-amrap' } })
      await expect.element(page.getByText('Squat')).toBeVisible()

      // Add AMRAP block
      await userEvent.click(getByRole('button', { name: /add/i }))
      await common.waitForDialog()
      await userEvent.click(getByRole('tab', { name: /timed/i }))
      await userEvent.click(page.getByText('AMRAP'))
      await common.waitForDialog()

      // Add exercise to AMRAP
      await userEvent.click(getByRole('button', { name: /add exercise/i }))
      await expect.element(page.getByText('Burpees')).toBeVisible()
      await userEvent.click(common.getDialogButton('Burpees'))
      await expect.element(page.getByText('Burpees')).toBeVisible()

      // Confirm AMRAP block
      await userEvent.click(common.getDialogButton('Add Block'))
      await common.waitForDialogClose()

      // Verify AMRAP block appears
      await expect.element(page.getByText(/amrap/i).first()).toBeVisible()

      // Save changes
      await userEvent.click(getByRole('button', { name: /save changes/i }))

      // Verify DB has both blocks
      await expect.poll(async () => {
        const updated = await db.templates.get('tpl-add-amrap')
        return updated?.blocks.length
      }).toBe(2)

      const updated = await db.templates.get('tpl-add-amrap')
      expect(updated?.blocks[0]?.kind).toBe('strength')
      expect(updated?.blocks[1]?.kind).toBe('amrap')

      cleanup()
    })

    it('displays existing timed blocks when editing template', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed template with AMRAP block
      const template = createDbTemplate({
        id: 'tpl-view-amrap',
        name: 'AMRAP Template',
        blocks: [
          createDbTemplateAmrapBlock({
            config: { durationSeconds: 600 },
            exercises: [createDbTemplateBlockExercise({ name: 'Burpees', prescribedReps: 10 })],
          }),
        ],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-view-amrap' } })

      // Verify AMRAP block is displayed
      await expect.element(page.getByText(/amrap/i).first()).toBeVisible()
      // Should show duration info
      await expect.element(page.getByText(/10 min/i)).toBeVisible()

      cleanup()
    })
  })

  describe('Reorder mixed block types', () => {
    it('reorders blocks of different types using move buttons', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Seed template with mixed blocks: Strength, AMRAP, Cardio
      const template = createDbTemplate({
        id: 'tpl-reorder-mixed',
        name: 'Mixed Template',
        blocks: [
          createDbTemplateStrengthBlock({ name: 'Squat' }),
          createDbTemplateAmrapBlock({
            exercises: [createDbTemplateBlockExercise({ name: 'Burpees' })],
          }),
          createDbTemplateCardioBlock({ config: { activity: 'running', targetDurationSeconds: 1800, targetDistanceMeters: null } }),
        ],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-reorder-mixed' } })
      await expect.element(page.getByText('Squat')).toBeVisible()

      // Find the AMRAP block card and its move up button
      const amrapText = await page.getByText(/amrap/i).first().element()
      const amrapCard = amrapText.closest('.rounded-xl')
      if (!(amrapCard instanceof HTMLElement)) throw new Error('AMRAP card not found')

      // eslint-disable-next-line no-restricted-syntax -- Finding move button within card scope
      const moveUpButton = amrapCard.querySelector('[aria-label*="move up" i]')
      if (!(moveUpButton instanceof HTMLElement)) throw new Error('Move up button not found')

      // Move AMRAP up (should swap with Squat)
      await userEvent.click(moveUpButton)

      // Verify new order: AMRAP is now first
      // eslint-disable-next-line no-restricted-syntax -- Testing card ordering by CSS class
      const cards = document.querySelectorAll('.rounded-xl')
      const firstCard = cards[0]
      expect(firstCard?.textContent).toContain('AMRAP')

      // Save changes
      await userEvent.click(getByRole('button', { name: /save changes/i }))

      // Verify DB order
      await expect.poll(async () => {
        const updated = await db.templates.get('tpl-reorder-mixed')
        return updated?.blocks[0]?.kind
      }).toBe('amrap')

      cleanup()
    })
  })

  describe('Start workout from template with timed blocks', () => {
    it('starts a workout from a template with AMRAP block', async () => {
      const { builder, getByRole, common, router, navigateTo, cleanup } = await createTestApp()

      // Seed template with AMRAP block
      const template = createDbTemplate({
        id: 'tpl-start-amrap',
        name: 'AMRAP Workout',
        blocks: [
          createDbTemplateAmrapBlock({
            config: { durationSeconds: 600 },
            exercises: [
              createDbTemplateBlockExercise({ name: 'Burpees', prescribedReps: 10 }),
              createDbTemplateBlockExercise({ name: 'Air Squats', prescribedReps: 15 }),
            ],
          }),
        ],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-start-amrap' } })
      await expect.element(page.getByRole('button', { name: /start workout/i })).toBeVisible()

      // Start workout
      await userEvent.click(getByRole('button', { name: /start workout/i }))

      // Verify route is workout active
      await common.waitForRoute(/^\/workout\/active/)
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Verify AMRAP block exists in workout
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      // The block should be an AMRAP (we can verify by checking the block type indicator)
      await expect.element(page.getByText(/amrap/i).first()).toBeVisible()

      cleanup()
    })

    it('starts a workout from a template with mixed blocks', async () => {
      const { builder, getByRole, common, navigateTo, cleanup } = await createTestApp()

      // Seed template with strength + EMOM
      const template = createDbTemplate({
        id: 'tpl-start-mixed',
        name: 'Mixed Workout',
        blocks: [
          createDbTemplateStrengthBlock({ name: 'Bench Press', defaultSetCount: 3 }),
          createDbTemplateEmomBlock({
            config: { minutes: 10, exerciseRotation: 'full-round' },
            exercises: [createDbTemplateBlockExercise({ name: 'Push-ups', prescribedReps: 10 })],
          }),
        ],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-start-mixed' } })
      await expect.element(page.getByRole('button', { name: /start workout/i })).toBeVisible()

      // Start workout
      await userEvent.click(getByRole('button', { name: /start workout/i }))
      await common.waitForRoute(/^\/workout\/active/)

      // Verify both blocks exist
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      cleanup()
    })
  })

  describe('Remove timed blocks from template', () => {
    it('removes an AMRAP block from template', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Seed template with strength + AMRAP
      const template = createDbTemplate({
        id: 'tpl-remove-amrap',
        name: 'Template to Edit',
        blocks: [
          createDbTemplateStrengthBlock({ name: 'Squat' }),
          createDbTemplateAmrapBlock({
            exercises: [createDbTemplateBlockExercise({ name: 'Burpees' })],
          }),
        ],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-remove-amrap' } })
      await expect.element(page.getByText(/amrap/i).first()).toBeVisible()

      // Find AMRAP card and remove button
      const amrapText = await page.getByText(/amrap/i).first().element()
      const amrapCard = amrapText.closest('.rounded-xl')
      if (!(amrapCard instanceof HTMLElement)) throw new Error('AMRAP card not found')

      // eslint-disable-next-line no-restricted-syntax -- Finding remove button within card scope
      const removeButton = amrapCard.querySelector('[aria-label*="remove" i]')
      if (!(removeButton instanceof HTMLElement)) throw new Error('Remove button not found')

      // Remove AMRAP block
      await userEvent.click(removeButton)

      // Verify AMRAP is removed from UI
      await expect.element(page.getByText(/amrap/i).first()).not.toBeInTheDocument()

      // Save changes
      await userEvent.click(getByRole('button', { name: /save changes/i }))

      // Verify DB has only strength block
      await expect.poll(async () => {
        const updated = await db.templates.get('tpl-remove-amrap')
        return updated?.blocks.length
      }).toBe(1)

      const updated = await db.templates.get('tpl-remove-amrap')
      expect(updated?.blocks[0]?.kind).toBe('strength')

      cleanup()
    })
  })
})
