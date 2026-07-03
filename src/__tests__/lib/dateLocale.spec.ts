import { afterEach, describe, expect, it } from 'vitest'
import { getCurrentLocale, getDateLocale } from '@/lib/dateLocale'
import { i18n } from '@/i18n'

describe('dateLocale', () => {
  afterEach(() => {
    i18n.global.locale.value = 'en'
  })

  describe('getDateLocale', () => {
    it('returns the en-US date-fns locale for "en"', () => {
      expect(getDateLocale('en').code).toBe('en-US')
    })

    it('returns the German date-fns locale for "de"', () => {
      expect(getDateLocale('de').code).toBe('de')
    })
  })

  describe('getCurrentLocale', () => {
    it('reflects the active i18n locale', () => {
      i18n.global.locale.value = 'en'
      expect(getCurrentLocale()).toBe('en')

      i18n.global.locale.value = 'de'
      expect(getCurrentLocale()).toBe('de')
    })
  })
})
