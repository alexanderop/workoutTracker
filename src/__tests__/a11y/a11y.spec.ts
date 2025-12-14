import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { assertNoViolations } from '../helpers/a11y'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Accessibility', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Home Page', () => {
    it('has no a11y violations on initial load', async () => {
      const { container, cleanup } = await createTestApp()

      await assertNoViolations(container)

      cleanup()
    })
  })

  describe('Workout Builder', () => {
    it('has no a11y violations in builder mode', async () => {
      const { builder, container, cleanup } = await createTestApp()

      await builder.navigateTo()
      await assertNoViolations(container)

      cleanup()
    })

    it('has no a11y violations with strength block added', async () => {
      const { builder, container, cleanup } = await createTestApp()

      await builder.addStrengthBlock('Squat')
      await assertNoViolations(container)

      cleanup()
    })

    it('has no a11y violations with multiple blocks', async () => {
      const { builder, container, common, cleanup } = await createTestApp()

      await builder.addStrengthBlock('Squat')
      await builder.openAddBlockDialog()
      await common.selectExercise('Bench Press')

      await assertNoViolations(container)

      cleanup()
    })
  })

  describe('Exercise Selector Dialog', () => {
    it('has no a11y violations when open', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      const dialog = page.getByRole('dialog').element()
      await assertNoViolations(dialog)

      cleanup()
    })
  })

  describe('Active Workout', () => {
    it('has no a11y violations in active mode with strength block', async () => {
      const { builder, container, cleanup } = await createTestApp()

      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()

      await expect
        .poll(() => page.getByRole('heading', { name: /bench press/i }).query())
        .toBeTruthy()

      await assertNoViolations(container)

      cleanup()
    })
  })

  describe('Settings Page', () => {
    it('has no a11y violations on settings page', async () => {
      const { common, container, cleanup } = await createTestApp()

      await common.navigateToSettings()
      await assertNoViolations(container)

      cleanup()
    })
  })

  describe('Exercises Page', () => {
    it('has no a11y violations on exercises page', async () => {
      const { common, container, cleanup } = await createTestApp()

      await common.navigateToExercises()
      await assertNoViolations(container)

      cleanup()
    })
  })

  describe('Workouts Page', () => {
    it('has no a11y violations on workouts page', async () => {
      const { common, container, cleanup } = await createTestApp()

      await common.navigateToWorkouts()
      await assertNoViolations(container)

      cleanup()
    })
  })
})
