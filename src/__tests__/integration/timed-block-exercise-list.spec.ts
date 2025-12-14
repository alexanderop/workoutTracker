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
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

function ensureHTMLElement(el: HTMLElement | SVGElement): HTMLElement {
  if (!(el instanceof HTMLElement)) {
    throw new Error('Expected HTMLElement, got SVGElement')
  }
  return el
}

// Helper to open AMRAP config dialog
async function openAmrapConfigDialog(app: Awaited<ReturnType<typeof createTestApp>>) {
  const { builder, common } = app

  await builder.navigateTo()
  await builder.openAddBlockDialog()
  await builder.switchToTimedBlocksTab()
  await userEvent.click(common.getDialogButton('AMRAP'))

  // Wait for config dialog to open
  await expect.element(page.getByText('Configure')).toBeVisible()
}

// Helper to add exercise via the overlay picker (not dialog mode)
async function addExerciseViaOverlay(
  app: Awaited<ReturnType<typeof createTestApp>>,
  exerciseName: string,
) {
  const {  common, getByRole } = app

  // Click Add Exercise button in the config dialog
  await userEvent.click(common.getDialogButton('Add Exercise'))

  // Wait for exercise picker overlay to appear by looking for the search placeholder
  await expect.element(page.getByPlaceholder(/search exercises/i)).toBeVisible()

  // Find the search input using placeholder
  const searchInput = page.getByPlaceholder(/search exercises/i)

  await userEvent.fill(await searchInput.element(), exerciseName)

  // Wait for filtered results and click the exercise button
  await expect.element(page.getByText(exerciseName, { exact: true })).toBeVisible()

  // Find and click the exercise button (it's a button containing the exercise name)
  const buttons = await page.getByRole('button').all()
  const exerciseButton = await Promise.all(
    buttons.map(async btn => {
      const el = await btn.element()
      const text = el.textContent
      return text?.includes(exerciseName) ? btn : null
    })
  ).then(results => results.find(Boolean))
  if (!exerciseButton) throw new Error(`Exercise button for ${exerciseName} not found`)

  await userEvent.click(await exerciseButton.element())

  // Wait for exercise to appear in the list (overlay should close in multi mode but exercise stays)
  await expect.poll(async () => {
    const dialog = await getByRole('dialog').element()
    return dialog.textContent?.includes(exerciseName) ?? false
  }).toBe(true)
}

// Type guard for HTMLInputElement
function isInputElement(element: Element | null): element is HTMLInputElement {
  return element instanceof HTMLInputElement
}

// Helper to get exercise rows in the timed block list (distinguished by bg-secondary/30 class)
function getExerciseRows(dialog: HTMLElement): Array<Element> {
  return Array.from(dialog.querySelectorAll('[class*="bg-secondary"]'))
}

// Helper to get the reps input within an exercise row
function getRepsInputInRow(row: Element): HTMLInputElement | null {
  const input = row.querySelector('input[type="number"]')
  return isInputElement(input) ? input : null
}

// Helper to get the load input within an exercise row
function getLoadInputInRow(row: Element): HTMLInputElement | null {
  const input = row.querySelector('input:not([type="number"])')
  return isInputElement(input) ? input : null
}

