import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { useSettingsStore } from '@/stores/settings'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../helpers/resetDatabase'

describe('Timer Audio Settings', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

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
      const { common, user, getByRole, cleanup } = await createTestApp()

      await common.navigateToSettings()

      const toggle = getByRole('switch', { name: /timer sounds/i })
      expect(toggle.getAttribute('aria-checked')).toBe('true')

      await user.click(toggle)

      await waitFor(() => {
        expect(toggle.getAttribute('aria-checked')).toBe('false')
      })

      const settings = useSettingsStore()
      expect(settings.timerSoundEnabled).toBe(false)

      cleanup()
    })

    it('persists timer sounds setting across page navigation', async () => {
      const { common, user, getByRole, cleanup } = await createTestApp()

      await common.navigateToSettings()

      const toggle = getByRole('switch', { name: /timer sounds/i })
      await user.click(toggle)

      await waitFor(() => {
        expect(toggle.getAttribute('aria-checked')).toBe('false')
      })

      await common.navigateToExercises()
      await common.navigateToSettings()

      const toggleAfterNav = getByRole('switch', { name: /timer sounds/i })
      expect(toggleAfterNav.getAttribute('aria-checked')).toBe('false')

      cleanup()
    })
  })
})
