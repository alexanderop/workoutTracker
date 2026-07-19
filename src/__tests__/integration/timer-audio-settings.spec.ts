import { page } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { useSettingsStore } from '@/stores/settings'

describe('Timer Audio Settings', () => {
  describe('Settings Page Toggle', () => {
    it('displays timer sounds toggle on settings page', async ({ createTestApp }) => {
      const { common } = await createTestApp()

      await common.navigateToSettings()

      const toggle = page.getByRole('switch', { name: /timer sounds/i }).query()
      expect(toggle).toBeTruthy()
    })

    it('timer sounds toggle defaults to enabled', async ({ createTestApp }) => {
      const { common } = await createTestApp()

      await common.navigateToSettings()

      const toggle = await page.getByRole('switch', { name: /timer sounds/i }).element()
      expect(toggle.getAttribute('aria-checked')).toBe('true')
    })

    it('toggles timer sounds setting when clicked', async ({ createTestApp }) => {
      const { common } = await createTestApp()

      await common.navigateToSettings()

      const toggleLocator = page.getByRole('switch', { name: /timer sounds/i })
      const toggle = await toggleLocator.element()
      expect(toggle.getAttribute('aria-checked')).toBe('true')

      await toggleLocator.click()

      await expect
        .poll(async () => {
          const element = await toggleLocator.element()
          return element.getAttribute('aria-checked')
        })
        .toBe('false')

      const settings = useSettingsStore()
      expect(settings.timerSoundEnabled).toBe(false)
    })

    it('persists timer sounds setting across page navigation', async ({ createTestApp }) => {
      const { common } = await createTestApp()

      await common.navigateToSettings()

      const toggleLocator = page.getByRole('switch', { name: /timer sounds/i })
      await toggleLocator.click()

      await expect
        .poll(async () => {
          const element = await toggleLocator.element()
          return element.getAttribute('aria-checked')
        })
        .toBe('false')

      await common.navigateToExercises()
      await common.navigateToSettings()

      const toggleAfterNav = await page.getByRole('switch', { name: /timer sounds/i }).element()
      expect(toggleAfterNav.getAttribute('aria-checked')).toBe('false')
    })
  })
})
