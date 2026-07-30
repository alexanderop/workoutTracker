import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createLanguageState,
  prepareInitialLanguage,
} from '@/features/settings/composables/useLanguage'
import { getSettingsRepository } from '@/db'
import { i18n } from '@/i18n'
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
    i18n.global.locale.value = 'en'
    document.documentElement.lang = 'en'
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

  it('prepares the saved locale before the app can render its first frame', async () => {
    const repository = getSettingsRepository()
    await repository.set({ key: 'language', value: 'de' })

    const settings = useSettingsStore()
    settings.$reset()
    i18n.global.locale.value = 'en'
    document.documentElement.lang = 'en'

    const locale = await prepareInitialLanguage({ window: getBrowserWindow() })

    expect(locale).toBe('de')
    expect(settings.isLoaded).toBe(true)
    expect(i18n.global.locale.value).toBe('de')
    expect(document.documentElement.lang).toBe('de')
    await expect(repository.get('language')).resolves.toBe('de')
  })

  it('does not claim a requested locale when its messages fail to load', async () => {
    const repository = getSettingsRepository()
    await repository.set({ key: 'language', value: 'de' })

    const settings = useSettingsStore()
    settings.$reset()
    i18n.global.locale.value = 'en'
    document.documentElement.lang = 'en'
    const loadError = new Error('locale chunk unavailable')

    await expect(
      prepareInitialLanguage({
        window: getBrowserWindow(),
        localeLoader: () => Promise.reject(loadError),
      }),
    ).rejects.toBe(loadError)

    expect(i18n.global.locale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('uses but does not persist the browser fallback after a failed settings read', async () => {
    const localeLoader = vi.fn(async () => {})
    const setLanguage = vi.fn(async () => {})
    const failedSettings = {
      language: undefined,
      isLoaded: false,
      loadFromDb: vi.fn(async () => false),
      setLanguage,
    }

    const locale = await prepareInitialLanguage({
      window: getBrowserWindow(),
      localeLoader,
      settings: failedSettings,
    })

    expect(['en', 'de']).toContain(locale)
    expect(localeLoader).toHaveBeenCalledWith(locale)
    expect(document.documentElement.lang).toBe(locale)
    expect(setLanguage).not.toHaveBeenCalled()
  })
})
