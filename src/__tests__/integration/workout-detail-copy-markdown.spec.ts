import { page, userEvent } from 'vitest/browser'
import { describe, expect, vi } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { seedCompletedWorkout } from '../helpers/dbAssertions'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'
import { createDbAmrapBlock as createDatabaseAmrapBlock } from '../factories/timedBlock.factory'
import { createDbSet as createDatabaseSet } from '../factories/dbSet.factory'

/**
 * Integration tests for copying workout as markdown from detail view.
 * Tests the copy-to-clipboard export functionality.
 */
describe('Workout Detail Copy Markdown', () => {
  it('shows copy button in workout detail header', async ({ createTestApp }) => {
    const { navigateTo } = await createTestApp()

    // Seed a completed workout
    const workout = databaseWorkoutBuilder()
      .withName('Test Workout')
      .withStrengthBlock({ name: 'Squats' })
      .build()
    await seedCompletedWorkout(workout)

    // Navigate to workout detail
    await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })

    // Wait for workout to load
    await expect.element(page.getByText('Test Workout')).toBeVisible()

    // Copy button should be visible in header
    await expect.element(page.getByRole('button', { name: /copy|share|export/i })).toBeVisible()
  })

  it('copies markdown to clipboard when copy button is clicked', async ({ createTestApp }) => {
    const { navigateTo } = await createTestApp()

    // Spy on clipboard API
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()

    // Seed a completed workout with specific data
    const workout = databaseWorkoutBuilder()
      .withName('Morning Strength')
      .withStrengthBlock({
        name: 'Bench Press',
        equipment: 'barbell',
        sets: [
          createDatabaseSet({ kg: '80', reps: '5', rir: '2' }),
          createDatabaseSet({ kg: '85', reps: '5', rir: '1' }),
        ],
      })
      .build()
    await seedCompletedWorkout(workout)

    // Navigate to workout detail
    await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })
    await expect.element(page.getByText('Morning Strength')).toBeVisible()

    // Click copy button
    await userEvent.click(page.getByRole('button', { name: /copy|share|export/i }))

    // Verify clipboard was called with markdown content
    await expect.poll(() => writeTextSpy.mock.calls.length).toBe(1)

    // Check markdown contains expected content
    const copiedText = writeTextSpy.mock.calls[0]?.[0] ?? ''
    expect(copiedText).toContain('# Morning Strength')
    expect(copiedText).toContain('## Bench Press (Strength)')
    expect(copiedText).toContain('Equipment: barbell')
    expect(copiedText).toContain('80kg')
    expect(copiedText).toContain('85kg')

    writeTextSpy.mockRestore()
  })

  it('shows success feedback after copying', async ({ createTestApp }) => {
    const { navigateTo } = await createTestApp()

    // Spy on clipboard API
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()

    // Seed workout
    const workout = databaseWorkoutBuilder().withName('Leg Day').withStrengthBlock().build()
    await seedCompletedWorkout(workout)

    // Navigate to detail
    await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })
    await expect.element(page.getByText('Leg Day')).toBeVisible()

    // Click copy button
    await userEvent.click(page.getByRole('button', { name: /copy|share|export/i }))

    // Should show success feedback (check icon or "Copied" text)
    await expect.element(page.getByText(/copied/i)).toBeVisible()

    writeTextSpy.mockRestore()
  })

  it('exports all block types correctly', async ({ createTestApp }) => {
    const { navigateTo } = await createTestApp()

    // Spy on clipboard API
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()

    // Seed workout with multiple block types
    const amrapBlock = createDatabaseAmrapBlock({
      exercises: [{ id: 'ex1', name: 'Burpees', prescribedReps: 10, load: null, image: null }],
    })
    const workout = databaseWorkoutBuilder()
      .withName('Full Workout')
      .withStrengthBlock({ name: 'Deadlift' })
      .withBlock(amrapBlock)
      .build()
    await seedCompletedWorkout(workout)

    // Navigate and copy
    await navigateTo({ name: RouteNames.WorkoutDetail, params: { id: workout.id } })
    await expect.element(page.getByText('Full Workout')).toBeVisible()
    await userEvent.click(page.getByRole('button', { name: /copy|share|export/i }))

    // Verify markdown contains both block types
    await expect.poll(() => writeTextSpy.mock.calls.length).toBe(1)
    const copiedText = writeTextSpy.mock.calls[0]?.[0] ?? ''
    expect(copiedText).toContain('## Deadlift (Strength)')
    expect(copiedText).toContain('(AMRAP)')

    writeTextSpy.mockRestore()
  })
})
