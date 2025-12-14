import { userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from '@/stores/settings'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Timer Audio Settings', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Settings Page Toggle', () => {
    it('displays timer sounds toggle on settings page', async () => {
      const { common, queryByRole, cleanup } = await createTestApp()

      await common.navigateToSettings()

      const toggle = queryByRole('switch', { name: /timer sounds/i })
      expect(toggle).toBeTruthy()

      cleanup()
    })

    it('timer sounds toggle defaults to enabled', async () => {
      const { common, getByRole, cleanup } = await createTestApp()

      await common.navigateToSettings()

      const toggle = getByRole('switch', { name: /timer sounds/i })
      expect(toggle.getAttribute('aria-checked')).toBe('true')

      cleanup()
    })

    it('toggles timer sounds setting when clicked', async () => {
      const { common, getByRole, cleanup } = await createTestApp()

      await common.navigateToSettings()

      const toggle = getByRole('switch', { name: /timer sounds/i })
      expect(toggle.getAttribute('aria-checked')).toBe('true')

      await userEvent.click(toggle)

      await expect.poll(() => toggle.getAttribute('aria-checked')).toBe('false')

      const settings = useSettingsStore()
      expect(settings.timerSoundEnabled).toBe(false)

      cleanup()
    })

    it('persists timer sounds setting across page navigation', async () => {
      const { common, getByRole, cleanup } = await createTestApp()

      await common.navigateToSettings()

      const toggle = getByRole('switch', { name: /timer sounds/i })
      await userEvent.click(toggle)

      await expect.poll(() => toggle.getAttribute('aria-checked')).toBe('false')

      await common.navigateToExercises()
      await common.navigateToSettings()

      const toggleAfterNav = getByRole('switch', { name: /timer sounds/i })
      expect(toggleAfterNav.getAttribute('aria-checked')).toBe('false')

      cleanup()
    })
  })
})
