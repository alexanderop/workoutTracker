import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from '@/stores/settings'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Timer Audio Settings', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Settings Page Toggle', () => {
    it('displays timer sounds toggle on settings page', async () => {
      const { common, cleanup } = await createTestApp()

      await common.navigateToSettings()

      const toggle = page.getByRole('switch', { name: /timer sounds/i }).query()
      expect(toggle).toBeTruthy()

      cleanup()
    })

    it('timer sounds toggle defaults to enabled', async () => {
      const { common, cleanup } = await createTestApp()

      await common.navigateToSettings()

      const toggle = await page.getByRole('switch', { name: /timer sounds/i }).element()
      expect(toggle.getAttribute('aria-checked')).toBe('true')

      cleanup()
    })

    it('toggles timer sounds setting when clicked', async () => {
      const { common, cleanup } = await createTestApp()

      await common.navigateToSettings()

      const toggleLocator = page.getByRole('switch', { name: /timer sounds/i })
      const toggle = await toggleLocator.element()
      expect(toggle.getAttribute('aria-checked')).toBe('true')

      await toggleLocator.click()

      await expect.poll(async () => {
        const element = await toggleLocator.element()
        return element.getAttribute('aria-checked')
      }).toBe('false')

      const settings = useSettingsStore()
      expect(settings.timerSoundEnabled).toBe(false)

      cleanup()
    })

    it('persists timer sounds setting across page navigation', async () => {
      const { common, cleanup } = await createTestApp()

      await common.navigateToSettings()

      const toggleLocator = page.getByRole('switch', { name: /timer sounds/i })
      await toggleLocator.click()

      await expect.poll(async () => {
        const element = await toggleLocator.element()
        return element.getAttribute('aria-checked')
      }).toBe('false')

      await common.navigateToExercises()
      await common.navigateToSettings()

      const toggleAfterNav = await page.getByRole('switch', { name: /timer sounds/i }).element()
      expect(toggleAfterNav.getAttribute('aria-checked')).toBe('false')

      cleanup()
    })
  })
})
