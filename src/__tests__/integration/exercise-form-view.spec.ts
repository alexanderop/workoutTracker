import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { useExercisesStore } from '@/stores/exercises'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Exercise Form View', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('creates a custom exercise with equipment, muscle, type, and metrics', async () => {
    const app = await createTestApp()
    await app.navigateTo({ name: RouteNames.ExerciseForm })

    await userEvent.fill(
      page.getByPlaceholder(/bulgarian split squat/i),
      'Test Cable Crossover Fly',
    )

    await userEvent.click(page.getByRole('button', { name: /^equipment/i }))
    await app.common.waitForDialog()
    await userEvent.click(page.getByRole('button', { name: /cable/i }))
    await app.common.waitForDialogClose()

    await userEvent.click(page.getByRole('button', { name: /muscle group/i }))
    await app.common.waitForDialog()
    await userEvent.click(page.getByRole('button', { name: /chest/i }))
    await app.common.waitForDialogClose()

    await userEvent.click(page.getByRole('button', { name: /exercise type/i }))
    await app.common.waitForDialog()
    await userEvent.click(page.getByRole('button', { name: /compound movement/i }))
    await app.common.waitForDialogClose()
    await expect
      .element(page.getByRole('button', { name: /exercise type compound/i }))
      .toBeVisible()

    await userEvent.click(page.getByRole('button', { name: /^metrics/i }))
    await app.common.waitForDialog()
    await userEvent.click(page.getByRole('button', { name: /reps only/i }))
    await app.common.waitForDialogClose()
    await expect.element(page.getByRole('button', { name: /metrics reps only/i })).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: 'Save', exact: true }))

    const store = useExercisesStore()
    await expect
      .poll(() => store.customExercises.find((e) => e.name === 'Test Cable Crossover Fly'))
      .toMatchObject({
        name: 'Test Cable Crossover Fly',
        equipment: 'cable',
        muscle: 'chest',
        type: 'compound',
        metrics: 'reps-only',
      })

    app.cleanup()
  })

  it('edits an existing custom exercise and saves the changes', async () => {
    const app = await createTestApp()

    const store = useExercisesStore()
    const created = await store.addExercise({
      name: 'Rope Pushdown',
      equipment: 'cable',
      muscle: 'arms',
      type: 'isolation',
      metrics: 'weight-reps',
    })
    if (!created) throw new Error('Expected exercise to be created')

    await app.navigateTo({ name: RouteNames.EditExercise, params: { id: created.id } })

    const nameInput = page.getByPlaceholder(/bulgarian split squat/i)
    await expect.element(nameInput).toHaveValue('Rope Pushdown')

    await userEvent.fill(nameInput, 'Triceps Rope Pushdown')
    await userEvent.click(page.getByRole('button', { name: 'Save', exact: true }))

    await expect.poll(() => store.getExerciseById(created.id)?.name).toBe('Triceps Rope Pushdown')

    app.cleanup()
  })
})