describe('Timed Block Exercise List', () => {
  beforeEach(setupIntegrationTest)

  afterEach(async () => {
    await flushPromises()
    await cleanupIntegrationTest()
  })

  describe('empty state', () => {
    it('shows empty message when no exercises added', async () => {
      const app = await createTestApp()
      await openAmrapConfigDialog(app)

      // Verify empty state message is shown
      const emptyMessage = await page.getByText(/no exercises added/i).query()
      expect(emptyMessage).toBeTruthy()

      app.cleanup()
    })
  })

  describe('adding exercises', () => {
    it('displays exercise name after adding', async () => {
      const app = await createTestApp()

      await openAmrapConfigDialog(app)
      await addExerciseViaOverlay(app, 'Push-ups')

      // Verify exercise appears in list
      const dialog = await app.getByRole('dialog').element()
      expect(dialog.textContent).toContain('Push-ups')

      // Empty message should be gone
      const emptyMessage2 = await page.getByText(/no exercises added/i).query()
      expect(emptyMessage2).toBeFalsy()

      app.cleanup()
    })

    it('shows reps and load inputs for added exercise', async () => {
      const app = await createTestApp()
      const { getByRole } = app

      await openAmrapConfigDialog(app)
      await addExerciseViaOverlay(app, 'Squat')

      // Find exercise row (distinguished by bg-secondary/30 class)
      const dialog = ensureHTMLElement(await getByRole('dialog').element())
      const exerciseRows = getExerciseRows(dialog)
      expect(exerciseRows.length).toBe(1)

      // Verify reps input exists within the exercise row
      const repsInput = getRepsInputInRow(exerciseRows[0]!)
      expect(repsInput).not.toBeNull()

      // Verify load input exists within the exercise row
      const loadInput = getLoadInputInRow(exerciseRows[0]!)
      expect(loadInput).not.toBeNull()

      app.cleanup()
    })
  })

  describe('editing exercise values', () => {
    it('allows setting reps value', async () => {
      const app = await createTestApp()
      const {  getByRole } = app

      await openAmrapConfigDialog(app)
      await addExerciseViaOverlay(app, 'Push-ups')

      // Find the exercise row and its reps input
      const dialog = ensureHTMLElement(await getByRole('dialog').element())
      const exerciseRows = getExerciseRows(dialog)
      expect(exerciseRows.length).toBe(1)

      const repInput = getRepsInputInRow(exerciseRows[0]!)
      if (!repInput) {
        throw new Error('Rep input not found')
      }

      await userEvent.clear(repInput)
      await userEvent.fill(repInput, '15')

      // Verify value was set
      expect(repInput.value).toBe('15')

      app.cleanup()
    })

    it('allows setting load value', async () => {
      const app = await createTestApp()
      const {  getByRole } = app

      await openAmrapConfigDialog(app)
      await addExerciseViaOverlay(app, 'Kettlebell Swing')

      // Find the exercise row and its load input
      const dialog = ensureHTMLElement(await getByRole('dialog').element())
      const exerciseRows = getExerciseRows(dialog)
      expect(exerciseRows.length).toBe(1)

      const loadInput = getLoadInputInRow(exerciseRows[0]!)
      if (!loadInput) {
        throw new Error('Load input not found')
      }

      await userEvent.clear(loadInput)
      await userEvent.fill(loadInput, '24kg')

      // Verify value was set
      expect(loadInput.value).toBe('24kg')

      app.cleanup()
    })
  })

  describe('removing exercises', () => {
    it('removes exercise when delete button clicked', async () => {
      const app = await createTestApp()
      const {  getByRole } = app

      await openAmrapConfigDialog(app)

      // Add two exercises
      await addExerciseViaOverlay(app, 'Push-ups')
      await addExerciseViaOverlay(app, 'Pull-ups')

      // Verify both exercises are visible
      const dialog = await getByRole('dialog').element()
      expect(dialog.textContent).toContain('Push-ups')
      expect(dialog.textContent).toContain('Pull-ups')

      // Find remove buttons
      const removeButtons = Array.from(dialog.querySelectorAll('button')).filter((btn) =>
        btn.getAttribute('aria-label')?.toLowerCase().includes('remove'),
      )
      expect(removeButtons.length).toBe(2)

      // Click first remove button
      await userEvent.click(removeButtons[0]!)

      // First exercise should be removed, second should remain
      await expect.poll(async () => {
        const updatedDialog = await getByRole('dialog').element()
        return updatedDialog.textContent?.includes('Push-ups') ?? false
      }).toBe(false)
      const updatedDialog = await getByRole('dialog').element()
      expect(updatedDialog.textContent).toContain('Pull-ups')

      app.cleanup()
    })
  })

  describe('add exercise button', () => {
    it('opens exercise picker when add button clicked', async () => {
      const app = await createTestApp()
      const {  common } = app

      await openAmrapConfigDialog(app)

      // Click Add Exercise button
      await userEvent.click(common.getDialogButton('Add Exercise'))

      // Exercise picker overlay should open (has a search input and exercise list)
      await expect.element(page.getByText('Push-ups', { exact: true })).toBeVisible()

      app.cleanup()
    })
  })
})
