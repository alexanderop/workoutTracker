import { afterEach, describe, expect, it } from 'vitest'
import { createLanguageState } from '@/features/settings/composables/useLanguage'
import { getSettingsRepository } from '@/db'
import { useSettingsStore } from '@/stores/settings'
import { resetDatabase } from '../helpers/resetDatabase'
import { withSetup } from '../helpers/withSetup'

function getBrowserWindow(): Window {
  const browserWindow = document.defaultView
  if (!browserWindow) throw new Error('Expected a browser window')
  return browserWindow
}

describe('useLanguage', () => {
  afterEach(async () => {
    await resetDatabase()
  })

  it('preserves a saved locale while the settings snapshot loads', async () => {
    const repository = getSettingsRepository()
    await repository.set({ key: 'language', value: 'de' })

    const settings = useSettingsStore()
    settings.$reset()
    const [language, app] = withSetup(() => createLanguageState({ window: getBrowserWindow() }))

    await settings.loadFromDb()

    await expect.poll(() => language.activeLocale.value).toBe('de')
    await expect.poll(() => document.documentElement.lang).toBe('de')
    await expect(repository.get('language')).resolves.toBe('de')

    app.unmount()
  })
})
