import { computed, watch } from 'vue'
import type { ConfigurableWindow } from '@vueuse/core'
import { createGlobalState, defaultWindow, useAsyncState, useNavigatorLanguage } from '@vueuse/core'
import { loadLocale, type SupportedLocale } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'

function detectBrowserLocale(browserLanguage: string | undefined): SupportedLocale {
  const browserLang = browserLanguage?.split('-', 1)[0]
  return browserLang === 'de' ? 'de' : 'en'
}

type LanguageSettings = {
  language: SupportedLocale | undefined
  isLoaded: boolean
  loadFromDb: () => Promise<boolean>
  setLanguage: (locale: SupportedLocale) => Promise<void>
}

export type UseLanguageOptions = ConfigurableWindow & {
  localeLoader?: (locale: SupportedLocale) => Promise<void>
  settings?: LanguageSettings
}

async function applyLocale(
  locale: SupportedLocale,
  window: Window | undefined,
  localeLoader: (locale: SupportedLocale) => Promise<void>,
): Promise<SupportedLocale> {
  await localeLoader(locale)
  if (window) window.document.documentElement.lang = locale
  return locale
}

/**
 * Resolve persisted language state before Vue mounts. This prevents the first
 * translated frame from rendering in English while IndexedDB and the saved
 * locale chunk are still loading.
 */
export async function prepareInitialLanguage(options: UseLanguageOptions = {}) {
  const {
    window = defaultWindow,
    localeLoader = loadLocale,
    settings = useSettingsStore(),
  } = options

  const didLoadSettings = await settings.loadFromDb()

  const locale = settings.language ?? detectBrowserLocale(window?.navigator.language)
  if (didLoadSettings && !settings.language) await settings.setLanguage(locale)

  return applyLocale(locale, window, localeLoader)
}

export function createLanguageState(options: UseLanguageOptions = {}) {
  const {
    window = defaultWindow,
    localeLoader = loadLocale,
    settings = useSettingsStore(),
  } = options

  // 1. Initializing
  const { language: browserLanguage } = useNavigatorLanguage({ window })

  // 2. Primary State + 3. State Metadata via useAsyncState
  const {
    state: activeLocale,
    isLoading,
    error,
    execute,
  } = useAsyncState(
    (locale: SupportedLocale) => applyLocale(locale, window, localeLoader),
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
