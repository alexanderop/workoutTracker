import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Visual Regression', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Home Page', () => {
    it('matches screenshot on initial load', async () => {
      const { cleanup } = await createTestApp()
      await expect(page.getByTestId('app')).toMatchScreenshot('home-initial')
      cleanup()
    })
  })

  describe('Workout Builder', () => {
    it('matches screenshot in builder mode', async () => {
      const { builder, cleanup } = await createTestApp()
      await builder.navigateTo()
      await expect(page.getByTestId('app')).toMatchScreenshot('builder-empty')
      cleanup()
    })

    it('matches screenshot with strength block added', async () => {
      const { builder, cleanup } = await createTestApp()
      await builder.addStrengthBlock('Squat')
      await expect(page.getByTestId('app')).toMatchScreenshot('builder-with-block')
      cleanup()
    })
  })

  describe('Active Workout', () => {
    it('matches screenshot in active mode with strength block', async () => {
      const { builder, cleanup } = await createTestApp()
      await builder.addStrengthBlock('Bench Press')
      await builder.startWorkout()
      await expect(page.getByTestId('app')).toMatchScreenshot('active-strength')
      cleanup()
    })
  })

  describe('Settings Page', () => {
    it('matches screenshot on settings page', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()
      await expect(page.getByTestId('app')).toMatchScreenshot('settings')
      cleanup()
    })

    it('matches screenshot with dark mode enabled', async () => {
      const { common, getByTestId, cleanup } = await createTestApp()
      await common.navigateToSettings()

      const themeToggle = getByTestId('theme-toggle')
      await userEvent.click(themeToggle)

      await expect(page.getByTestId('app')).toMatchScreenshot('settings-dark-mode')
      cleanup()
    })
  })

  describe('Exercises Page', () => {
    it('matches screenshot on exercises page', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToExercises()
      await expect(page.getByTestId('app')).toMatchScreenshot('exercises')
      cleanup()
    })
  })

  describe('Workouts Page', () => {
    it('matches screenshot on workouts page', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToWorkouts()
      await expect(page.getByTestId('app')).toMatchScreenshot('workouts')
      cleanup()
    })
  })
})
