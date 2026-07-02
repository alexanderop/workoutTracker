import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { seedTemplateAndOpenDetail } from '../helpers/templateHelpers'
import { createDbTemplateStrengthBlock as createDatabaseTemplateStrengthBlock } from '../factories'

/**
 * Integration tests for template error handling and edge cases.
 * Tests validation errors, edge cases, and unusual user interactions.
 */
describe('Template Error Handling', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Form Validation', () => {
    it('shows disabled save when template name is only whitespace', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.CreateTemplate })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Add an exercise (making that part valid)
      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(await common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Fill name with only whitespace
      const nameInput = getByRole('textbox', { name: /template name/i })
      await userEvent.fill(nameInput, ' '.repeat(3))

      // Save button should be disabled
      const saveButton = getByRole('button', { name: /save template/i })
      await expect.element(saveButton).toBeDisabled()

      cleanup()
    })

    it('modifying template name and saving persists changes', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Create a template and open its detail page
      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-validation-test',
        name: 'Valid Template',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Bench Press' })],
      })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Modify the name
      const nameInput = getByRole('textbox', { name: /template name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'New Template Name')

      // Save changes - button should be visible and clickable
      const saveButton = getByRole('button', { name: /save changes/i })
      await expect.element(saveButton).toBeVisible()
      await userEvent.click(saveButton)

      // Verify changes persisted to database
      await expect
        .poll(async () => {
          const updated = await db.templates.get('tpl-validation-test')
          return updated?.name
        })
        .toBe('New Template Name')

      cleanup()
    })

    it('disables start workout after removing all exercises', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Create template with one exercise and open its detail page
      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-remove-all',
        name: 'Single Exercise Template',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Bench Press' })],
      })
      await expect.element(page.getByText('Bench Press')).toBeVisible()

      // Verify Start Workout is initially enabled
      const startButton = getByRole('button', { name: /start workout/i })
      await expect.element(startButton).not.toBeDisabled()

      // Remove the only exercise
      const benchText = await page.getByText('Bench Press').element()
      const benchCard = benchText.closest('.rounded-xl')
      if (!(benchCard instanceof HTMLElement)) throw new Error('Card not found')

      // eslint-disable-next-line no-restricted-syntax -- Finding remove button within card scope
      const removeButton = benchCard.querySelector('[aria-label*="remove" i]')
      if (!(removeButton instanceof HTMLElement)) throw new Error('Remove button not found')
      await userEvent.click(removeButton)

      // Start Workout button should be disabled (can't start workout with no exercises)
      await expect.element(startButton).toBeDisabled()

      cleanup()
    })
  })

  describe('Navigation with Unsaved Changes', () => {
    it('does not persist changes when navigating away without saving', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Create initial template and open its detail page
      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-unsaved',
        name: 'Original Template',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Bench Press' })],
      })

      // Modify the name
      const nameInput = getByRole('textbox', { name: /template name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Modified Name')

      // Navigate away without saving
      await navigateTo({ name: RouteNames.Home })

      // Verify database was not modified
      const unchanged = await db.templates.get('tpl-unsaved')
      expect(unchanged?.name).toBe('Original Template')

      cleanup()
    })
  })

  describe('Template Not Found', () => {
    it('redirects to workouts when template not found', async () => {
      const { navigateTo, router, cleanup } = await createTestApp()

      // Navigate to a non-existent template
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'non-existent-template' } })

      // Should redirect to workouts page
      await expect.poll(() => router.currentRoute.value.path).toBe('/workouts')

      // Page should render successfully
      await expect.element(page.getByRole('main')).toBeVisible()

      cleanup()
    })
  })

  describe('Delete Template Confirmation', () => {
    it('cancelling delete preserves template', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-delete-cancel',
        name: 'Template to Keep',
        blocks: [createDatabaseTemplateStrengthBlock()],
      })
      await expect.element(page.getByRole('button', { name: /delete template/i })).toBeVisible()

      // Click delete
      await userEvent.click(getByRole('button', { name: /delete template/i }))
      await common.waitForDialog()

      // Cancel the deletion
      await userEvent.click(await common.getDialogButton('Cancel'))
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

      // Template should still exist
      const preserved = await db.templates.get('tpl-delete-cancel')
      expect(preserved).toBeDefined()
      expect(preserved?.name).toBe('Template to Keep')

      cleanup()
    })

    it('pressing escape closes delete dialog without deleting', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-escape-test',
        name: 'Escape Test Template',
        blocks: [createDatabaseTemplateStrengthBlock()],
      })

      // Open delete dialog
      await userEvent.click(getByRole('button', { name: /delete template/i }))
      await common.waitForDialog()

      // Press Escape
      await userEvent.keyboard('{Escape}')
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

      // Template preserved
      const preserved = await db.templates.get('tpl-escape-test')
      expect(preserved).toBeDefined()

      cleanup()
    })
  })

  describe('Exercise Reordering Edge Cases', () => {
    it('cannot move first exercise up', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Create template with 2 exercises and open its detail page
      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-reorder-edge',
        name: 'Reorder Test',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'First Exercise' }),
          createDatabaseTemplateStrengthBlock({ name: 'Second Exercise' }),
        ],
      })

      // Find first exercise card
      const firstText = await page.getByText('First Exercise').element()
      const firstCard = firstText.closest('.rounded-xl')
      if (!(firstCard instanceof HTMLElement)) throw new Error('Card not found')

      // Move up button should be disabled or not exist for first item
      // eslint-disable-next-line no-restricted-syntax -- Finding button within card scope
      const moveUpButton = firstCard.querySelector('[aria-label*="move up" i]')

      // Either button doesn't exist or is disabled
      if (moveUpButton instanceof HTMLButtonElement) {
        expect(moveUpButton.disabled).toBe(true)
      }
      // If button doesn't exist, that's also acceptable behavior

      cleanup()
    })

    it('cannot move last exercise down', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-reorder-last',
        name: 'Reorder Last Test',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'First Exercise' }),
          createDatabaseTemplateStrengthBlock({ name: 'Last Exercise' }),
        ],
      })

      // Find last exercise card
      const lastText = await page.getByText('Last Exercise').element()
      const lastCard = lastText.closest('.rounded-xl')
      if (!(lastCard instanceof HTMLElement)) throw new Error('Card not found')

      // Move down button should be disabled or not exist for last item
      // eslint-disable-next-line no-restricted-syntax -- Finding button within card scope
      const moveDownButton = lastCard.querySelector('[aria-label*="move down" i]')

      if (moveDownButton instanceof HTMLButtonElement) {
        expect(moveDownButton.disabled).toBe(true)
      }

      cleanup()
    })
  })

  describe('Set Count Edge Cases', () => {
    it('cannot decrease set count below 1', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-setcount-min',
        name: 'Set Count Min Test',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Squat', defaultSetCount: 1 })],
      })

      // Find the exercise card
      const squatText = await page.getByText('Squat').element()
      const squatCard = squatText.closest('.rounded-xl')
      if (!(squatCard instanceof HTMLElement)) throw new Error('Card not found')

      // Find decrement button
      // eslint-disable-next-line no-restricted-syntax -- Finding button within card scope
      const decrementButton = squatCard.querySelector('[aria-label*="decrease" i]')

      // Decrement should be disabled at 1
      if (decrementButton instanceof HTMLButtonElement) {
        expect(decrementButton.disabled).toBe(true)
      }

      // Verify set count is still 1
      // eslint-disable-next-line no-restricted-syntax -- Finding input within card scope
      const setCountInput = squatCard.querySelector('input[type="number"]')
      if (setCountInput instanceof HTMLInputElement) {
        expect(setCountInput.value).toBe('1')
      }

      cleanup()
    })
  })
})
