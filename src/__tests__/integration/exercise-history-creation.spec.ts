/**
 * Integration tests for Exercise History Creation
 *
 * Tests verify that completing a workout creates exercise history.
 */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import {
  getWorkoutsRepository,
  getCustomExercisesRepository,
  getExerciseProgressRepository,
} from '@/db'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Exercise History Creation', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('creates exercise history when finishing workout early (sets not manually completed)', async () => {
    // This test verifies the REAL user scenario: finishing a workout before completing all sets
    // The bug: when user finishes early, sets with entered data aren't being auto-completed
    const { builder, workout, common, navigateTo, cleanup } = await createTestApp()

    // Step 1: Navigate to exercises and verify no history for Bench Press
    await navigateTo({ name: RouteNames.Exercises })
    await userEvent.click(page.getByText('Bench Press', { exact: true }))

    // Verify empty state (no history)
    await expect.element(page.getByText(/no history yet/i)).toBeVisible()

    // Step 2: Navigate to home and start a workout with Bench Press
    await navigateTo({ name: RouteNames.Home })
    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    // Fill in ONLY the first set's data BUT DON'T click complete
    // This simulates the real user scenario where they enter data but finish early
    const setRow = workout.getSet(0)
    await setRow.fill({ kg: 80, reps: 10, rir: 2 })

    // Step 3: Finish workout early via menu (without completing any sets)
    await workout.openMenu()
    await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
    await page.getByRole('menuitem', { name: /end workout/i }).click()

    // Handle finish dialog
    await common.waitForDialog()
    await userEvent.click(await common.getDialogButton('Finish Workout'))

    // Wait for completion screen and click View Details
    await expect.element(page.getByText(/workout complete/i)).toBeVisible()
    const viewDetailsButton = page.getByRole('button', { name: /view details/i })
    await expect.element(viewDetailsButton, { timeout: 2000 }).toBeVisible()
    await viewDetailsButton.click()

    // Wait for navigation to summary
    await common.waitForRoute(/^\/workout\/summary\//)

    // Step 4: Navigate back to exercises and verify history exists
    // THIS IS WHERE THE BUG MANIFESTS - sets weren't auto-completed so no history was saved
    await navigateTo({ name: RouteNames.Exercises })
    await userEvent.click(page.getByText('Bench Press', { exact: true }))

    // Verify history now exists - should show PR cards, NOT empty state
    await expect.element(page.getByText(/no history yet/i)).not.toBeInTheDocument()
    await expect.element(page.getByText('80 kg')).toBeVisible()

    cleanup()
  })

  it('saves workout with correct exerciseDefinitionId and history query matches', async () => {
    const { builder, workout, common, navigateTo, cleanup } = await createTestApp()

    // Get the actual Bench Press exercise ID from the database
    const exercises = await getCustomExercisesRepository().getAll()
    const benchPress = exercises.find((e) => e.name === 'Bench Press')
    expect(benchPress).toBeDefined()
    const benchPressId = benchPress!.id

    // Start workout with Bench Press
    await navigateTo({ name: RouteNames.Home })
    await builder.setupStrengthWorkoutAndStart(['Bench Press'])

    // Complete all 3 sets
    await workout.completeMultipleSets(3, { weight: '100', reps: '10', rir: '2' })

    // Handle the auto-opened finish dialog
    await common.waitForDialog()
    await userEvent.click(await common.getDialogButton('Finish Workout'))
    await expect.element(page.getByText(/workout complete/i)).toBeVisible()

    // Now verify the database state directly
    const savedWorkouts = await getWorkoutsRepository().getHistory()
    expect(savedWorkouts.length).toBe(1)

    const savedWorkout = savedWorkouts[0]!
    expect(savedWorkout.blocks.length).toBe(1)

    const savedBlock = savedWorkout.blocks[0]!
    expect(savedBlock.kind).toBe('strength')

    // This is the critical check - does the saved exerciseDefinitionId match?
    if (savedBlock.kind === 'strength') {
      expect(savedBlock.exerciseDefinitionId).toBe(benchPressId)

      // Also verify sets are marked as completed
      const completedSets = savedBlock.sets.filter((s) => s.status === 'completed')
      expect(completedSets.length).toBe(3)
    }

    // Now verify the history query works
    const history = await getExerciseProgressRepository().getExerciseHistory(benchPressId)
    expect(history.length).toBe(1)
    expect(history[0]!.maxWeight).toBe(100)

    cleanup()
  })
})
