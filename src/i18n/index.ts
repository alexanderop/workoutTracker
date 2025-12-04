import { createI18n } from 'vue-i18n'
import type { MessageSchema } from './types'

export type SupportedLocale = 'en' | 'de'

export const i18n = createI18n<[MessageSchema], SupportedLocale, false>({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  missingWarn: import.meta.env.MODE !== 'test',
  fallbackWarn: import.meta.env.MODE !== 'test',
})

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
