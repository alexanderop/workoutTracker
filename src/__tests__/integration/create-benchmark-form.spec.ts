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
    expect(app.getByRole('button', { name: /save/i })).toBeTruthy()

    app.cleanup()
  })

  it('disables save button when workout name is empty', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    const saveButton = app.getByRole('button', { name: /save/i })
    expect(saveButton).toHaveAttribute('disabled')

    app.cleanup()
  })

  it('keeps save button disabled when workout name is entered without exercises', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    const nameInput = screen.getByLabelText(/workout name/i)
    await app.user.type(nameInput, 'Murph')

    await waitFor(() => {
      const saveButton = app.getByRole('button', { name: /save/i })
      expect(saveButton).toHaveAttribute('disabled')
    })

    app.cleanup()
  })

  it('hides rounds input when "For Time" type is selected by default', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    expect(screen.queryByLabelText(/number of rounds/i)).toBeNull()

    app.cleanup()
  })

  it('shows rounds input when "Rounds" type is selected', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    const roundsElement = screen.getAllByText(/^rounds$/i)[0]
    if (!roundsElement) throw new Error('Rounds element not found')
    const roundsCard = roundsElement.closest('button')
    if (!roundsCard) throw new Error('Rounds card button not found')
    await app.user.click(roundsCard)

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

    const roundsElement = screen.getAllByText(/^rounds$/i)[0]
    if (!roundsElement) throw new Error('Rounds element not found')
    const roundsCard = roundsElement.closest('button')
    if (!roundsCard) throw new Error('Rounds card button not found')
    await app.user.click(roundsCard)

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

    const forTimeElement = screen.getAllByText(/^for time$/i)[0]
    if (!forTimeElement) throw new Error('For Time element not found')
    const forTimeCard = forTimeElement.closest('button')
    if (!forTimeCard) throw new Error('For Time card button not found')
    const roundsElement = screen.getAllByText(/^rounds$/i)[0]
    if (!roundsElement) throw new Error('Rounds element not found')
    const roundsCard = roundsElement.closest('button')
    if (!roundsCard) throw new Error('Rounds card button not found')

    // Switch to Rounds
    await app.user.click(roundsCard)
    expect(await screen.findByLabelText(/number of rounds/i)).toBeTruthy()

    // Switch to For Time
    await app.user.click(forTimeCard)
    await waitFor(() => {
      expect(screen.queryByLabelText(/number of rounds/i)).toBeNull()
    })

    app.cleanup()
  })

  it('navigates to /workouts when save button is clicked with name and exercise', async () => {
    const app = await createTestApp()

    await app.router.push('/benchmarks/create')
    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')
    })

    const nameInput = screen.getByLabelText(/workout name/i)
    await app.user.type(nameInput, 'Fran')

    // Add an exercise
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

    // Ensure body is clickable
    await waitFor(() => {
      const pointerEvents = window.getComputedStyle(document.body).pointerEvents
      expect(pointerEvents).not.toBe('none')
    })

    const saveButton = app.getByRole('button', { name: /save/i })
    await app.user.click(saveButton)

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

    const backButton = app.getByRole('button', { name: /back/i })
    await app.user.click(backButton)

    await waitFor(() => {
      expect(app.router.currentRoute.value.path).toBe('/workouts')
    })

    app.cleanup()
  })
})
