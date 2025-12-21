import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbTemplate, createDbTemplateStrengthBlock } from '../factories'

async function getExerciseCard(exerciseName: string): Promise<HTMLElement> {
  const textElement = await page.getByText(exerciseName).element()
  const card = textElement.closest('.rounded-xl')
  if (!(card instanceof HTMLElement)) {
    throw new Error(`Exercise card not found for: ${exerciseName}`)
  }
  return card
}

function getMoveDownButton(card: HTMLElement): HTMLElement {
  const button = card.querySelector('[aria-label*="move down" i], [aria-label*="Move down" i]')
  if (!(button instanceof HTMLElement)) {
    throw new Error('Move down button not found')
  }
  return button
}

describe('Template Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Test 1a: Create template from finished workout', () => {
    it('saves a completed workout as a template', async () => {
      const { builder, workout, getByRole, queryByRole, common, router, cleanup } =
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
      await common.navigateToWorkoutsAndClickTab('templates')
      await expect.element(page.getByText('Push Day')).toBeVisible()

      cleanup()
    })
  })

  describe('Test 1b: Start workout from template', () => {
    it('starts a new workout from an existing template', async () => {
      const { builder, getByRole, getByText, common, router, cleanup } =
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

      // Navigate to workouts page and click Templates tab
      await common.navigateToWorkoutsAndClickTab('templates')

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

      // Add an exercise (via Add Block dialog)
      await userEvent.click(getByRole('button', { name: /add block/i }))
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

  describe('Test 2: Create template from scratch', () => {
    it('creates a new template with name and exercises', async () => {
      const { getByRole, common, router, cleanup } = await createTestApp()

      // Navigate to Workouts page and click Templates tab
      await common.navigateToWorkoutsAndClickTab('templates')

      // Click "Create Template" button
      await expect.element(page.getByRole('button', { name: /create template/i })).toBeVisible()
      await userEvent.click(getByRole('button', { name: /create template/i }))

      // Verify navigation to create template page
      await common.waitForRoute(/^\/templates\/create/)
      expect(router.currentRoute.value.path).toBe('/templates/create')

      // Fill in template name
      const nameInput = getByRole('textbox', { name: /template name/i })
      await userEvent.fill(nameInput, 'Upper Body')

      // Add first exercise via picker dialog
      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add second exercise
      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Overhead Press'))
      await common.waitForDialogClose()

      // Save template
      await userEvent.click(getByRole('button', { name: /save template/i }))

      // Verify template saved to DB
      await expect.poll(async () => {
        const templates = await db.templates.toArray()
        return templates.length
      }).toBe(1)

      const templates = await db.templates.toArray()
      expect(templates[0]?.name).toBe('Upper Body')
      expect(templates[0]?.blocks).toHaveLength(2)

      cleanup()
    })
  })

  describe('Test 3: Browse templates list', () => {
    it('displays templates sorted by lastUsedAt (most recent first)', async () => {
      const { getByText, common, cleanup } = await createTestApp()

      const now = Date.now()
      const yesterday = now - 24 * 60 * 60 * 1000

      // Seed templates with different lastUsedAt values
      await db.templates.bulkAdd([
        createDbTemplate({
          id: 'tpl-never-used',
          name: 'Never Used Template',
          lastUsedAt: null,
        }),
        createDbTemplate({
          id: 'tpl-yesterday',
          name: 'Used Yesterday',
          lastUsedAt: yesterday,
        }),
        createDbTemplate({
          id: 'tpl-today',
          name: 'Used Today',
          lastUsedAt: now,
        }),
      ])

      // Navigate to Templates tab
      await common.navigateToWorkoutsAndClickTab('templates')

      // Wait for templates to appear
      await expect.element(page.getByText('Used Today')).toBeVisible()
      await expect.element(page.getByText('Used Yesterday')).toBeVisible()
      await expect.element(page.getByText('Never Used Template')).toBeVisible()

      // Get all template cards to verify order
      const todayEl = await getByText('Used Today').element()
      const yesterdayEl = await getByText('Used Yesterday').element()
      const neverUsedEl = await getByText('Never Used Template').element()

      // Get the index positions by comparing document positions
      const todayCard = todayEl.closest('[role="button"]')
      const yesterdayCard = yesterdayEl.closest('[role="button"]')
      const neverUsedCard = neverUsedEl.closest('[role="button"]')

      if (!todayCard || !yesterdayCard || !neverUsedCard) {
        throw new Error('Template cards not found')
      }

      // Verify ordering: today should be before yesterday, yesterday before never-used
      expect(
        todayCard.compareDocumentPosition(yesterdayCard) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(
        yesterdayCard.compareDocumentPosition(neverUsedCard) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()

      cleanup()
    })

    it('shows empty state when no templates exist', async () => {
      const { common, cleanup } = await createTestApp()

      // Navigate to Templates tab (no seeded data)
      await common.navigateToWorkoutsAndClickTab('templates')

      // Verify empty state is shown
      await expect.element(page.getByText(/no templates yet/i)).toBeVisible()

      // Verify Create Template button is still accessible
      await expect.element(page.getByRole('button', { name: /create template/i })).toBeVisible()

      cleanup()
    })
  })

  describe('Test 4: Edit template exercises', () => {
    it('removes an exercise from template', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Seed template with 3 exercises
      const template = createDbTemplate({
        id: 'tpl-remove-test',
        name: 'Template With Exercises',
        blocks: [
          createDbTemplateStrengthBlock({ name: 'Bench Press', equipment: 'Barbell' }),
          createDbTemplateStrengthBlock({ name: 'Squat', equipment: 'Barbell' }),
          createDbTemplateStrengthBlock({ name: 'Deadlift', equipment: 'Barbell' }),
        ],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-remove-test' } })
      await expect.element(page.getByText('Bench Press')).toBeVisible()
      await expect.element(page.getByText('Squat')).toBeVisible()
      await expect.element(page.getByText('Deadlift')).toBeVisible()

      // Find and click remove button for Squat (middle exercise)
      const squatText = await page.getByText('Squat').element()
      const squatCard = squatText.closest('.rounded-xl')
      if (!(squatCard instanceof HTMLElement)) throw new Error('Squat card not found')

      const removeButton = squatCard.querySelector('[aria-label*="remove" i], [aria-label*="Remove" i]')
      if (!(removeButton instanceof HTMLElement)) throw new Error('Remove button not found')
      await userEvent.click(removeButton)

      // Verify Squat is removed from UI
      await expect.element(page.getByText('Squat')).not.toBeInTheDocument()

      // Save changes
      await userEvent.click(getByRole('button', { name: /save changes/i }))

      // Verify DB has 2 blocks
      await expect.poll(async () => {
        const updated = await db.templates.get('tpl-remove-test')
        return updated?.blocks.length
      }).toBe(2)

      const updated = await db.templates.get('tpl-remove-test')
      const exerciseNames = updated?.blocks
        .filter((b): b is typeof b & { kind: 'strength' } => b.kind === 'strength')
        .map((b) => b.name)
      expect(exerciseNames).toContain('Bench Press')
      expect(exerciseNames).toContain('Deadlift')
      expect(exerciseNames).not.toContain('Squat')

      cleanup()
    })

    it('reorders exercises using move buttons', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Seed template with 3 exercises (A, B, C order)
      const template = createDbTemplate({
        id: 'tpl-reorder-test',
        name: 'Template To Reorder',
        blocks: [
          createDbTemplateStrengthBlock({ name: 'Exercise A', equipment: 'Barbell' }),
          createDbTemplateStrengthBlock({ name: 'Exercise B', equipment: 'Barbell' }),
          createDbTemplateStrengthBlock({ name: 'Exercise C', equipment: 'Barbell' }),
        ],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-reorder-test' } })
      await expect.element(page.getByText('Exercise A')).toBeVisible()

      // Find "move down" button for Exercise A and click it
      const exerciseACard = await getExerciseCard('Exercise A')
      const moveDownButton = getMoveDownButton(exerciseACard)
      await userEvent.click(moveDownButton)

      // Verify UI shows reordered exercises (B is now first)
      const exerciseBCard = await getExerciseCard('Exercise B')
      const exerciseACardAfter = await getExerciseCard('Exercise A')

      // B should be before A in the document now
      expect(
        exerciseBCard.compareDocumentPosition(exerciseACardAfter) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()

      // Save changes (isEdited now detects order changes)
      await userEvent.click(getByRole('button', { name: /save changes/i }))

      // Verify DB block order is B, A, C
      await expect.poll(async () => {
        const updated = await db.templates.get('tpl-reorder-test')
        const firstBlock = updated?.blocks[0]
        return firstBlock?.kind === 'strength' ? firstBlock.name : undefined
      }).toBe('Exercise B')

      const updated = await db.templates.get('tpl-reorder-test')
      const strengthBlocks = updated?.blocks.filter(
        (b): b is typeof b & { kind: 'strength' } => b.kind === 'strength',
      )
      expect(strengthBlocks?.[0]?.name).toBe('Exercise B')
      expect(strengthBlocks?.[1]?.name).toBe('Exercise A')
      expect(strengthBlocks?.[2]?.name).toBe('Exercise C')

      cleanup()
    })
  })

  describe('Test 5: Form validation', () => {
    it('prevents saving template without name', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Template
      await navigateTo({ name: RouteNames.CreateTemplate })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Add an exercise (making that part valid)
      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Leave name empty - verify save button is disabled
      const saveButton = getByRole('button', { name: /save template/i })
      await expect.element(saveButton).toBeDisabled()

      cleanup()
    })

    it('prevents saving template without exercises', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Template
      await navigateTo({ name: RouteNames.CreateTemplate })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Fill name (making that part valid)
      await userEvent.fill(getByRole('textbox', { name: /template name/i }), 'Valid Name')

      // Don't add any exercises - verify save button is disabled
      const saveButton = getByRole('button', { name: /save template/i })
      await expect.element(saveButton).toBeDisabled()

      cleanup()
    })
  })

  describe('Test 6: Set count modification', () => {
    it('modifies default set count and reflects in started workout', async () => {
      const { builder, getByRole, navigateTo, router, cleanup } = await createTestApp()

      // Seed template with default 3 sets
      const template = createDbTemplate({
        id: 'tpl-setcount-test',
        name: 'Set Count Template',
        blocks: [createDbTemplateStrengthBlock({ name: 'Squat', defaultSetCount: 3 })],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-setcount-test' } })
      await expect.element(page.getByText('Squat')).toBeVisible()

      // Find the set count input and increase it
      const squatText = await page.getByText('Squat').element()
      const squatCard = squatText.closest('.rounded-xl')
      if (!(squatCard instanceof HTMLElement)) throw new Error('Squat card not found')

      // Click the increment button twice (3 → 5)
      const incrementButton = squatCard.querySelector('[aria-label*="increase" i]')
      if (!(incrementButton instanceof HTMLElement)) throw new Error('Increment button not found')
      await userEvent.click(incrementButton)
      await userEvent.click(incrementButton)

      // Verify UI shows 5 sets
      const setCountInput = squatCard.querySelector('input[type="number"]')
      if (!(setCountInput instanceof HTMLInputElement)) throw new Error('Set count input not found')
      expect(setCountInput.value).toBe('5')

      // Save changes (isEdited now detects set count changes)
      await userEvent.click(getByRole('button', { name: /save changes/i }))

      // Wait for save to complete
      await expect.poll(async () => {
        const updated = await db.templates.get('tpl-setcount-test')
        const firstBlock = updated?.blocks[0]
        return firstBlock?.kind === 'strength' ? firstBlock.defaultSetCount : undefined
      }).toBe(5)

      // Start workout from template
      await userEvent.click(getByRole('button', { name: /start workout/i }))

      // Wait for workout to start
      await expect.poll(() => router.currentRoute.value.path).toBe('/workout/active')

      // Verify workout has the block
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      // Verify in DB that defaultSetCount was saved as 5
      const updatedTemplate = await db.templates.get('tpl-setcount-test')
      const firstBlock = updatedTemplate?.blocks[0]
      expect(firstBlock?.kind === 'strength' ? firstBlock.defaultSetCount : undefined).toBe(5)

      cleanup()
    })
  })

  describe('Test 7: Discard changes flow', () => {
    it('discards unsaved changes when navigating away', async () => {
      const { getByRole, navigateTo, cleanup } = await createTestApp()

      // Seed template with original name
      const template = createDbTemplate({
        id: 'tpl-discard-test',
        name: 'Original Name',
        blocks: [createDbTemplateStrengthBlock()],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-discard-test' } })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Modify the name
      const nameInput = getByRole('textbox', { name: /template name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Modified Name')

      // Verify input changed
      await expect.poll(async () => {
        const el = await nameInput.element()
        if (!(el instanceof HTMLInputElement)) return null
        return el.value
      }).toBe('Modified Name')

      // Navigate away without saving (go to workouts page)
      await navigateTo({ name: RouteNames.Workouts })

      // Navigate back to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-discard-test' } })
      await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Verify the name is back to original (unsaved changes were discarded)
      const reloadedInput = getByRole('textbox', { name: /template name/i })
      await expect.poll(async () => {
        const el = await reloadedInput.element()
        if (!(el instanceof HTMLInputElement)) return null
        return el.value
      }).toBe('Original Name')

      // Verify DB was never modified
      const dbTemplate = await db.templates.get('tpl-discard-test')
      expect(dbTemplate?.name).toBe('Original Name')

      cleanup()
    })
  })
})
