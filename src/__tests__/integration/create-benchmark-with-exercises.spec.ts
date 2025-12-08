import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'
import { getRepositoryProvider } from '@/db/provider'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'

describe('Create Benchmark with Exercises', () => {
  afterEach(async () => {
    await resetDatabase()
    resetInitState()
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  beforeEach(async () => {
    await resetDatabase()
    // Seed exercises so the picker works
    const { seedPopularExercises } = await import('@/db/seedExercises')
    await seedPopularExercises()
  })

  it('creates benchmark with exercises and saves to database', async () => {
    const app = await createTestApp()

    // Navigate to benchmark creation
    await app.navigateTo('/benchmarks/create')

    // Wait for form to load
    await waitFor(() => {
      expect(app.queryByRole('textbox', { name: /workout name/i })).toBeTruthy()
    })

    // Fill benchmark name and add exercise
    await app.benchmarkForm.fillName('Fran')
    await app.benchmarkForm.selectType('fortime')
    await app.benchmarkForm.addExerciseWithReps('Thruster', 21)

    // Save benchmark (button should now be enabled after adding exercise)
    await waitFor(() => {
      app.benchmarkForm.assertSaveEnabled()
    })
    await app.benchmarkForm.clickSave()

    // Wait for save to complete
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verify benchmark saved to database
    const repo = getRepositoryProvider().benchmarks
    const benchmarks = await repo.getAll()

    expect(benchmarks).toHaveLength(1)
    const benchmark = benchmarks[0]
    if (!benchmark) throw new Error('Benchmark not found')
    expect(benchmark.name).toBe('Fran')
    expect(benchmark.type).toBe('fortime')
    expect(benchmark.exercises).toHaveLength(1)
    const exercise = benchmark.exercises[0]
    if (!exercise) throw new Error('Exercise not found')
    expect(exercise.name).toBe('Kettlebell Thruster')
    expect(exercise.prescribedReps).toBe(21)

    // Should navigate back to workouts view after save
    expect(app.router.currentRoute.value.path).toBe('/workouts')

    app.cleanup()
  })

  it('disables save button when no exercises added', async () => {
    const app = await createTestApp()
    await app.navigateTo('/benchmarks/create')

    await waitFor(() => {
      expect(app.queryByRole('textbox', { name: /workout name/i })).toBeTruthy()
    })

    // Fill name without exercises
    await app.benchmarkForm.fillName('Test Benchmark')

    // Save button should be disabled (no exercises)
    app.benchmarkForm.assertSaveDisabled()

    app.cleanup()
  })

  it('allows removing exercises from list', async () => {
    const app = await createTestApp()
    await app.navigateTo('/benchmarks/create')

    await waitFor(() => {
      expect(app.queryByRole('textbox', { name: /workout name/i })).toBeTruthy()
    })

    // Fill name and add exercise
    await app.benchmarkForm.fillName('Test')
    await app.benchmarkForm.addExerciseWithReps('Thruster', 21)

    // Verify exercise appears
    await waitFor(() => {
      expect(app.queryByText(/thruster/i)).toBeTruthy()
    })

    // Remove the exercise
    await app.benchmarkForm.removeExercise(0)

    // Exercise should be removed
    await waitFor(() => {
      expect(app.queryByText(/thruster/i)).toBeFalsy()
    })

    // Save button should be disabled again
    app.benchmarkForm.assertSaveDisabled()

    app.cleanup()
  })

  it('creates benchmark with multiple exercises', async () => {
    const app = await createTestApp()

    // Navigate to benchmark creation
    await app.navigateTo('/benchmarks/create')

    await waitFor(() => {
      expect(app.queryByRole('textbox', { name: /workout name/i })).toBeTruthy()
    })

    // Fill benchmark name and add multiple exercises
    await app.benchmarkForm.fillName('Fran')
    await app.benchmarkForm.addExerciseWithReps('Thruster', 21)
    await app.benchmarkForm.addExerciseWithReps('Pull-ups', 15)

    // Save benchmark
    app.benchmarkForm.assertSaveEnabled()
    await app.benchmarkForm.clickSave()

    // Wait for save to complete
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verify benchmark saved to database with both exercises
    const repo = getRepositoryProvider().benchmarks
    const benchmarks = await repo.getAll()

    expect(benchmarks).toHaveLength(1)
    const benchmark = benchmarks[0]
    if (!benchmark) throw new Error('Benchmark not found')
    expect(benchmark.name).toBe('Fran')
    expect(benchmark.exercises).toHaveLength(2)
    const exercise1 = benchmark.exercises[0]
    const exercise2 = benchmark.exercises[1]
    if (!exercise1) throw new Error('First exercise not found')
    if (!exercise2) throw new Error('Second exercise not found')
    expect(exercise1.name).toBe('Kettlebell Thruster')
    expect(exercise1.prescribedReps).toBe(21)
    expect(exercise2.name).toBe('Pull-ups')
    expect(exercise2.prescribedReps).toBe(15)

    // Should navigate back to workouts view
    expect(app.router.currentRoute.value.path).toBe('/workouts')

    app.cleanup()
  })
})
