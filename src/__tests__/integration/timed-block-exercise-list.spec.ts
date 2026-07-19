/* eslint-disable vitest/no-conditional-in-test -- The exercise list has intentional empty-state branches. */
/**
 * Integration tests for timed block exercise list behavior.
 *
 * Tests exercise management within timed block config dialogs (AMRAP/EMOM/ForTime):
 * - Adding and displaying exercises
 * - Editing reps and load values
 * - Removing exercises
 */
import { flushPromises } from '@vue/test-utils'
import { page, userEvent } from 'vitest/browser'
import { afterEach, describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import type { TestApp } from '../helpers/createTestApp'
import { ensureHTMLElement } from '../helpers/domHelpers'

// Helper to open AMRAP config dialog
async function openAmrapConfigDialog(app: TestApp) {
  const { builder, common } = app

  await builder.navigateTo()
  await builder.openAddBlockDialog()
  await builder.switchToTimedBlocksTab()
  await userEvent.click(common.getDialogButton('AMRAP'))

  // Wait for config dialog to open
  await expect.element(page.getByText('Configure')).toBeVisible()
}

// Helper to add exercise via the overlay picker (not dialog mode)
async function addExerciseViaOverlay(app: TestApp, exerciseName: string) {
  const { common } = app

  // Click Add Exercise button in the config dialog
  await userEvent.click(common.getDialogButton('Add Exercise'))

  // Wait for exercise picker overlay to appear by looking for the search placeholder
  await expect.element(page.getByPlaceholder(/search exercises/i)).toBeVisible()

  // Find the search input using placeholder
  const searchInput = page.getByPlaceholder(/search exercises/i)

  await userEvent.fill(searchInput, exerciseName)

  // Wait for filtered results and click the exercise button
  await expect.element(page.getByText(exerciseName, { exact: true })).toBeVisible()

  // Find and click the exercise button (it's a button containing the exercise name)
  const buttons = await page.getByRole('button').all()
  const exerciseButton = await Promise.all(
    buttons.map(async (button) => {
      const element = await button.element()
      const text = element.textContent
      return text?.includes(exerciseName) ? button : null
    }),
  ).then((results) => results.find(Boolean))
  if (!exerciseButton) throw new Error(`Exercise button for ${exerciseName} not found`)

  await userEvent.click(exerciseButton)

  // Wait for exercise to appear in the list (overlay should close in multi mode but exercise stays)
  await expect.element(page.getByRole('dialog').getByText(exerciseName)).toBeVisible()
}

// Type guard for HTMLInputElement
function isInputElement(element: Element | null): element is HTMLInputElement {
  return element instanceof HTMLInputElement
}

// Helper to get exercise rows in the timed block list (distinguished by bg-secondary/30 class)
function getExerciseRows(dialog: HTMLElement): Array<Element> {
  // eslint-disable-next-line no-restricted-syntax -- Finding by CSS class, no accessible equivalent
  return [...dialog.querySelectorAll('[class*="bg-secondary"]')]
}

// Helper to get the reps input within an exercise row
function getRepsInputInRow(row: Element): HTMLInputElement | null {
  // eslint-disable-next-line no-restricted-syntax -- Finding input within row scope
  const input = row.querySelector('input[type="number"]')
  return isInputElement(input) ? input : null
}

// Helper to get the load input within an exercise row
function getLoadInputInRow(row: Element): HTMLInputElement | null {
  // eslint-disable-next-line no-restricted-syntax -- Finding input within row scope
  const input = row.querySelector('input:not([type="number"])')
  return isInputElement(input) ? input : null
}

describe('Timed Block Exercise List', () => {
  afterEach(async () => {
    await flushPromises()
  })

  describe('empty state', () => {
    it('shows empty message when no exercises added', async ({ createTestApp }) => {
      const app = await createTestApp()
      await openAmrapConfigDialog(app)

      // Verify empty state message is shown
      const emptyMessage = await page.getByText(/no exercises added/i).query()
      expect(emptyMessage).toBeTruthy()
    })
  })

  describe('adding exercises', () => {
    it('displays exercise name after adding', async ({ createTestApp }) => {
      const app = await createTestApp()

      await openAmrapConfigDialog(app)
      await addExerciseViaOverlay(app, 'Push-ups')

      // Verify exercise appears in list
      const dialog = await app.getByRole('dialog').element()
      expect(dialog.textContent).toContain('Push-ups')

      // Empty message should be gone
      const emptyMessage2 = await page.getByText(/no exercises added/i).query()
      expect(emptyMessage2).toBeFalsy()
    })

    it('shows reps and load inputs for added exercise', async ({ createTestApp }) => {
      const app = await createTestApp()
      const { getByRole } = app

      await openAmrapConfigDialog(app)
      await addExerciseViaOverlay(app, 'Squat')

      // Find exercise row (distinguished by bg-secondary/30 class)
      const dialog = ensureHTMLElement(await getByRole('dialog').element())
      const exerciseRows = getExerciseRows(dialog)
      expect(exerciseRows).toHaveLength(1)

      // Verify reps input exists within the exercise row
      const repsInput = getRepsInputInRow(exerciseRows[0]!)
      expect(repsInput).not.toBeNull()

      // Verify load input exists within the exercise row
      const loadInput = getLoadInputInRow(exerciseRows[0]!)
      expect(loadInput).not.toBeNull()
    })
  })

  describe('editing exercise values', () => {
    it('allows setting reps value', async ({ createTestApp }) => {
      const app = await createTestApp()
      const { getByRole } = app

      await openAmrapConfigDialog(app)
      await addExerciseViaOverlay(app, 'Push-ups')

      // Find the exercise row and its reps input
      const dialog = ensureHTMLElement(await getByRole('dialog').element())
      const exerciseRows = getExerciseRows(dialog)
      expect(exerciseRows).toHaveLength(1)

      const repInput = getRepsInputInRow(exerciseRows[0]!)
      if (!repInput) {
        throw new Error('Rep input not found')
      }

      await userEvent.clear(repInput)
      await userEvent.fill(repInput, '15')

      // Verify value was set
      expect(repInput.value).toBe('15')
    })

    it('allows setting load value', async ({ createTestApp }) => {
      const app = await createTestApp()
      const { getByRole } = app

      await openAmrapConfigDialog(app)
      await addExerciseViaOverlay(app, 'Kettlebell Swing')

      // Find the exercise row and its load input
      const dialog = ensureHTMLElement(await getByRole('dialog').element())
      const exerciseRows = getExerciseRows(dialog)
      expect(exerciseRows).toHaveLength(1)

      const loadInput = getLoadInputInRow(exerciseRows[0]!)
      if (!loadInput) {
        throw new Error('Load input not found')
      }

      await userEvent.clear(loadInput)
      await userEvent.fill(loadInput, '24kg')

      // Verify value was set
      expect(loadInput.value).toBe('24kg')
    })
  })

  describe('removing exercises', () => {
    it('removes exercise when delete button clicked', async ({ createTestApp }) => {
      const app = await createTestApp()
      const { getByRole } = app

      await openAmrapConfigDialog(app)

      // Add two exercises
      await addExerciseViaOverlay(app, 'Push-ups')
      await addExerciseViaOverlay(app, 'Pull-ups')

      // Verify both exercises are visible
      const dialog = await getByRole('dialog').element()
      expect(dialog.textContent).toContain('Push-ups')
      expect(dialog.textContent).toContain('Pull-ups')

      // Find remove buttons using page locators
      const removeButtonLocators = await page
        .getByRole('button', { name: /remove exercise/i })
        .all()
      expect(removeButtonLocators).toHaveLength(2)

      // Click first remove button
      await removeButtonLocators[0]!.click()

      // First exercise should be removed, second should remain
      await expect
        .poll(async () => {
          const updatedDialog = await getByRole('dialog').element()
          return updatedDialog.textContent?.includes('Push-ups') ?? false
        })
        .toBe(false)
      const updatedDialog = await getByRole('dialog').element()
      expect(updatedDialog.textContent).toContain('Pull-ups')
    })
  })

  describe('add exercise button', () => {
    it('opens exercise picker when add button clicked', async ({ createTestApp }) => {
      const app = await createTestApp()
      const { common } = app

      await openAmrapConfigDialog(app)

      // Click Add Exercise button
      await userEvent.click(common.getDialogButton('Add Exercise'))

      // Exercise picker overlay should open (has a search input and exercise list)
      await expect.element(page.getByText('Push-ups', { exact: true })).toBeVisible()
    })
  })
})
