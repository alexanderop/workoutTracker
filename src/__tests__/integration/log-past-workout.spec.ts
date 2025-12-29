import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbTemplate, createDbTemplateStrengthBlock } from '../factories'
import { dbWorkoutBuilder } from '../factories/dbWorkout.factory'

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
      const template = createDbTemplate({
        id: 'tpl-past-workout',
        name: 'Push Day',
        blocks: [
          createDbTemplateStrengthBlock({ name: 'Bench Press', equipment: 'Barbell' }),
          createDbTemplateStrengthBlock({ name: 'Overhead Press', equipment: 'Barbell' }),
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
      const blockCount = await logPastWorkout.getStrengthBlockCount()
      expect(blockCount).toBe(2)

      cleanup()
    })

    it('loads previous workout data when starting from history', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      // Seed a completed workout
      const workout = dbWorkoutBuilder()
        .withName('Previous Leg Day')
        .withExerciseAndSets(
          [
            { kg: '100', reps: '5', rir: '2', status: 'completed' },
            { kg: '100', reps: '5', rir: '2', status: 'completed' },
          ],
          { name: 'Squat', equipment: 'Barbell' },
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
      const blockCount = await logPastWorkout.getStrengthBlockCount()
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
  })

  describe.skip('Strength Block Grid Entry', () => {
    // These tests require inline set editing which is not available in the new playlist UI
    // TODO: Re-enable when inline set editing is implemented
    it('displays all sets in grid view', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      // Seed template with 4 sets
      const template = createDbTemplate({
        id: 'tpl-grid-test',
        name: 'Strength Test',
        blocks: [createDbTemplateStrengthBlock({ name: 'Squat', defaultSetCount: 4 })],
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
      const template = createDbTemplate({
        id: 'tpl-prefill-test',
        name: 'Prefill Test',
        blocks: [createDbTemplateStrengthBlock({ name: 'Bench Press', targetReps: 8 })],
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

      const template = createDbTemplate({
        id: 'tpl-edit-test',
        name: 'Edit Test',
        blocks: [createDbTemplateStrengthBlock({ name: 'Deadlift' })],
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

      const template = createDbTemplate({
        id: 'tpl-add-set-test',
        name: 'Add Set Test',
        blocks: [createDbTemplateStrengthBlock({ name: 'Rows', defaultSetCount: 2 })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Add Set Test')
      await logPastWorkout.proceedToNextStep()

      // Initial set count
      let setCount = await logPastWorkout.getSetCount(0)
      expect(setCount).toBe(2)

      // Add a new set
      await logPastWorkout.addSet(0)

      // Verify set count increased
      setCount = await logPastWorkout.getSetCount(0)
      expect(setCount).toBe(3)

      cleanup()
    })

    it('allows removing sets', async () => {
      const { logPastWorkout, navigateTo, cleanup } = await createTestApp()

      const template = createDbTemplate({
        id: 'tpl-remove-set-test',
        name: 'Remove Set Test',
        blocks: [createDbTemplateStrengthBlock({ name: 'Curls', defaultSetCount: 4 })],
      })
      await db.templates.add(template)

      await navigateTo({ name: RouteNames.LogPastWorkout })
      await logPastWorkout.selectSource('template')
      await logPastWorkout.selectTemplate('Remove Set Test')
      await logPastWorkout.proceedToNextStep()

      // Initial set count
      let setCount = await logPastWorkout.getSetCount(0)
      expect(setCount).toBe(4)

      // Remove the last set
      await logPastWorkout.removeSet(0, 3)

      // Verify set count decreased
      setCount = await logPastWorkout.getSetCount(0)
      expect(setCount).toBe(3)

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

      const template = createDbTemplate({
        id: 'tpl-save-test',
        name: 'Save Test',
        blocks: [createDbTemplateStrengthBlock({ name: 'Press' })],
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

      const savedWorkout = (await db.workouts.toArray())[0]
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
      const todayWorkout = dbWorkoutBuilder()
        .withName('Today Workout')
        .withExerciseAndSets([{ kg: '100', reps: '5', status: 'completed' }], { name: 'Squat' })
        .build()
      await db.workouts.add(todayWorkout)

      // Create a template for the past workout
      const template = createDbTemplate({
        id: 'tpl-history-test',
        name: 'History Test',
        blocks: [createDbTemplateStrengthBlock({ name: 'Bench Press' })],
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
      const todayEl = await page.getByText('Today Workout').element()
      const yesterdayEl = await page.getByText('Yesterday Workout').element()

      expect(
        todayEl.compareDocumentPosition(yesterdayEl) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()

      cleanup()
    })
  })
})
