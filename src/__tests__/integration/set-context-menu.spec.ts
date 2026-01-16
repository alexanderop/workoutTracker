import { flushPromises } from '@vue/test-utils'
import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { SetContextMenuPO } from '../helpers/pages/SetContextMenuPO'
import { ensureHTMLElement } from '../helpers/domHelpers'

/**
 * Gets the table row element from set inputs.
 */
function getRowFromInputs(setRow: { kg: HTMLInputElement }): HTMLElement {
  const row = setRow.kg.closest('tr')
  if (!row) {
    throw new Error('Could not find table row element from set inputs')
  }
  return ensureHTMLElement(row)
}

describe('Set Context Menu', () => {
  beforeEach(setupIntegrationTest)

  afterEach(async () => {
    await flushPromises()
    await cleanupIntegrationTest()
  })

  describe('Opening the menu', () => {
    it('opens context menu on long press', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      // Get the first set row element
      const setRow = await workout.getSetRow(0)
      const rowElement = getRowFromInputs(setRow)

      // Long press to open menu
      await contextMenu.longPress(rowElement)
      await contextMenu.waitForOpen()

      // Verify menu options are present
      await expect.element(contextMenu.getDeleteOption()).toBeVisible()
      await expect.element(contextMenu.getDuplicateOption()).toBeVisible()

      app.cleanup()
    })
  })

  describe('Delete action', () => {
    it('removes the set when delete is clicked', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Squat')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      // Should have 3 sets initially (default)
      const initialRows = await page.getByRole('table').getByRole('row').all()
      const initialSetCount = initialRows.length - 1 // Exclude header

      // Long press on second set
      const setRow = await workout.getSetRow(1)
      const rowElement = getRowFromInputs(setRow)
      await contextMenu.longPress(rowElement)
      await contextMenu.waitForOpen()

      // Click delete
      await contextMenu.clickDelete()
      await contextMenu.waitForClose()

      // Verify set count decreased
      await expect.poll(async () => {
        const rows = await page.getByRole('table').getByRole('row').all()
        return rows.length - 1
      }).toBe(initialSetCount - 1)

      app.cleanup()
    })

    it('disables delete when only one set remains', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      // Delete sets until only 1 remains (start with 3 sets, delete 2)
      for (const _ of [1, 2]) {
        const setRow = await workout.getSetRow(0)
        const rowElement = getRowFromInputs(setRow)
        await contextMenu.longPress(rowElement)
        await contextMenu.waitForOpen()
        await contextMenu.clickDelete()
        await contextMenu.waitForClose()
        await flushPromises()
      }

      // Verify only 1 set remains
      await expect.poll(async () => {
        const rows = await page.getByRole('table').getByRole('row').all()
        return rows.length - 1
      }).toBe(1)

      // Long press on the only remaining set
      const setRow = await workout.getSetRow(0)
      const rowElement = getRowFromInputs(setRow)
      await contextMenu.longPress(rowElement)
      await contextMenu.waitForOpen()

      // Delete option should be disabled
      const deleteOption = contextMenu.getDeleteOption()
      await expect.element(deleteOption).toHaveAttribute('aria-disabled', 'true')

      app.cleanup()
    })
  })

  describe('Duplicate action', () => {
    it('duplicates a set with same values', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      // Fill first set with specific values
      const firstSet = workout.getSet(0)
      await firstSet.fill({ kg: 100, reps: 8, rir: 2 })

      // Long press on first set
      const setRow = await workout.getSetRow(0)
      const rowElement = getRowFromInputs(setRow)
      await contextMenu.longPress(rowElement)
      await contextMenu.waitForOpen()

      // Click duplicate
      await contextMenu.clickDuplicate()
      await contextMenu.waitForClose()

      // Verify new set was added after first set (now at index 1)
      const newSet = workout.getSet(1)
      const values = await newSet.getValues()

      expect(values.weight).toBe('100')
      expect(values.reps).toBe('8')
      expect(values.rir).toBe('2')

      app.cleanup()
    })

    it('duplicated set is in planned state', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Squat')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      // Complete the first set first
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })
      await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

      // Long press on completed set to duplicate it
      const setRow = await workout.getSetRow(0)
      const rowElement = getRowFromInputs(setRow)
      await contextMenu.longPress(rowElement)
      await contextMenu.waitForOpen()

      await contextMenu.clickDuplicate()
      await contextMenu.waitForClose()

      // New set should be planned (not completed, not active)
      const newSet = workout.getSet(1)
      const isCompleted = await newSet.isCompleted()
      const isActive = await newSet.isActive()

      expect(isCompleted).toBe(false)
      expect(isActive).toBe(false)

      app.cleanup()
    })
  })

  describe('Closing the menu', () => {
    it('closes menu when clicking outside', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      // Open context menu
      const setRow = await workout.getSetRow(0)
      const rowElement = getRowFromInputs(setRow)
      await contextMenu.longPress(rowElement)
      await contextMenu.waitForOpen()

      // Click outside
      await contextMenu.clickOutside()

      // Menu should close
      await contextMenu.waitForClose()

      app.cleanup()
    })

    it('closes menu after selecting an action', async () => {
      const app = await createTestApp()
      const { builder, workout } = app
      const contextMenu = new SetContextMenuPO()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await workout.waitForTableVisible()

      // Open and select duplicate
      const setRow = await workout.getSetRow(0)
      const rowElement = getRowFromInputs(setRow)
      await contextMenu.longPress(rowElement)
      await contextMenu.waitForOpen()

      await contextMenu.clickDuplicate()

      // Menu should be closed
      await contextMenu.waitForClose()
      expect(contextMenu.isVisible()).toBe(false)

      app.cleanup()
    })
  })
})
