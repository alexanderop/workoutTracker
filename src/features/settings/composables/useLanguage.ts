import { computed, watch } from 'vue'
import type { ConfigurableWindow } from '@vueuse/core'
import { createGlobalState, defaultWindow, useAsyncState, useNavigatorLanguage } from '@vueuse/core'
import { loadLocale, type SupportedLocale } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'

function detectBrowserLocale(browserLanguage: string | undefined): SupportedLocale {
  const browserLang = browserLanguage?.split('-', 1)[0]
  return browserLang === 'de' ? 'de' : 'en'
}

export type UseLanguageOptions = ConfigurableWindow

export function createLanguageState(options: UseLanguageOptions = {}) {
  const { window = defaultWindow } = options

  // 1. Initializing
  const settings = useSettingsStore()
  const { language: browserLanguage } = useNavigatorLanguage({ window })

  // 2. Primary State + 3. State Metadata via useAsyncState
  const {
    state: activeLocale,
    isLoading,
    error,
    execute,
  } = useAsyncState(
    async (locale: SupportedLocale) => {
      await loadLocale(locale)
      if (window) window.document.documentElement.lang = locale
      return locale
    },
    settings.language ?? 'en',
    { immediate: false, resetOnExecute: false },
  )

  // 4. Computed
  const currentLanguage = computed(() => settings.language ?? 'en')

  // 7. Watchers
  watch(
    [() => settings.isLoaded, () => settings.language],
    ([isLoaded, locale]) => {
      // The store begins with `language === undefined`. Waiting for its
      // IndexedDB snapshot prevents the browser default from overwriting a
      // preference that is still loading on a cold start.
      if (!isLoaded) return

      if (!locale) {
        void settings.setLanguage(detectBrowserLocale(browserLanguage.value))
        return
      }

      void execute(0, locale)
    },
    { immediate: true },
  )

  return {
    currentLanguage,
    activeLocale,
    isLoading,
    error,
  }
}

export const useLanguage = createGlobalState(createLanguageState)
