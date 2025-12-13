import { enUS, de } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import type { SupportedLocale } from '@/i18n/types'
import { i18n } from '@/i18n'

const localeMap: Record<SupportedLocale, Locale> = {
  en: enUS,
  de: de,
}

/**
 * Type guard to check if a locale string is supported.
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale === 'en' || locale === 'de'
}

/**
 * Get the current app locale, with fallback to 'en'.
 */
export function getCurrentLocale(): SupportedLocale {
  const locale = i18n.global.locale.value
  return isSupportedLocale(locale) ? locale : 'en'
}

/**
 * Get the date-fns locale for the given supported locale.
 */
export function getDateLocale(locale: SupportedLocale): Locale {
  return localeMap[locale]
}
