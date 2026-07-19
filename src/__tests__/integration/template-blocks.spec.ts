/* eslint-disable vitest/no-conditional-in-test -- Block controls are conditionally rendered by kind. */
import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import {
  createDbTemplateStrengthBlock as createDatabaseTemplateStrengthBlock,
  createDbTemplateAmrapBlock as createDatabaseTemplateAmrapBlock,
  createDbTemplateEmomBlock as createDatabaseTemplateEmomBlock,
  createDbTemplateCardioBlock as createDatabaseTemplateCardioBlock,
  createDbTemplateBlockExercise as createDatabaseTemplateBlockExercise,
} from '../factories'
import { getAllTemplates, getTemplateById, seedTemplate } from '../helpers/dbAssertions'

describe('Template Blocks - Timed and Cardio Support', () => {
  describe('Create template with timed blocks', () => {
    it('creates a template with an AMRAP block', async ({ createTestApp }) => {
      const { getByRole, common, navigateTo } = await createTestApp()

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
      await expect
        .poll(async () => {
          const templates = await getAllTemplates()
          return templates.find((t) => t.name === 'Full Body Circuit')
        })
        .toBeDefined()

      const templates = await getAllTemplates()
      const template = templates.find((t) => t.name === 'Full Body Circuit')
      expect(template).toBeDefined()
      expect(template?.blocks).toHaveLength(1)
      expect(template?.blocks[0]?.kind).toBe('amrap')
    })

    it('creates a template with a cardio block', async ({ createTestApp }) => {
      const { getByRole, common, navigateTo } = await createTestApp()

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
      const templates = await getAllTemplates()
      const template = templates.find((t) => t.name === 'Cardio Day')
      expect(template).toBeDefined()
      expect(template?.blocks[0]?.kind).toBe('cardio')
    })

    it('creates a template with mixed blocks (strength + EMOM)', async ({ createTestApp }) => {
      const { getByRole, common, navigateTo } = await createTestApp()

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
      const templates = await getAllTemplates()
      const template = templates.find((t) => t.name === 'Mixed Workout')
      expect(template?.blocks).toHaveLength(2)
      expect(template?.blocks[0]?.kind).toBe('strength')
      expect(template?.blocks[1]?.kind).toBe('emom')
    })
  })

  describe('Edit template with timed blocks', () => {
    it('adds an AMRAP block to an existing template', async ({ createTestApp }) => {
      const { getByRole, common, navigateTo } = await createTestApp()

      // Seed template with strength block
      const template = await seedTemplate({
        name: 'Original Template',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Squat' })],
      })

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
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
      await expect
        .poll(async () => {
          const updated = await getTemplateById(template.id)
          return updated?.blocks.length
        })
        .toBe(2)

      const updated = await getTemplateById(template.id)
      expect(updated?.blocks[0]?.kind).toBe('strength')
      expect(updated?.blocks[1]?.kind).toBe('amrap')
    })

    it('displays existing timed blocks when editing template', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()

      // Seed template with AMRAP block
      const template = await seedTemplate({
        name: 'AMRAP Template',
        blocks: [
          createDatabaseTemplateAmrapBlock({
            config: { durationSeconds: 600 },
            exercises: [
              createDatabaseTemplateBlockExercise({ name: 'Burpees', prescribedReps: 10 }),
            ],
          }),
        ],
      })

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })

      // Verify AMRAP block is displayed
      await expect.element(page.getByText(/amrap/i).first()).toBeVisible()
      // Should show duration info
      await expect.element(page.getByText(/10 min/i)).toBeVisible()
    })
  })

  describe('Reorder mixed block types', () => {
    it('displays mixed block types with drag handles for reordering', async ({ createTestApp }) => {
      // Note: Drag-and-drop reordering is tested in template-drag-reorder.spec.ts
      const { navigateTo } = await createTestApp()

      // Seed template with mixed blocks: Strength, AMRAP, Cardio
      const template = await seedTemplate({
        name: 'Mixed Template',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Squat' }),
          createDatabaseTemplateAmrapBlock({
            exercises: [createDatabaseTemplateBlockExercise({ name: 'Burpees' })],
          }),
          createDatabaseTemplateCardioBlock({
            config: {
              activity: 'running',
              targetDurationSeconds: 1800,
              targetDistanceMeters: null,
            },
          }),
        ],
      })

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
      await expect.element(page.getByText('Squat')).toBeVisible()

      // Verify all block types have drag handles for reordering
      // eslint-disable-next-line no-restricted-syntax -- Finding all block cards with drag handles
      const dragHandles = document.querySelectorAll('.drag-handle')
      expect(dragHandles).toHaveLength(3) // One per block
    })
  })

  describe('Start workout from template with timed blocks', () => {
    it('starts a workout from a template with AMRAP block', async ({ createTestApp }) => {
      const { builder, getByRole, common, router, navigateTo } = await createTestApp()

      // Seed template with AMRAP block
      const template = await seedTemplate({
        name: 'AMRAP Workout',
        blocks: [
          createDatabaseTemplateAmrapBlock({
            config: { durationSeconds: 600 },
            exercises: [
              createDatabaseTemplateBlockExercise({ name: 'Burpees', prescribedReps: 10 }),
              createDatabaseTemplateBlockExercise({ name: 'Air Squats', prescribedReps: 15 }),
            ],
          }),
        ],
      })

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
      await expect.element(page.getByRole('button', { name: /start workout/i })).toBeVisible()

      // Start workout
      await userEvent.click(getByRole('button', { name: /start workout/i }))

      // Verify route is workout active
      await common.waitForRoute(/^\/workout\/active/)
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Verify AMRAP block exists in workout
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons).toHaveLength(1)

      // The block should be an AMRAP (we can verify by checking the block type indicator)
      await expect.element(page.getByText(/amrap/i).first()).toBeVisible()
    })

    it('starts a workout from a template with mixed blocks', async ({ createTestApp }) => {
      const { builder, getByRole, common, navigateTo } = await createTestApp()

      // Seed template with strength + EMOM
      const template = await seedTemplate({
        name: 'Mixed Workout',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Bench Press', defaultSetCount: 3 }),
          createDatabaseTemplateEmomBlock({
            config: { minutes: 10, exerciseRotation: 'full-round' },
            exercises: [
              createDatabaseTemplateBlockExercise({ name: 'Push-ups', prescribedReps: 10 }),
            ],
          }),
        ],
      })

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
      await expect.element(page.getByRole('button', { name: /start workout/i })).toBeVisible()

      // Start workout
      await userEvent.click(getByRole('button', { name: /start workout/i }))
      await common.waitForRoute(/^\/workout\/active/)

      // Verify both blocks exist
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons).toHaveLength(2)
    })
  })

  describe('Remove timed blocks from template', () => {
    it('removes an AMRAP block from template', async ({ createTestApp }) => {
      const { getByRole, navigateTo } = await createTestApp()

      // Seed template with strength + AMRAP
      const template = await seedTemplate({
        name: 'Template to Edit',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Squat' }),
          createDatabaseTemplateAmrapBlock({
            exercises: [createDatabaseTemplateBlockExercise({ name: 'Burpees' })],
          }),
        ],
      })

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
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
      await expect
        .poll(async () => {
          const updated = await getTemplateById(template.id)
          return updated?.blocks.length
        })
        .toBe(1)

      const updated = await getTemplateById(template.id)
      expect(updated?.blocks[0]?.kind).toBe('strength')
    })
  })
})
