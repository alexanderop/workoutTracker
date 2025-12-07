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

    // Fill benchmark name
    const nameInput = app.getByRole('textbox', { name: /workout name/i })
    await app.user.type(nameInput, 'Fran')

    // Select "For Time" type (should be selected by default, but click to ensure)
    const forTimeButton = app.getByRole('button', { name: /for time/i })
    await app.user.click(forTimeButton)

    // Add first exercise
    await app.user.click(app.getByRole('button', { name: /add exercise/i }))

    // Wait for exercise picker dialog to open and select Thruster
    await waitFor(() => {
      expect(app.queryByText(/thruster/i)).toBeTruthy()
    })
    await app.user.click(app.getByText(/thruster/i))

    // Wait for reps dialog to open
    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /set prescribed reps/i })).toBeTruthy()
    })

    // Input reps (21) and confirm
    const repsInput = app.getByRole('spinbutton')
    await app.user.clear(repsInput)
    await app.user.type(repsInput, '21')

    await waitFor(() => {
      const addButton = app.queryByRole('button', { name: /^add$/i })
      expect(addButton).toBeTruthy()
    })
    await app.user.click(app.getByRole('button', { name: /^add$/i }))

    // Wait for dialog to close
    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /set prescribed reps/i })).toBeFalsy()
    })

    // Ensure body is clickable again (dialog cleanup)
    await waitFor(() => {
      const pointerEvents = window.getComputedStyle(document.body).pointerEvents
      expect(pointerEvents).not.toBe('none')
    })

    // Verify exercise appears in list
    await waitFor(() => {
      expect(app.queryByText(/thruster/i)).toBeTruthy()
      expect(app.queryByText(/21 reps/i)).toBeTruthy()
    })

    // Save benchmark
    const saveButton = app.getByRole('button', { name: /save/i })
    expect(saveButton).not.toBeDisabled()
    await app.user.click(saveButton)

    // Wait for save to complete
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verify benchmark saved to database
    const repo = getRepositoryProvider().benchmarks
    const benchmarks = await repo.getAll()

    expect(benchmarks).toHaveLength(1)
    expect(benchmarks[0].name).toBe('Fran')
    expect(benchmarks[0].type).toBe('fortime')
    expect(benchmarks[0].exercises).toHaveLength(1)
    expect(benchmarks[0].exercises[0].name).toBe('Kettlebell Thruster')
    expect(benchmarks[0].exercises[0].prescribedReps).toBe(21)

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

    // Fill name
    const nameInput = app.getByRole('textbox', { name: /workout name/i })
    await app.user.type(nameInput, 'Test Benchmark')

    // Save button should be disabled (no exercises)
    const saveButton = app.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()

    app.cleanup()
  })

  it('allows removing exercises from list', async () => {
    const app = await createTestApp()
    await app.navigateTo('/benchmarks/create')

    await waitFor(() => {
      expect(app.queryByRole('textbox', { name: /workout name/i })).toBeTruthy()
    })

    // Fill name
    await app.user.type(app.getByRole('textbox', { name: /workout name/i }), 'Test')

    // Add exercise
    await app.user.click(app.getByRole('button', { name: /add exercise/i }))

    await waitFor(() => {
      expect(app.queryByText(/thruster/i)).toBeTruthy()
    })
    await app.user.click(app.getByText(/thruster/i))

    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /set prescribed reps/i })).toBeTruthy()
    })
    await app.user.click(app.getByRole('button', { name: /^add$/i }))

    // Wait for dialog to close
    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /set prescribed reps/i })).toBeFalsy()
    })

    // Ensure body is clickable again (dialog cleanup)
    await waitFor(() => {
      const pointerEvents = window.getComputedStyle(document.body).pointerEvents
      expect(pointerEvents).not.toBe('none')
    })

    // Verify exercise appears
    await waitFor(() => {
      expect(app.queryByText(/thruster/i)).toBeTruthy()
    })

    // Click delete button (X icon)
    const deleteButtons = document.querySelectorAll('button svg.lucide-x')
    expect(deleteButtons.length).toBeGreaterThan(0)
    const deleteButton = deleteButtons[0].closest('button')
    if (!(deleteButton instanceof HTMLElement)) throw new Error('Delete button not found')
    await app.user.click(deleteButton)

    // Exercise should be removed
    await waitFor(() => {
      expect(app.queryByText(/thruster/i)).toBeFalsy()
    })

    // Save button should be disabled again
    const saveButton = app.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()

    app.cleanup()
  })

  it('creates benchmark with multiple exercises', async () => {
    const app = await createTestApp()

    // Navigate to benchmark creation
    await app.navigateTo('/benchmarks/create')

    await waitFor(() => {
      expect(app.queryByRole('textbox', { name: /workout name/i })).toBeTruthy()
    })

    // Fill benchmark name
    const nameInput = app.getByRole('textbox', { name: /workout name/i })
    await app.user.type(nameInput, 'Fran')

    // Add first exercise (Thruster - 21 reps)
    await app.user.click(app.getByRole('button', { name: /add exercise/i }))
    await waitFor(() => {
      expect(app.queryByText(/thruster/i)).toBeTruthy()
    })
    await app.user.click(app.getByText(/thruster/i))

    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /set prescribed reps/i })).toBeTruthy()
    })

    const repsInput1 = app.getByRole('spinbutton')
    await app.user.clear(repsInput1)
    await app.user.type(repsInput1, '21')
    await app.user.click(app.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /set prescribed reps/i })).toBeFalsy()
    })

    await waitFor(() => {
      const pointerEvents = window.getComputedStyle(document.body).pointerEvents
      expect(pointerEvents).not.toBe('none')
    })

    // Add second exercise (Pull-ups - 15 reps)
    await app.user.click(app.getByRole('button', { name: /add exercise/i }))
    await waitFor(() => {
      expect(app.queryByText(/pull-ups/i)).toBeTruthy()
    })
    await app.user.click(app.getByText(/pull-ups/i))

    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /set prescribed reps/i })).toBeTruthy()
    })

    const repsInput2 = app.getByRole('spinbutton')
    await app.user.clear(repsInput2)
    await app.user.type(repsInput2, '15')
    await app.user.click(app.getByRole('button', { name: /^add$/i }))

    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /set prescribed reps/i })).toBeFalsy()
    })

    await waitFor(() => {
      const pointerEvents = window.getComputedStyle(document.body).pointerEvents
      expect(pointerEvents).not.toBe('none')
    })

    // Save benchmark
    const saveButton = app.getByRole('button', { name: /save/i })
    expect(saveButton).not.toBeDisabled()
    await app.user.click(saveButton)

    // Wait for save to complete
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verify benchmark saved to database with both exercises
    const repo = getRepositoryProvider().benchmarks
    const benchmarks = await repo.getAll()

    expect(benchmarks).toHaveLength(1)
    expect(benchmarks[0].name).toBe('Fran')
    expect(benchmarks[0].exercises).toHaveLength(2)
    expect(benchmarks[0].exercises[0].name).toBe('Kettlebell Thruster')
    expect(benchmarks[0].exercises[0].prescribedReps).toBe(21)
    expect(benchmarks[0].exercises[1].name).toBe('Pull-ups')
    expect(benchmarks[0].exercises[1].prescribedReps).toBe(15)

    // Should navigate back to workouts view
    expect(app.router.currentRoute.value.path).toBe('/workouts')

    app.cleanup()
  })
})
