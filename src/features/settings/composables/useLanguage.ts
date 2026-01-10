import { computed, watch } from 'vue'
import { createGlobalState, useAsyncState } from '@vueuse/core'
import { loadLocale, type SupportedLocale } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'

function detectBrowserLocale(): SupportedLocale {
  const browserLang = navigator.language.split('-')[0]
  return browserLang === 'de' ? 'de' : 'en'
}

export const useLanguage = createGlobalState(() => {
  // 1. Initializing
  const settings = useSettingsStore()

  // Auto-detect on first visit
  if (settings.language === undefined) {
    settings.setLanguage(detectBrowserLocale())
  }

  // 2. Primary State + 3. State Metadata via useAsyncState
  const {
    state: activeLocale,
    isLoading,
    error,
    execute,
  } = useAsyncState(
    async (locale: SupportedLocale) => {
      await loadLocale(locale)
      document.documentElement.lang = locale
      return locale
    },
    settings.language ?? 'en',
    { immediate: false, resetOnExecute: false },
  )

  // 4. Computed
  const currentLanguage = computed(() => settings.language ?? 'en')

  // 7. Watchers
  watch(
    () => settings.language,
    (locale) => {
      if (locale) {
        execute(0, locale)
      }
    },
    { immediate: true },
  )

  return {
    currentLanguage,
    activeLocale,
    isLoading,
    error,
  }
})
