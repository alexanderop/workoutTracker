import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbTemplate as createDatabaseTemplate, createDbTemplateStrengthBlock as createDatabaseTemplateStrengthBlock } from '../factories'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories/dbWorkout.factory'

describe('Log Past Workout', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Entry Flow', () => {
    it('navigates from home to log past workout view', async () => {
      const { getByRole, router, cleanup } = await createTestApp()

      // Find and click the "Log Past Workout" button on home screen
      await expect.element(page.getByRole('button', { name: /log past workout/i })).toBeVisible()
      await userEvent.click(getByRole('button', { name: /log past workout/i }))

      // Verify navigation to log past workout route
      await expect.poll(() => router.currentRoute.value.path).toBe('/log-past-workout')

      cleanup()
    })

    it('shows source selection: template, history, blank', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })

      // Verify all three source options are visible
      await logPastWorkout.assertSourceSelectionVisible()

      cleanup()
    })

    it('loads template exercises when starting from template', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      // Seed a template
      const template = createDatabaseTemplate({
        id: 'tpl-past-workout',
        name: 'Push Day',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Bench Press', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Overhead Press', equipment: 'barbell' }),
        ],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })

      // Select "From Template"
      await logPastWorkout.selectSource('template')

      // Select the template
      await logPastWorkout.selectTemplate('Push Day')

      // Proceed past date-duration step to builder
      await logPastWorkout.proceedToNextStep()

      // Verify exercises are loaded
      await expect.element(page.getByText('Bench Press')).toBeVisible()
      await expect.element(page.getByText('Overhead Press')).toBeVisible()

      // Verify block count
      const blockCount = await logPastWorkout.getBlockCount()
      expect(blockCount).toBe(2)

      cleanup()
    })

    it('loads previous workout data when starting from history', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      // Seed a completed workout
      const workout = databaseWorkoutBuilder()
        .withName('Previous Leg Day')
        .withExerciseAndSets(
          [
            { kg: '100', reps: '5', rir: '2', status: 'completed' },
            { kg: '100', reps: '5', rir: '2', status: 'completed' },
          ],
          { name: 'Squat', equipment: 'barbell' },
        )
        .build()
      await db.workouts.add(workout)

      await navigateTo({ name: RouteNames.LogPastWorkout })

      // Select "From History"
      await logPastWorkout.selectSource('history')

      // Select the workout
      await logPastWorkout.selectFromHistory('Previous Leg Day')

      // Proceed past date-duration step to builder
      await logPastWorkout.proceedToNextStep()

      // Verify exercise is loaded with previous values
      await expect.element(page.getByText('Squat')).toBeVisible()

      cleanup()
    })

    it('shows empty builder when starting blank', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })

      // Select "Blank Workout"
      await logPastWorkout.selectSource('blank')

      // Proceed past date-duration step to builder
      await logPastWorkout.proceedToNextStep()

      // Verify empty state - should show add exercise/block button
      await expect.element(page.getByRole('button', { name: /add.*exercise|add.*block/i })).toBeVisible()

      // Verify no blocks exist
      const blockCount = await logPastWorkout.getBlockCount()
      expect(blockCount).toBe(0)

      cleanup()
    })
  })

  describe('Date & Duration Selection', () => {
    it('displays duration options with actual numbers (not just "min")', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // Check that duration buttons show actual numbers like "15 min", "30 min"
      // This test catches the bug where interpolation fails and shows "min min"
      await expect.element(page.getByText('15 min')).toBeVisible()
      await expect.element(page.getByText('30 min')).toBeVisible()
      await expect.element(page.getByText('45 min')).toBeVisible()
      await expect.element(page.getByText('60 min')).toBeVisible()

      cleanup()
    })

    it('defaults to today with common duration options', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // Verify date defaults to today
      await logPastWorkout.assertDateDefaultsToToday()

      // Verify duration options are visible
      await expect.element(page.getByRole('button', { name: /30\s*min/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /45\s*min/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /60\s*min/i })).toBeVisible()

      cleanup()
    })

    it.skip('allows selecting past date from calendar', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // Select a past date (yesterday)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      await logPastWorkout.setDate(yesterday)

      // Verify the date is updated in UI
      const formattedYesterday = yesterday.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      await expect.element(page.getByText(new RegExp(formattedYesterday, 'i'))).toBeVisible()

      cleanup()
    })

    it('allows custom duration entry', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // Select 90 minutes duration
      await logPastWorkout.setDuration(90)

      // Verify the duration is selected (button should be highlighted/selected)
      const durationButton = page.getByRole('button', { name: /90\s*min/i })
      await expect.element(durationButton).toHaveAttribute('aria-pressed', 'true')

      cleanup()
    })

    it('clicking already-selected duration keeps it selected (prevents NaN)', async () => {
      const { logPastWorkout, navigateTo, common, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // Default duration is 45 min - click it again (this could deselect in buggy implementations)
      const durationButton = page.getByRole('button', { name: /45\s*min/i })
      await expect.element(durationButton).toHaveAttribute('aria-pressed', 'true')

      // Click the already-selected button
      await durationButton.click()

      // Should still be selected (not deselected)
      await expect.element(durationButton).toHaveAttribute('aria-pressed', 'true')

      // Add a block and save to verify duration is valid
      await logPastWorkout.proceedToNextStep()
      await logPastWorkout.addExerciseBlock('Barbell Row')
      await logPastWorkout.setWorkoutName('Duration Test')
      await logPastWorkout.saveWorkout()

      // Verify navigation to history (save succeeded)
      await common.waitForRoute(/^\/history/)

      // Verify duration is valid (not NaN)
      const workouts = await db.workouts.toArray()
      expect(workouts.length).toBe(1)
      expect(workouts[0]?.durationSeconds).toBe(45 * 60)
      expect(Number.isNaN(workouts[0]?.durationSeconds)).toBe(false)

      cleanup()
    })
  })

  describe.skip('Strength Block Grid Entry', () => {
    // These tests require inline set editing which is not available in the new playlist UI
    // TODO: Re-enable when inline set editing is implemented
    it('displays all sets in grid view', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      // Seed template with 4 sets
      const template = createDatabaseTemplate({
        id: 'tpl-grid-test',
        name: 'Strength Test',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Squat', defaultSetCount: 4 })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Strength Test')
      await logPastWorkout.proceedToNextStep()

      // Verify all 4 sets are visible in grid
      const setCount = await logPastWorkout.getSetCount(0)
      expect(setCount).toBe(4)

      cleanup()
    })

    it('pre-fills values from template', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      // Template with target values
      const template = createDatabaseTemplate({
        id: 'tpl-prefill-test',
        name: 'Prefill Test',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Bench Press', targetReps: 8 })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Prefill Test')
      await logPastWorkout.proceedToNextStep()

      // Verify target reps are pre-filled (or shown as placeholder)
      const block = page.getByTestId('strength-block-0')
      const repsInput = block.getByRole('spinbutton', { name: /reps/i }).first()
      await expect.element(repsInput).toHaveValue(8)

      cleanup()
    })

    it('allows editing weight/reps/rir for each set', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      const template = createDatabaseTemplate({
        id: 'tpl-edit-test',
        name: 'Edit Test',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Deadlift' })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Edit Test')
      await logPastWorkout.proceedToNextStep()

      // Fill in the first set
      await logPastWorkout.fillStrengthSet(0, 0, { kg: 140, reps: 5, rir: 2 })

      // Fill in the second set with different values
      await logPastWorkout.fillStrengthSet(0, 1, { kg: 150, reps: 3, rir: 3 })

      // Verify values are set correctly
      const block = page.getByTestId('strength-block-0')
      const firstRow = block.getByTestId('set-row-0')
      const secondRow = block.getByTestId('set-row-1')

      await expect.element(firstRow.getByRole('spinbutton', { name: /weight|kg/i })).toHaveValue(140)
      await expect.element(secondRow.getByRole('spinbutton', { name: /weight|kg/i })).toHaveValue(150)

      cleanup()
    })

    it('allows adding new sets', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      const template = createDatabaseTemplate({
        id: 'tpl-add-set-test',
        name: 'Add Set Test',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Rows', defaultSetCount: 2 })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Add Set Test')
      await logPastWorkout.proceedToNextStep()

      // Initial set count
      const initialSetCount = await logPastWorkout.getSetCount(0)
      expect(initialSetCount).toBe(2)

      // Add a new set
      await logPastWorkout.addSet(0)

      // Verify set count increased
      const updatedSetCount = await logPastWorkout.getSetCount(0)
      expect(updatedSetCount).toBe(3)

      cleanup()
    })

    it('allows removing sets', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      const template = createDatabaseTemplate({
        id: 'tpl-remove-set-test',
        name: 'Remove Set Test',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Curls', defaultSetCount: 4 })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Remove Set Test')
      await logPastWorkout.proceedToNextStep()

      // Initial set count
      const initialSetCount = await logPastWorkout.getSetCount(0)
      expect(initialSetCount).toBe(4)

      // Remove the last set
      await logPastWorkout.removeSet(0, 3)

      // Verify set count decreased
      const updatedSetCount = await logPastWorkout.getSetCount(0)
      expect(updatedSetCount).toBe(3)

      cleanup()
    })
  })

  describe.skip('Timed Block Results Entry', () => {
    it('shows AMRAP result input (rounds + reps)', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // Add an AMRAP block (would need UI to support this)
      // For now, verify the result inputs exist when AMRAP block is present
      // This test will be more specific once we implement the feature

      await expect.element(page.getByRole('spinbutton', { name: /rounds/i })).toBeVisible()
      await expect.element(page.getByRole('spinbutton', { name: /extra reps|additional reps/i })).toBeVisible()

      // Fill in AMRAP result
      await logPastWorkout.fillAmrapResult(5, 7)

      // Verify values
      await expect.element(page.getByRole('spinbutton', { name: /rounds/i })).toHaveValue('5')

      cleanup()
    })

    it('shows ForTime result input (mm:ss)', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // Verify ForTime result inputs exist
      await expect.element(page.getByRole('spinbutton', { name: /minutes/i })).toBeVisible()
      await expect.element(page.getByRole('spinbutton', { name: /seconds/i })).toBeVisible()

      // Fill in ForTime result
      await logPastWorkout.fillForTimeResult(12, 34)

      // Verify values
      await expect.element(page.getByRole('spinbutton', { name: /minutes/i })).toHaveValue('12')
      await expect.element(page.getByRole('spinbutton', { name: /seconds/i })).toHaveValue('34')

      cleanup()
    })

    it('allows marking as DNF', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // Verify DNF checkbox exists
      const dnfCheckbox = page.getByRole('checkbox', { name: /did not finish|dnf/i })
      await expect.element(dnfCheckbox).toBeVisible()

      // Mark as DNF
      await logPastWorkout.markAsDnf()

      // Verify checkbox is checked
      await expect.element(dnfCheckbox).toBeChecked()

      cleanup()
    })
  })

  describe.skip('Cardio Block Entry', () => {
    it('shows duration, distance, calories inputs', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // Verify cardio result inputs exist
      await expect.element(page.getByRole('spinbutton', { name: /duration/i })).toBeVisible()
      await expect.element(page.getByRole('spinbutton', { name: /distance/i })).toBeVisible()
      await expect.element(page.getByRole('spinbutton', { name: /calories/i })).toBeVisible()

      // Fill in cardio result
      await logPastWorkout.fillCardioResult({
        durationMinutes: 30,
        distanceKm: 5.5,
        calories: 350,
      })

      // Verify values
      await expect.element(page.getByRole('spinbutton', { name: /duration/i })).toHaveValue('30')
      await expect.element(page.getByRole('spinbutton', { name: /distance/i })).toHaveValue('5.5')
      await expect.element(page.getByRole('spinbutton', { name: /calories/i })).toHaveValue('350')

      cleanup()
    })
  })

  describe.skip('Save & History', () => {
    it('saves workout with backdated timestamp', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      const template = createDatabaseTemplate({
        id: 'tpl-save-test',
        name: 'Save Test',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Press' })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Save Test')

      // Set date to 3 days ago
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      await logPastWorkout.setDate(threeDaysAgo)

      // Set duration
      await logPastWorkout.setDuration(45)

      // Fill in a set
      await logPastWorkout.fillStrengthSet(0, 0, { kg: 60, reps: 10, rir: 2 })

      // Set workout name
      await logPastWorkout.setWorkoutName('My Past Workout')

      // Save the workout
      await logPastWorkout.saveWorkout()

      // Verify workout saved to DB with backdated timestamp
      await expect.poll(async () => {
        const workouts = await db.workouts.toArray()
        return workouts.length
      }).toBe(1)

      const [savedWorkout] = await db.workouts.toArray()
      expect(savedWorkout?.name).toBe('My Past Workout')

      // Verify the startedAt is backdated (within 24 hours of 3 days ago)
      const startDate = new Date(savedWorkout!.startedAt)
      const expectedDate = threeDaysAgo
      expect(startDate.toDateString()).toBe(expectedDate.toDateString())

      cleanup()
    })

    it('appears in history sorted by workout date', async () => {
      const { logPastWorkout, navigateTo, common, cleanup } = await createTestApp()

      // Seed an existing workout from today
      const todayWorkout = databaseWorkoutBuilder()
        .withName('Today Workout')
        .withExerciseAndSets([{ kg: '100', reps: '5', status: 'completed' }], { name: 'Squat' })
        .build()
      await db.workouts.add(todayWorkout)

      // Create a template for the past workout
      const template = createDatabaseTemplate({
        id: 'tpl-history-test',
        name: 'History Test',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Bench Press' })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('History Test')

      // Set date to yesterday
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      await logPastWorkout.setDate(yesterday)
      await logPastWorkout.setDuration(30)
      await logPastWorkout.fillStrengthSet(0, 0, { kg: 80, reps: 8, rir: 2 })
      await logPastWorkout.setWorkoutName('Yesterday Workout')
      await logPastWorkout.saveWorkout()

      // Navigate to history
      await common.waitForRoute(/^\/history/)

      // Verify both workouts appear
      await expect.element(page.getByText('Today Workout')).toBeVisible()
      await expect.element(page.getByText('Yesterday Workout')).toBeVisible()

      // Verify order: Today should appear before Yesterday
      const todayElement = await page.getByText('Today Workout').element()
      const yesterdayElement = await page.getByText('Yesterday Workout').element()

      expect(
        todayElement.compareDocumentPosition(yesterdayElement) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()

      cleanup()
    })
  })

  describe('Validation', () => {
    it('disables save button when workout name is empty', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      // Seed a template to get a block
      const template = createDatabaseTemplate({
        id: 'tpl-validation-name',
        name: 'Validation Name Test',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Squat', equipment: 'barbell' })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Validation Name Test')
      await logPastWorkout.proceedToNextStep()

      // Verify we have a block
      const blockCount = await logPastWorkout.getBlockCount()
      expect(blockCount).toBe(1)

      // Clear the workout name (template sets a default name)
      await logPastWorkout.setWorkoutName('')

      // Save button should be disabled
      const isDisabled = await logPastWorkout.isSaveButtonDisabled()
      expect(isDisabled).toBe(true)

      cleanup()
    })

    it('disables save button when no blocks exist', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')
      await logPastWorkout.proceedToNextStep()

      // Set a workout name
      await logPastWorkout.setWorkoutName('Empty Workout')

      // No blocks exist
      const blockCount = await logPastWorkout.getBlockCount()
      expect(blockCount).toBe(0)

      // Save button should be disabled
      const isDisabled = await logPastWorkout.isSaveButtonDisabled()
      expect(isDisabled).toBe(true)

      cleanup()
    })

    it('enables save button when name and blocks are provided', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      // Seed a template
      const template = createDatabaseTemplate({
        id: 'tpl-validation-enabled',
        name: 'Validation Enabled Test',
        blocks: [createDatabaseTemplateStrengthBlock({ name: 'Deadlift', equipment: 'barbell' })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Validation Enabled Test')
      await logPastWorkout.proceedToNextStep()

      // Template provides both name and blocks
      const blockCount = await logPastWorkout.getBlockCount()
      expect(blockCount).toBe(1)

      // Save button should be enabled
      const isDisabled = await logPastWorkout.isSaveButtonDisabled()
      expect(isDisabled).toBe(false)

      cleanup()
    })
  })

  describe('Wizard Navigation', () => {
    it('navigates back from builder to date-duration step', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')
      await logPastWorkout.proceedToNextStep()

      // We're on the builder step
      await expect.element(page.getByRole('button', { name: /save workout/i })).toBeVisible()

      // Go back
      await logPastWorkout.goBack()

      // We should be on the date-duration step (duration buttons visible)
      await expect.element(page.getByRole('button', { name: /30\s*min/i })).toBeVisible()

      cleanup()
    })

    it('navigates back from date-duration to source selection step', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // We're on the date-duration step
      await expect.element(page.getByRole('button', { name: /30\s*min/i })).toBeVisible()

      // Go back
      await logPastWorkout.goBack()

      // We should be back on source selection
      await logPastWorkout.assertSourceSelectionVisible()

      cleanup()
    })

    it('persists duration selection when navigating back and forth', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')

      // Select 90 minutes
      await logPastWorkout.setDuration(90)
      const durationButton = page.getByRole('button', { name: /90\s*min/i })
      await expect.element(durationButton).toHaveAttribute('aria-pressed', 'true')

      // Go to builder
      await logPastWorkout.proceedToNextStep()

      // Go back to date-duration
      await logPastWorkout.goBack()

      // 90 min should still be selected
      await expect.element(durationButton).toHaveAttribute('aria-pressed', 'true')

      cleanup()
    })
  })

  describe('Block Management', () => {
    it('adds exercise block to blank workout', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')
      await logPastWorkout.proceedToNextStep()

      // Initially no blocks
      const initialBlockCount = await logPastWorkout.getBlockCount()
      expect(initialBlockCount).toBe(0)

      // Add a block using search (exercise names starting with A-B are visible without scrolling)
      await logPastWorkout.addExerciseBlock('Barbell Row')

      // Now we have 1 block
      const updatedBlockCount = await logPastWorkout.getBlockCount()
      expect(updatedBlockCount).toBe(1)

      // Verify exercise name is shown
      await expect.element(page.getByText('Barbell Row')).toBeVisible()

      cleanup()
    })

    it('removes block from workout', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      // Seed a template with 2 blocks
      const template = createDatabaseTemplate({
        id: 'tpl-remove-block',
        name: 'Remove Block Test',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Bench Press', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Dumbbell Fly', equipment: 'dumbbell' }),
        ],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Remove Block Test')
      await logPastWorkout.proceedToNextStep()

      // Initially 2 blocks
      const initialBlockCount = await logPastWorkout.getBlockCount()
      expect(initialBlockCount).toBe(2)

      // Remove the first block
      await logPastWorkout.removeBlock(0)

      // Now we have 1 block
      const updatedBlockCount = await logPastWorkout.getBlockCount()
      expect(updatedBlockCount).toBe(1)

      // Only Dumbbell Fly should remain
      await expect.element(page.getByText('Dumbbell Fly')).toBeVisible()
      await expect.element(page.getByText('Bench Press')).not.toBeInTheDocument()

      cleanup()
    })

    it('adds multiple blocks to blank workout', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('blank')
      await logPastWorkout.proceedToNextStep()

      // Add first block - Back exercise
      await logPastWorkout.addExerciseBlock('Barbell Row')
      const firstBlockCount = await logPastWorkout.getBlockCount()
      expect(firstBlockCount).toBe(1)

      // Add second block - Chest exercise (different muscle group)
      await logPastWorkout.addExerciseBlock('Bench Press')
      const secondBlockCount = await logPastWorkout.getBlockCount()
      expect(secondBlockCount).toBe(2)

      // Verify both exercises are shown
      await expect.element(page.getByText('Barbell Row')).toBeVisible()
      await expect.element(page.getByText('Bench Press')).toBeVisible()

      cleanup()
    })
  })

  describe('Complete Workflow', () => {
    it('completes full blank workout flow: add blocks, name, and save', async () => {
      const { logPastWorkout, navigateTo, common, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.LogPastWorkout })

      // Step 1: Select blank source
      await logPastWorkout.selectSource('blank')

      // Step 2: Set duration to 30 min (not the default 45, to avoid toggle deselect behavior)
      await logPastWorkout.setDuration(30)
      await logPastWorkout.proceedToNextStep()

      // Step 3: Add exercise block
      await logPastWorkout.addExerciseBlock('Barbell Row')

      // Set workout name
      await logPastWorkout.setWorkoutName('My Test Workout')

      // Verify save button is enabled
      const isDisabled = await logPastWorkout.isSaveButtonDisabled()
      expect(isDisabled).toBe(false)

      // Save the workout
      await logPastWorkout.saveWorkout()

      // Verify navigation to history
      await common.waitForRoute(/^\/history/)

      // Verify workout was saved to DB
      const workouts = await db.workouts.toArray()
      expect(workouts.length).toBe(1)
      expect(workouts[0]?.name).toBe('My Test Workout')
      expect(workouts[0]?.durationSeconds).toBe(30 * 60)

      cleanup()
    })

    it('completes template-based workflow with save', async () => {
      const { logPastWorkout, navigateTo, common, cleanup } = await createTestApp()

      // Seed a template
      const template = createDatabaseTemplate({
        id: 'tpl-complete-workflow',
        name: 'Complete Workflow Template',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Squat', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Leg Press', equipment: 'machine' }),
        ],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })

      // Step 1: Select template source
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Complete Workflow Template')

      // Step 2: Set duration
      await logPastWorkout.setDuration(60)
      await logPastWorkout.proceedToNextStep()

      // Verify blocks loaded
      const blockCount = await logPastWorkout.getBlockCount()
      expect(blockCount).toBe(2)

      // Save the workout (template provides name)
      await logPastWorkout.saveWorkout()

      // Verify navigation to history
      await common.waitForRoute(/^\/history/)

      // Verify workout was saved with template name
      const workouts = await db.workouts.toArray()
      expect(workouts.length).toBe(1)
      expect(workouts[0]?.name).toBe('Complete Workflow Template')
      expect(workouts[0]?.blocks.length).toBe(2)

      cleanup()
    })
  })
})
