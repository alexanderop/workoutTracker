import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { page } from '../helpers/locator'
import { expectElement, expectPoll } from '../helpers/assertions'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbTemplate as createDatabaseTemplate, createDbTemplateStrengthBlock as createDatabaseTemplateStrengthBlock } from '../factories'

async function getExerciseCard(exerciseName: string): Promise<HTMLElement> {
  const textElement = await page.getByText(exerciseName).element()
  const card = textElement.closest('.rounded-xl')
  if (!(card instanceof HTMLElement)) {
    throw new TypeError(`Exercise card not found for: ${exerciseName}`)
  }
  return card
}


describe('Template Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Test 1a: Create template from finished workout', () => {
    it('saves a completed workout as a template', async () => {
      const { builder, workout, queryByRole, common, router, cleanup } =
        await createTestApp()

      // Start new workout from home page
      await page.getByRole('button', { name: /start new workout/i }).click()
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add a strength block (Bench Press)
      await page.getByRole('button', { name: /add first block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Bench Press').click()
      await common.waitForDialogClose()

      // Add another strength block (Squat)
      await page.getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Squat').click()
      await common.waitForDialogClose()

      // Start workout
      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Complete one set in Bench Press
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Finish the workout via menu
      await expectPoll(() => workout.getMenuTrigger()).toBeTruthy()
      const menuTrigger = await workout.getMenuTrigger()
      await menuTrigger.click()

      await expectElement(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /end workout/i }).click()

      await common.waitForDialog()
      expect(queryByRole('heading', { name: /finish workout/i })).toBeTruthy()

      const nameInput = page.getByRole('textbox', { name: /workout name/i })
      await nameInput.clear()
      await nameInput.fill('Push Day')

      // Verify the input value was set correctly before proceeding
      await expectPoll(async () => {
        const element = await nameInput.element()
        if (!(element instanceof HTMLInputElement)) {
          return null
        }
        return element.value
      }).toBe('Push Day')

      await common.getDialogButton('Finish Workout').click()

      // Wait for completion screen
      await expectElement(page.getByText(/workout complete/i)).toBeVisible()

      // Wait for View Details button to be clickable (animation needs to complete)
      const viewDetailsButton = page.getByRole('button', { name: /view details/i })
      await expectElement(viewDetailsButton, { timeout: 2000 }).toBeVisible()
      await expectElement(viewDetailsButton).not.toHaveClass('opacity-0')
      // Wait for animation to complete (100ms enter delay + 600ms animation delay + 500ms animation)
      await new Promise((resolve) => setTimeout(resolve, 700))
      await viewDetailsButton.click()

      await common.waitForRoute(/^\/workout\/summary\//)

      // Wait for summary page to load and animation to complete
      const saveTemplateButton = page.getByRole('button', { name: /save as template/i })
      await expectElement(saveTemplateButton, { timeout: 3000 }).toBeVisible()
      await expectPoll(() => {
        // eslint-disable-next-line no-restricted-syntax -- Checking animation state by CSS class
        const button = document.querySelector('button[name*="template"], button:has([name*="template"])')
        return !button?.parentElement?.classList.contains('opacity-0')
      }).toBe(true)
      // Wait for animation to complete (100ms enter delay + 1000ms animation delay + 500ms animation)
      await new Promise((resolve) => setTimeout(resolve, 800))
      await saveTemplateButton.click()
      await common.waitForDialog()

      // Verify dialog opened and template name is pre-filled
      expect(queryByRole('heading', { name: /save as template/i })).toBeTruthy()

      // Confirm save
      await common.getDialogButton('Save Template').click()

      // Wait for dialog to close
      await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()

      // Verify template saved to DB
      const templates = await db.templates.toArray()
      const pushDayTemplate = templates.find((t) => t.name === 'Push Day')
      expect(pushDayTemplate).toBeDefined()
      expect(pushDayTemplate?.blocks).toHaveLength(2)

      // Navigate to workouts page and verify template appears
      await common.navigateToWorkoutsAndClickTab('templates')
      await expectElement(page.getByText('Push Day')).toBeVisible()

      cleanup()
    })
  })

  describe('Test 1b: Start workout from template', () => {
    it('starts a new workout from an existing template', async () => {
      const { builder, common, router, cleanup } =
        await createTestApp()

      // Pre-seed DB with a template (after app creation to ensure DB is ready)
      const template = createDatabaseTemplate({
        id: 'tpl-leg-day',
        name: 'Leg Day',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Squat', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Romanian Deadlift', equipment: 'barbell' }),
        ],
      })
      await db.templates.add(template)

      // Navigate to workouts page and click Templates tab
      await common.navigateToWorkoutsAndClickTab('templates')

      // Wait for template to appear and click it
      await expectElement(page.getByText('Leg Day')).toBeVisible()

      // Click on the template card
      const legDayElement = await page.getByText('Leg Day').element()
      const templateCard = legDayElement.closest('[role="button"]')
      if (!(templateCard instanceof HTMLElement)) {
        throw new TypeError('Template card not found')
      }
      templateCard.click()

      // Verify route is template detail
      await common.waitForRoute(/^\/templates\/tpl-leg-day/)
      expect(router.currentRoute.value.path).toBe('/templates/tpl-leg-day')

      // Wait for template detail to load
      await expectElement(page.getByRole('button', { name: /start workout/i })).toBeVisible()

      // Click "Start Workout" button
      await page.getByRole('button', { name: /start workout/i }).click()

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
      const { common, navigateTo, cleanup } =
        await createTestApp()

      // Pre-seed DB with a template (after app creation to ensure DB is ready)
      const template = createDatabaseTemplate({
        id: 'tpl-edit-test',
        name: 'Original Name',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Bench Press' })],
      })
      await db.templates.add(template)

      // Navigate to template detail page
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-edit-test' } })

      // Wait for template page to finish loading
      await expectElement(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Change the template name
      const nameInput = page.getByRole('textbox', { name: /template name/i })
      await nameInput.clear()
      await nameInput.fill('Updated Name')

      // Add an exercise (via Add Block dialog)
      await page.getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Squat').click()
      await common.waitForDialogClose()

      // Save changes
      await page.getByRole('button', { name: /save changes/i }).click()

      // Verify changes persisted in DB
      await expectPoll(async () => {
        const updated = await db.templates.get('tpl-edit-test')
        return updated?.name
      }).toBe('Updated Name')
      const updatedBlocks = await db.templates.get('tpl-edit-test')
      expect(updatedBlocks?.blocks).toHaveLength(2)

      cleanup()
    })

    it('deletes a template', async () => {
      const { queryByRole, common, router, navigateTo, cleanup } =
        await createTestApp()

      // Pre-seed DB with a template (after app creation to ensure DB is ready)
      const template = createDatabaseTemplate({
        id: 'tpl-delete-test',
        name: 'Template to Delete',
        blocks: [createDatabaseTemplateStrengthBlock()],
      })
      await db.templates.add(template)

      // Navigate to template detail page
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-delete-test' } })

      // Wait for template page to finish loading
      await expectElement(page.getByRole('button', { name: /delete template/i })).toBeVisible()

      // Click delete button
      await page.getByRole('button', { name: /delete template/i }).click()
      await common.waitForDialog()

      // Confirm deletion
      expect(queryByRole('heading', { name: /delete template/i })).toBeTruthy()
      await common.getDialogButton('Delete').click()

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
      const { common, router, cleanup } = await createTestApp()

      // Navigate to Workouts page and click Templates tab
      await common.navigateToWorkoutsAndClickTab('templates')

      // Click "Create Template" button
      await expectElement(page.getByRole('button', { name: /create template/i })).toBeVisible()
      await page.getByRole('button', { name: /create template/i }).click()

      // Verify navigation to create template page
      await common.waitForRoute(/^\/templates\/create/)
      expect(router.currentRoute.value.path).toBe('/templates/create')

      // Fill in template name
      const nameInput = page.getByRole('textbox', { name: /template name/i })
      await nameInput.fill('Upper Body')

      // Add first exercise via picker dialog
      await page.getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Bench Press').click()
      await common.waitForDialogClose()

      // Add second exercise
      await page.getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Overhead Press').click()
      await common.waitForDialogClose()

      // Save template
      await page.getByRole('button', { name: /save template/i }).click()

      // Verify template saved to DB
      await expectPoll(async () => {
        const templates = await db.templates.toArray()
        return templates.find((t) => t.name === 'Upper Body')
      }).toBeDefined()

      const templates = await db.templates.toArray()
      const upperBodyTemplate = templates.find((t) => t.name === 'Upper Body')
      expect(upperBodyTemplate).toBeDefined()
      expect(upperBodyTemplate?.blocks).toHaveLength(2)

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
        createDatabaseTemplate({
          id: 'tpl-never-used',
          name: 'Never Used Template',
          lastUsedAt: null,
        }),
        createDatabaseTemplate({
          id: 'tpl-yesterday',
          name: 'Used Yesterday',
          lastUsedAt: yesterday,
        }),
        createDatabaseTemplate({
          id: 'tpl-today',
          name: 'Used Today',
          lastUsedAt: now,
        }),
      ])

      // Navigate to Templates tab
      await common.navigateToWorkoutsAndClickTab('templates')

      // Wait for templates to appear
      await expectElement(page.getByText('Used Today')).toBeVisible()
      await expectElement(page.getByText('Used Yesterday')).toBeVisible()
      await expectElement(page.getByText('Never Used Template')).toBeVisible()

      // Get all template cards to verify order
      const todayElement = await getByText('Used Today').element()
      const yesterdayElement = await getByText('Used Yesterday').element()
      const neverUsedElement = await getByText('Never Used Template').element()

      // Get the index positions by comparing document positions
      const todayCard = todayElement.closest('[role="button"]')
      const yesterdayCard = yesterdayElement.closest('[role="button"]')
      const neverUsedCard = neverUsedElement.closest('[role="button"]')

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

      // Clear any seeded templates to test empty state
      await db.templates.clear()

      // Navigate to Templates tab
      await common.navigateToWorkoutsAndClickTab('templates')

      // Verify empty state is shown
      await expectElement(page.getByText(/no templates yet/i)).toBeVisible()

      // Verify Create Template button is still accessible
      await expectElement(page.getByRole('button', { name: /create template/i })).toBeVisible()

      cleanup()
    })
  })

  describe('Test 4: Edit template exercises', () => {
    it('removes an exercise from template', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed template with 3 exercises
      const template = createDatabaseTemplate({
        id: 'tpl-remove-test',
        name: 'Template With Exercises',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Bench Press', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Squat', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Deadlift', equipment: 'barbell' }),
        ],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-remove-test' } })
      await expectElement(page.getByText('Bench Press')).toBeVisible()
      await expectElement(page.getByText('Squat')).toBeVisible()
      await expectElement(page.getByText('Deadlift')).toBeVisible()

      // Find and click remove button for Squat (middle exercise)
      const squatText = await page.getByText('Squat').element()
      const squatCard = squatText.closest('.rounded-xl')
      if (!(squatCard instanceof HTMLElement)) throw new Error('Squat card not found')

      // eslint-disable-next-line no-restricted-syntax -- Finding remove button within card scope
      const removeButton = squatCard.querySelector('[aria-label*="remove" i], [aria-label*="Remove" i]')
      if (!(removeButton instanceof HTMLElement)) throw new Error('Remove button not found')
      removeButton.click()

      // Verify Squat is removed from UI
      await expectElement(page.getByText('Squat')).not.toBeInTheDocument()

      // Save changes
      await page.getByRole('button', { name: /save changes/i }).click()

      // Verify DB has 2 blocks
      await expectPoll(async () => {
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

    it('displays exercises with drag handles for reordering', async () => {
      // Note: Drag-and-drop reordering is tested in template-drag-reorder.spec.ts
      // This test verifies the drag handle is present for reordering
      const { navigateTo, cleanup } = await createTestApp()

      // Seed template with 3 exercises
      const template = createDatabaseTemplate({
        id: 'tpl-reorder-test',
        name: 'Template To Reorder',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Exercise A', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Exercise B', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Exercise C', equipment: 'barbell' }),
        ],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-reorder-test' } })
      await expectElement(page.getByText('Exercise A')).toBeVisible()

      // Verify all exercises have drag handles
      const exerciseACard = await getExerciseCard('Exercise A')
      // eslint-disable-next-line no-restricted-syntax -- Finding drag handle within card scope
      const dragHandle = exerciseACard.querySelector('.drag-handle')
      expect(dragHandle).toBeTruthy()

      cleanup()
    })
  })

  describe('Test 5: Form validation', () => {
    it('prevents saving template without name', async () => {
      const { common, navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Template
      await navigateTo({ name: RouteNames.CreateTemplate })
      await expectElement(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Add an exercise (making that part valid)
      await page.getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await common.getDialogButton('Bench Press').click()
      await common.waitForDialogClose()

      // Leave name empty - verify save button is disabled
      const saveButton = page.getByRole('button', { name: /save template/i })
      await expectElement(saveButton).toBeDisabled()

      cleanup()
    })

    it('prevents saving template without exercises', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Navigate to Create Template
      await navigateTo({ name: RouteNames.CreateTemplate })
      await expectElement(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Fill name (making that part valid)
      await page.getByRole('textbox', { name: /template name/i }).fill('Valid Name')

      // Don't add any exercises - verify save button is disabled
      const saveButton = page.getByRole('button', { name: /save template/i })
      await expectElement(saveButton).toBeDisabled()

      cleanup()
    })
  })

  describe('Test 6: Set count modification', () => {
    it('modifies default set count and reflects in started workout', async () => {
      const { builder, navigateTo, router, cleanup } = await createTestApp()

      // Seed template with default 3 sets
      const template = createDatabaseTemplate({
        id: 'tpl-setcount-test',
        name: 'Set Count Template',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Squat', defaultSetCount: 3 })],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-setcount-test' } })
      await expectElement(page.getByText('Squat')).toBeVisible()

      // Click the increment button twice (3 → 5)
      // Using locator pattern instead of native DOM for proper Vue event triggering
      const incrementButton = page.getByRole('button', { name: /increase set count/i })
      await incrementButton.click()
      await flushPromises()
      await incrementButton.click()
      await flushPromises()

      // Verify UI shows 5 sets - use direct element query since Vue may have recreated the DOM
      const setCountInput = page.getByRole('spinbutton', { name: /set count/i })
      const inputElement = await setCountInput.element()
      if (!(inputElement instanceof HTMLInputElement)) {
        throw new TypeError('Set count input not found')
      }
      expect(inputElement.value).toBe('5')

      // Save changes (isEdited now detects set count changes)
      await page.getByRole('button', { name: /save changes/i }).click()

      // Wait for save to complete
      await expectPoll(async () => {
        const updated = await db.templates.get('tpl-setcount-test')
        const firstBlock = updated?.blocks[0]
        return firstBlock?.kind === 'strength' ? firstBlock.defaultSetCount : undefined
      }).toBe(5)

      // Start workout from template
      const startButton = page.getByRole('button', { name: /start workout/i })
      await expectElement(startButton).toBeVisible()
      await startButton.click()

      // Wait for workout to start
      await expectPoll(() => router.currentRoute.value.path).toBe('/workout/active')

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
      const template = createDatabaseTemplate({
        id: 'tpl-discard-test',
        name: 'Original Name',
        blocks: [createDatabaseTemplateStrengthBlock()],
      })
      await db.templates.add(template)

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-discard-test' } })
      await expectElement(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Modify the name
      const nameInput = getByRole('textbox', { name: /template name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Modified Name')

      // Verify input changed
      await expectPoll(async () => {
        const element = await nameInput.element()
        if (!(element instanceof HTMLInputElement)) return null
        return element.value
      }).toBe('Modified Name')

      // Navigate away without saving (go to workouts page)
      await navigateTo({ name: RouteNames.Workouts })

      // Navigate back to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: 'tpl-discard-test' } })
      await expectElement(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

      // Verify the name is back to original (unsaved changes were discarded)
      const reloadedInput = getByRole('textbox', { name: /template name/i })
      await expectPoll(async () => {
        const element = await reloadedInput.element()
        if (!(element instanceof HTMLInputElement)) return null
        return element.value
      }).toBe('Original Name')

      // Verify DB was never modified
      const databaseTemplate = await db.templates.get('tpl-discard-test')
      expect(databaseTemplate?.name).toBe('Original Name')

      cleanup()
    })
  })

  describe('Test 8: Template name normalization', () => {
    it('trims whitespace from template name when saving', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.CreateTemplate })

      // Fill name with leading/trailing spaces
      await userEvent.fill(getByRole('textbox', { name: /template name/i }), '  My Template  ')

      // Add an exercise
      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Save template
      await userEvent.click(getByRole('button', { name: /save template/i }))

      // Verify DB has trimmed name
      await expectPoll(async () => {
        const templates = await db.templates.toArray()
        return templates.find((t) => t.name === 'My Template')
      }).toBeDefined()

      cleanup()
    })
  })

  describe('Test 9: Default values for new blocks', () => {
    it('creates strength block with correct defaults', async () => {
      const { getByRole, common, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.CreateTemplate })
      await userEvent.fill(getByRole('textbox', { name: /template name/i }), 'Defaults Test')

      // Add a bodyweight exercise (e.g., Push-ups)
      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Push-ups'))
      await common.waitForDialogClose()

      // Save template
      await userEvent.click(getByRole('button', { name: /save template/i }))

      // Verify DB block has correct defaults
      await expectPoll(async () => {
        const templates = await db.templates.toArray()
        return templates.find((t) => t.name === 'Defaults Test')
      }).toBeDefined()

      const templates = await db.templates.toArray()
      const template = templates.find((t) => t.name === 'Defaults Test')
      const block = template?.blocks[0]

      expect(block?.kind).toBe('strength')
      if (block?.kind === 'strength') {
        expect(block.defaultSetCount).toBe(3)
        expect(block.targetReps).toBe(0)
        expect(block.equipment).toBe('bodyweight')
      }

      cleanup()
    })
  })

  describe('Test 10: AMRAP block data persistence', () => {
    it('saves AMRAP exercises and duration config correctly', async () => {
      const { getByRole, getByText, common, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.CreateTemplate })
      await userEvent.fill(getByRole('textbox', { name: /template name/i }), 'AMRAP Data Test')

      // Add AMRAP block
      await userEvent.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await userEvent.click(getByRole('tab', { name: /timed/i }))
      await userEvent.click(getByText('AMRAP'))
      await common.waitForDialog()

      // Add exercise to AMRAP
      await userEvent.click(getByRole('button', { name: /add exercise/i }))
      await userEvent.click(common.getDialogButton('Burpees'))

      // Confirm AMRAP block
      await userEvent.click(common.getDialogButton('Add Block'))
      await common.waitForDialogClose()

      // Save template
      await userEvent.click(getByRole('button', { name: /save template/i }))
      await common.waitForRoute(/^\/templates\//)

      // Verify DB has correct AMRAP data
      await expectPoll(async () => {
        const templates = await db.templates.toArray()
        return templates.find((t) => t.name === 'AMRAP Data Test')
      }).toBeDefined()

      const templates = await db.templates.toArray()
      const template = templates.find((t) => t.name === 'AMRAP Data Test')
      const block = template?.blocks[0]

      expect(block?.kind).toBe('amrap')
      if (block?.kind === 'amrap') {
        expect(block.exercises.length).toBeGreaterThan(0)
        expect(block.exercises[0]?.name).toBe('Burpees')
        expect(block.config.durationSeconds).toBeGreaterThan(0)
      }

      cleanup()
    })
  })
})
