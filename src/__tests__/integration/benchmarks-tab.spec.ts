import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Benchmarks Tab', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('displays three tabs: Templates, History, Benchmarks', async () => {
    const app = await createTestApp()

    // Navigate to workouts page
    await app.user.click(app.getByRole('button', { name: /workouts/i }))
    expect(app.router.currentRoute.value.path).toBe('/workouts')

    // Wait for tabs to load
    await waitFor(() => {
      expect(app.queryByRole('tab', { name: /templates/i })).toBeTruthy()
    })

    // Assert three tabs exist
    expect(app.getByRole('tab', { name: /templates/i })).toBeTruthy()
    expect(app.getByRole('tab', { name: /history/i })).toBeTruthy()
    expect(app.getByRole('tab', { name: /benchmarks/i })).toBeTruthy()

    app.cleanup()
  })

  it('shows empty state with Create Benchmark button when no benchmarks exist', async () => {
    const app = await createTestApp()

    // Navigate to workouts page
    await app.user.click(app.getByRole('button', { name: /workouts/i }))

    // Wait for tabs to load
    await waitFor(() => {
      expect(app.queryByRole('tab', { name: /benchmarks/i })).toBeTruthy()
    })

    // Click on Benchmarks tab
    await app.user.click(app.getByRole('tab', { name: /benchmarks/i }))

    // Assert empty state message displays
    expect(app.getByText(/no benchmarks yet/i)).toBeTruthy()

    // Assert Create Benchmark button exists
    expect(app.getByRole('button', { name: /create benchmark/i })).toBeTruthy()

    app.cleanup()
  })

  it('navigates to /benchmarks/create when Create Benchmark button is clicked', async () => {
    const app = await createTestApp()

    // Navigate to workouts page
    await app.user.click(app.getByRole('button', { name: /workouts/i }))

    // Wait for tabs to load
    await waitFor(() => {
      expect(app.queryByRole('tab', { name: /benchmarks/i })).toBeTruthy()
    })

    // Click on Benchmarks tab
    await app.user.click(app.getByRole('tab', { name: /benchmarks/i }))

    // Click Create Benchmark button
    await app.user.click(app.getByRole('button', { name: /create benchmark/i }))

    // Assert navigation to /benchmarks/create
    expect(app.router.currentRoute.value.path).toBe('/benchmarks/create')

    app.cleanup()
  })
})
