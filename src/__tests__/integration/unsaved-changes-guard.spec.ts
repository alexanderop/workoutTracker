/* eslint-disable vitest/no-conditional-in-test -- Navigation guard rendering is conditional by design. */
/**
 * Integration tests for the reusable unsaved-changes navigation guard.
 *
 * FINDING 5 (Critical, UX review 2026-07-04): Dirty forms discarded changes
 * on back navigation with no warning. Tapping the header back arrow on
 * `/templates/:id` or `/exercises/:id/edit` while a change was pending
 * silently discarded it.
 *
 * Required behavior:
 * - Any navigation away from a dirty form (header back button, browser
 *   back, programmatic route change) shows a confirm-discard dialog.
 * - Confirming discards the change and lets navigation proceed.
 * - Cancelling keeps the user on the page with their edits intact.
 * - Navigating away from a form with no changes is never interrupted.
 */
import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getCustomExercisesRepository } from '@/db'
import { createDbTemplateStrengthBlock as createDatabaseTemplateStrengthBlock } from '../factories'
import { getTemplateById, seedTemplate } from '../helpers/dbAssertions'

describe('Unsaved Changes Guard', () => {
  describe('Template detail editor', () => {
    it('shows a confirm dialog on back navigation with unsaved changes; cancel keeps edits, confirm discards and navigates', async ({
      createTestApp,
    }) => {
      const { getByRole, common, router, navigateTo } = await createTestApp()

      const template = await seedTemplate({
        name: 'Original Name',
        blocks: [createDatabaseTemplateStrengthBlock()],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      const nameInput = getByRole('textbox', { name: /template name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Modified Name')

      // Tap the header back arrow while dirty -- navigation must be intercepted
      await userEvent.click(page.getByRole('button', { name: /go back/i }))
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /unsaved changes/i })).toBeVisible()

      // Cancel: stays on the page, edits are preserved
      await userEvent.click(common.getDialogButton('Cancel'))
      await common.waitForDialogClose()
      expect(router.currentRoute.value.path).toBe(`/templates/${template.id}`)
      await expect
        .element(getByRole('textbox', { name: /template name/i }))
        .toHaveValue('Modified Name')

      // Tap back again and confirm discard -- navigation proceeds, change is dropped
      await userEvent.click(page.getByRole('button', { name: /go back/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Leave'))
      await common.waitForRoute(/^\/workouts/)

      const unchanged = await getTemplateById(template.id)
      expect(unchanged?.name).toBe('Original Name')
    })

    it('navigates back without a dialog when there are no unsaved changes', async ({
      createTestApp,
    }) => {
      const { common, router, navigateTo } = await createTestApp()

      const template = await seedTemplate({
        name: 'Clean Template',
        blocks: [createDatabaseTemplateStrengthBlock()],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      await userEvent.click(page.getByRole('button', { name: /go back/i }))
      await common.waitForRoute(/^\/workouts/)

      expect(common.isDialogOpen()).toBe(false)
      expect(router.currentRoute.value.path).toBe('/workouts')
    })
  })

  describe('Exercise edit form', () => {
    it('shows a confirm dialog on back navigation after a rename; confirming discards it', async ({
      createTestApp,
    }) => {
      const { common, router, navigateTo } = await createTestApp()

      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')
      if (!benchPress) throw new Error('Seeded "Bench Press" exercise not found')

      await navigateTo({ name: RouteNames.ExerciseProgress, params: { id: benchPress.id } })
      await userEvent.click(page.getByRole('button', { name: /edit exercise/i }))
      await expect.element(page.getByRole('heading', { name: /edit exercise/i })).toBeVisible()

      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Renamed Bench Press')

      await userEvent.click(page.getByRole('button', { name: /go back/i }))
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /unsaved changes/i })).toBeVisible()

      // Cancel keeps the user on the edit form with the rename intact
      await userEvent.click(common.getDialogButton('Cancel'))
      await common.waitForDialogClose()
      await expect.element(nameInput).toHaveValue('Renamed Bench Press')

      // Confirm discards the rename and lets navigation proceed
      await userEvent.click(page.getByRole('button', { name: /go back/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Leave'))
      await common.waitForRoute(new RegExp(`^/exercises/${benchPress.id}$`))

      const unchanged = await getCustomExercisesRepository().getById(benchPress.id)
      expect(unchanged?.name).toBe('Bench Press')
      expect(router.currentRoute.value.path).toBe(`/exercises/${benchPress.id}`)
    })

    it('navigates back without a dialog when the form is unchanged', async ({ createTestApp }) => {
      const { common, navigateTo } = await createTestApp()

      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')
      if (!benchPress) throw new Error('Seeded "Bench Press" exercise not found')

      await navigateTo({ name: RouteNames.EditExercise, params: { id: benchPress.id } })
      await expect.element(page.getByRole('heading', { name: /edit exercise/i })).toBeVisible()

      await userEvent.click(page.getByRole('button', { name: /go back/i }))
      await common.waitForRoute(/^\/$/)

      expect(common.isDialogOpen()).toBe(false)
    })
  })
})
