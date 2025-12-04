import { createI18n, type I18n } from 'vue-i18n'
import en from './messages/en'
import type { MessageSchema, SupportedLocale } from './types'
// Import types.ts to activate the declare module augmentation
import './types'

export type { SupportedLocale } from './types'

// Type for composition mode i18n with wider locale support
type CompositionI18n = I18n<
  Partial<Record<SupportedLocale, MessageSchema>>,
  Record<string, never>,
  Record<string, never>,
  SupportedLocale,
  false
>

// Helper function to create i18n with proper return type
// The return type annotation widens the inferred types for dynamic locale loading
function createCompositionI18n(): CompositionI18n {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en },
    missingWarn: import.meta.env.MODE !== 'test',
    fallbackWarn: import.meta.env.MODE !== 'test',
  })
}

export const i18n = createCompositionI18n()

const loadingLocales = new Map<SupportedLocale, Promise<void>>()

function hasLoadedMessages(locale: SupportedLocale): boolean {
  const messages = i18n.global.messages.value[locale]
  return messages !== undefined && Object.keys(messages).length > 0
}

export async function loadLocale(locale: SupportedLocale): Promise<void> {
  // Already fully loaded - just switch
  if (hasLoadedMessages(locale)) {
    i18n.global.locale.value = locale
    return
  }

  // Currently loading - wait for it (prevents concurrent duplicate loads)
  const existing = loadingLocales.get(locale)
  if (existing) {
    await existing
    i18n.global.locale.value = locale
    return
  }

  // Start loading
  const loadPromise = (async () => {
    const localeMessages = await import(`./messages/${locale}/index.ts`)
    i18n.global.setLocaleMessage(locale, localeMessages.default)
  })()

  loadingLocales.set(locale, loadPromise)
  try {
    await loadPromise
  } finally {
    loadingLocales.delete(locale)
  }
  i18n.global.locale.value = locale
}
