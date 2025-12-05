import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useSettingsStore } from '@/stores/settings'

// Mock the i18n module
vi.mock('@/i18n', () => ({
  loadLocale: vi.fn().mockResolvedValue(undefined),
}))

// Import after mocking
import { loadLocale } from '@/i18n'

describe('useLanguage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.documentElement.lang = ''

    // Reset the global state by clearing the module cache
    vi.resetModules()
  })

  describe('initialization', () => {
    it('auto-detects browser locale on first visit when language is undefined', async () => {
      // Reimport to get fresh state
      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      expect(settings.language).toBeUndefined()

      freshUseLanguage()

      // Should set to detected locale (en by default since navigator.language isn't 'de')
      expect(settings.language).toBe('en')
    })

    it('preserves existing language setting', async () => {
      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      settings.language = 'de'

      freshUseLanguage()

      expect(settings.language).toBe('de')
    })
  })

  describe('currentLanguage', () => {
    it('returns computed ref of current language', async () => {
      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      settings.language = 'en'

      const { currentLanguage } = freshUseLanguage()

      expect(currentLanguage.value).toBe('en')
    })

    it('updates when settings change', async () => {
      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      settings.language = 'en'

      const { currentLanguage } = freshUseLanguage()
      expect(currentLanguage.value).toBe('en')

      settings.language = 'de'
      expect(currentLanguage.value).toBe('de')
    })
  })

  describe('setLanguage', () => {
    it('updates the settings store', async () => {
      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      settings.language = 'en'

      const { setLanguage } = freshUseLanguage()
      await setLanguage('de')

      expect(settings.language).toBe('de')
    })
  })

  describe('locale loading', () => {
    it('loads locale when language changes', async () => {
      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      settings.language = 'en'

      freshUseLanguage()
      await nextTick()

      expect(loadLocale).toHaveBeenCalledWith('en')
    })

    it('updates document.documentElement.lang after loading', async () => {
      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      settings.language = 'de'

      freshUseLanguage()
      await nextTick()
      // Wait for async state to resolve
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(document.documentElement.lang).toBe('de')
    })
  })

  describe('loading and error states', () => {
    it('exposes isLoading state', async () => {
      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      settings.language = 'en'

      const { isLoading } = freshUseLanguage()

      expect(isLoading).toBeDefined()
      expect(typeof isLoading.value).toBe('boolean')
    })

    it('exposes error state', async () => {
      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      settings.language = 'en'

      const { error } = freshUseLanguage()

      expect(error).toBeDefined()
      expect(error.value).toBeUndefined()
    })

    it('captures errors when locale loading fails', async () => {
      const mockError = new Error('Failed to load locale')
      vi.mocked(loadLocale).mockRejectedValueOnce(mockError)

      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      settings.language = 'en'

      const { error } = freshUseLanguage()
      await nextTick()
      // Wait for async rejection
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(error.value).toBe(mockError)
    })
  })

  describe('singleton behavior', () => {
    it('returns same instance when called multiple times', async () => {
      const { useLanguage: freshUseLanguage } = await import('@/features/settings/composables/useLanguage')

      const settings = useSettingsStore()
      settings.language = 'en'

      const instance1 = freshUseLanguage()
      const instance2 = freshUseLanguage()

      expect(instance1.currentLanguage).toBe(instance2.currentLanguage)
      expect(instance1.isLoading).toBe(instance2.isLoading)
    })
  })
})
