import { flushPromises } from '@vue/test-utils'
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { SetContextMenuPO } from '../helpers/pages/SetContextMenuPO'
import { ensureHTMLElement } from '../helpers/domHelpers'

/**
 * Covers Finding 9 (High) from the July 2026 UX review: delete/duplicate a set was
 * only reachable via an undiscoverable 500ms long-press with no a11y-tree presence.
 * These tests verify the new per-row overflow ("options") button that opens the same
 * set context menu, is keyboard-reachable, and exposes a distinguishable accessible
 * name per row (e.g. "Options for set 2"). The long-press shortcut itself is still
 * covered by set-context-menu.spec.ts and must keep passing unchanged.
 */
describe('Set Options Button', () => {
  beforeEach(setupIntegrationTest)

  afterEach(async () => {
    await flushPromises()
    await cleanupIntegrationTest()
  })

  describe('Discoverability', () => {
    it('should expose a distinctly named options button for each set row', async () => {
      const app = await createTestApp()
      const { builder, workout } = app

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      await expect.element(workout.getSetOptionsButton(0)).toBeVisible()
      await expect.element(workout.getSetOptionsButton(1)).toBeVisible()
      await expect.element(workout.getSetOptionsButton(2)).toBeVisible()

      app.cleanup()
    })

    it('should have a 44px or larger touch target', async () => {
      const app = await createTestApp()
      const { builder, workout } = app

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      const button = ensureHTMLElement(await workout.getSetOptionsButton(0).element())
      const rect = button.getBoundingClientRect()

      expect(rect.width).toBeGreaterThanOrEqual(44)
      expect(rect.height).toBeGreaterThanOrEqual(44)

      app.cleanup()
    })
  })

  describe('Opening the menu', () => {
    it('should open the set actions menu when the options button is clicked', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      await workout.getSetOptionsButton(0).click()
      await contextMenu.waitForOpen()

      await expect.element(contextMenu.getDeleteOption()).toBeVisible()
      await expect.element(contextMenu.getDuplicateOption()).toBeVisible()

      app.cleanup()
    })

    it('should be reachable by keyboard and open the menu on Enter', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      const button = ensureHTMLElement(await workout.getSetOptionsButton(0).element())
      button.focus()
      expect(document.activeElement).toBe(button)

      await userEvent.keyboard('{Enter}')
      await contextMenu.waitForOpen()

      await expect.element(contextMenu.getDeleteOption()).toBeVisible()

      app.cleanup()
    })
  })

  describe('Delete via options button', () => {
    it('should remove the set when delete is chosen from the options button menu', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Squat')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      const initialRows = await page.getByRole('table').getByRole('row').all()
      const initialSetCount = initialRows.length - 1 // Exclude header

      await workout.getSetOptionsButton(1).click()
      await contextMenu.waitForOpen()
      await contextMenu.clickDelete()
      await contextMenu.waitForClose()

      await expect
        .poll(async () => {
          const rows = await page.getByRole('table').getByRole('row').all()
          return rows.length - 1
        })
        .toBe(initialSetCount - 1)

      app.cleanup()
    })
  })

  describe('Duplicate via options button', () => {
    it('should duplicate the set with the same values when duplicate is chosen', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      const firstSet = workout.getSet(0)
      await firstSet.fill({ kg: 100, reps: 8, rir: 2 })

      await workout.getSetOptionsButton(0).click()
      await contextMenu.waitForOpen()
      await contextMenu.clickDuplicate()
      await contextMenu.waitForClose()

      const newSet = workout.getSet(1)
      const values = await newSet.getValues()

      expect(values.weight).toBe('100')
      expect(values.reps).toBe('8')
      expect(values.rir).toBe('2')

      app.cleanup()
    })
  })
})
