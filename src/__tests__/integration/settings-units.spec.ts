import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'
import { db, generateId } from '@/db'
import type { DbCompletedWorkout, DbStrengthBlock, DbSet } from '@/db/schema'
import { kgToLbs } from '@/lib/unitConversion'

describe('Settings Units Integration', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  it('displays unit toggles on settings page', async () => {
    const app = await createTestApp()

    // Navigate to Settings
    await app.navigateTo('/settings')

    // Verify Units section exists
    expect(app.getByText('Units')).toBeDefined()
    expect(app.getByText('Choose your preferred measurement units')).toBeDefined()

    // Verify weight unit toggle exists with kg selected by default
    const weightToggle = app.getByTestId('weight-unit-toggle')
    expect(weightToggle).toBeDefined()

    // Verify height unit toggle exists with cm selected by default
    const heightToggle = app.getByTestId('height-unit-toggle')
    expect(heightToggle).toBeDefined()

    app.cleanup()
  })

  it('toggles weight unit from kg to lbs and persists', async () => {
    const app = await createTestApp()

    // Navigate to Settings
    await app.navigateTo('/settings')

    // Click lbs button (ToggleGroupItem renders as button with aria-pressed)
    await app.user.click(app.getByRole('button', { name: /pounds/i }))

    // Navigate away and back to verify persistence
    await app.navigateTo('/')
    await app.navigateTo('/settings')

    // Verify lbs is still selected (the button should be pressed)
    const lbsButton = app.getByRole('button', { name: /pounds/i })
    expect(lbsButton.getAttribute('data-state')).toBe('on')

    app.cleanup()
  })

  it('shows weight column header based on selected unit', async () => {
    const app = await createTestApp()

    // Start a workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    await app.user.click(app.getByRole('button', { name: /add first block/i }))
    await app.waitForDialog()
    // The dialog opens with Exercises tab active by default
    await app.user.click(app.getDialogButton('Bench Press'))

    // Verify default column header shows KG
    expect(app.getByText('KG')).toBeDefined()

    // Navigate to settings and change to lbs
    await app.navigateTo('/settings')
    await app.user.click(app.getByRole('button', { name: /pounds/i }))

    // Go back to workout
    await app.navigateTo('/workout/active')

    // Verify column header now shows LBS
    expect(app.getByText('LBS')).toBeDefined()

    app.cleanup()
  })

  it('displays weight values in lbs when lbs unit is selected in workout detail view', async () => {
    const app = await createTestApp()

    // Arrange: Change weight unit to lbs
    await app.navigateTo('/settings')
    await app.user.click(app.getByRole('button', { name: /pounds/i }))

    // Arrange: Create a completed workout with a known weight in kg
    const weightInKg = 100
    const completedSet: DbSet = {
      id: generateId(),
      kg: String(weightInKg),
      reps: '10',
      rir: '2',
      status: 'completed',
      completedAt: Date.now(),
    }

    const benchPressBlock: DbStrengthBlock = {
      kind: 'strength',
      id: generateId(),
      exerciseDefinitionId: null,
      name: 'Bench Press',
      equipment: 'Barbell',
      targetReps: 8,
      thumbnail: '🏋️',
      sets: [completedSet],
      orderIndex: 0,
    }

    const completedWorkout: DbCompletedWorkout = {
      id: generateId(),
      name: 'Push Day',
      blocks: [benchPressBlock],
      startedAt: Date.now() - 3600000,
      completedAt: Date.now(),
      durationSeconds: 3600,
      notes: '',
    }

    await db.workouts.add(completedWorkout)

    // Act: Navigate to workout detail view
    await app.navigateTo('/workouts')
    const workoutCard = await app.findByText('Push Day')
    await app.user.click(workoutCard)

    // Expand the exercise card to see set details
    const exerciseCard = app.getByText('Bench Press')
    await app.user.click(exerciseCard)

    // Assert: Verify weight is displayed in lbs, not kg
    const expectedLbs = kgToLbs(weightInKg).toFixed(1)
    expect(app.getByText(`${expectedLbs}lbs`)).toBeDefined()

    app.cleanup()
  })

  it('displays total weight lifted in lbs with correct label in workout detail stats row', async () => {
    const app = await createTestApp()

    // Arrange: Change weight unit to lbs
    await app.navigateTo('/settings')
    await app.user.click(app.getByRole('button', { name: /pounds/i }))

    // Arrange: Create a completed workout with known weights
    // Total volume = (10kg × 10 reps) + (5kg × 10 reps) = 150kg
    const set1: DbSet = {
      id: generateId(),
      kg: '10',
      reps: '10',
      rir: '2',
      status: 'completed',
      completedAt: Date.now(),
    }

    const set2: DbSet = {
      id: generateId(),
      kg: '5',
      reps: '10',
      rir: '1',
      status: 'completed',
      completedAt: Date.now() + 1000,
    }

    const benchPressBlock: DbStrengthBlock = {
      kind: 'strength',
      id: generateId(),
      exerciseDefinitionId: null,
      name: 'Bench Press',
      equipment: 'Barbell',
      targetReps: 8,
      thumbnail: '🏋️',
      sets: [set1, set2],
      orderIndex: 0,
    }

    const completedWorkout: DbCompletedWorkout = {
      id: generateId(),
      name: 'Strength Session',
      blocks: [benchPressBlock],
      startedAt: Date.now() - 3600000,
      completedAt: Date.now(),
      durationSeconds: 3600,
      notes: '',
    }

    await db.workouts.add(completedWorkout)

    // Act: Navigate to workout detail view
    await app.navigateTo('/workouts')
    const workoutCard = await app.findByText('Strength Session')
    await app.user.click(workoutCard)

    // Assert: Verify total weight is displayed in lbs with correct label
    const totalKg = 150
    const expectedLbs = kgToLbs(totalKg).toFixed(1)

    // Check that the weight value is displayed
    expect(app.getByText(expectedLbs)).toBeDefined()

    // Check that the label shows "lbs lifted" not "kg lifted"
    expect(app.getByText('lbs lifted')).toBeDefined()

    app.cleanup()
  })

  // Note: WorkoutPreviousHistory component test skipped because the feature
  // to load previous workout data is not yet wired up (ActiveWorkout passes empty array).
  // The component template has been updated to use unit conversion - will be tested
  // when the previous workout loading feature is implemented.

  it('displays total weight lifted in lbs with correct label in workout summary view', async () => {
    const app = await createTestApp()

    // Arrange: Change weight unit to lbs
    await app.navigateTo('/settings')
    await app.user.click(app.getByRole('button', { name: /pounds/i }))

    // Arrange: Start workout and complete sets with known weights
    await app.navigateTo('/')
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    await app.user.click(app.getByRole('button', { name: /add first block/i }))
    await app.waitForDialog()
    // The dialog opens with Exercises tab active by default
    await app.user.click(app.getDialogButton('Bench Press'))

    // Complete two sets: 10kg x 10 reps + 5kg x 10 reps = 150kg total
    await app.fillSet(0, { kg: 10, reps: 10, rir: 2 })
    const set1 = app.getSetRow(0)
    await app.user.click(set1.complete)

    await app.fillSet(1, { kg: 5, reps: 10, rir: 1 })
    const set2 = app.getSetRow(1)
    await app.user.click(set2.complete)

    // Act: Finish the workout
    await app.user.click(app.getByRole('button', { name: /finish/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Finish Workout'))

    // Wait for navigation to summary view
    await app.waitForRoute(/^\/workout\/summary\//)

    // Wait for the content to load (not showing "Loading...")
    await app.findByText('Workout Complete!')

    // Assert: Verify the label shows "lbs lifted" not "kg lifted"
    // This test will fail because the view currently hardcodes "kg lifted"
    expect(app.getByText('lbs lifted')).toBeDefined()

    app.cleanup()
  })
})
