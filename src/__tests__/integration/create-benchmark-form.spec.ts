import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Create Benchmark Form', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('displays form with name input, type selection, and buttons', async () => {
    const app = await createTestApp()

    // Navigate to benchmark create page
    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    expect(screen.getByLabelText(/workout name/i)).toBeTruthy()
    expect(screen.getAllByText(/for time/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/rounds/i).length).toBeGreaterThan(0)
    expect(app.benchmarkForm.getSaveButton()).toBeTruthy()

    app.cleanup()
  })

  it('disables save button when workout name is empty', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    app.benchmarkForm.assertSaveDisabled()

    app.cleanup()
  })

  it('keeps save button disabled when workout name is entered without exercises', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    await app.benchmarkForm.fillName('Murph')

    await waitFor(() => {
      app.benchmarkForm.assertSaveDisabled()
    })

    app.cleanup()
  })

  it('hides rounds input when "For Time" type is selected by default', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    expect(app.benchmarkForm.getRoundsInput()).toBeNull()

    app.cleanup()
  })

  it('shows rounds input when "Rounds" type is selected', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    await app.benchmarkForm.selectType('rounds')

    const roundsInput = await screen.findByLabelText(/number of rounds/i)
    expect(roundsInput).toBeTruthy()

    app.cleanup()
  })

  it('displays default rounds value of 5', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    await app.benchmarkForm.selectType('rounds')

    const roundsInput = await screen.findByLabelText(/number of rounds/i)
    expect(roundsInput).toHaveValue('5')

    app.cleanup()
  })

  it('toggles rounds input when switching between types', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    // Switch to Rounds
    await app.benchmarkForm.selectType('rounds')
    expect(await screen.findByLabelText(/number of rounds/i)).toBeTruthy()

    // Switch to For Time
    await app.benchmarkForm.selectType('fortime')
    await waitFor(() => {
      expect(app.benchmarkForm.getRoundsInput()).toBeNull()
    })

    app.cleanup()
  })

  it('navigates to /workouts when save button is clicked with name and exercise', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    await app.benchmarkForm.fillName('Fran')
    await app.benchmarkForm.addExerciseWithReps('Thruster', 21)

    await app.benchmarkForm.clickSave()

    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/workouts')
    })

    app.cleanup()
  })

  it('navigates back to /workouts when back button is clicked', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    await app.benchmarkForm.clickBack()

    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/workouts')
    })

    app.cleanup()
  })
})
