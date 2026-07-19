import { describe, expect, it } from 'vitest'

import { IMPORT_ERROR_CODES } from '@/features/settings/utils/dataImport'
import en from '@/i18n/messages/en/settings'
import de from '@/i18n/messages/de/settings'

/**
 * `dataImport.ts` returns error codes (e.g. `validationFailed`) that
 * `useDataExportImport.ts` looks up as `t('settings.errors.' + code)`.
 * If a code has no translation, vue-i18n falls back to rendering the raw
 * key (e.g. "settings.errors.validationFailed") in the failure dialog.
 *
 * This test locks every code `dataImport.ts` can produce to a real
 * translation string in every supported locale, so the two can never
 * drift apart again.
 */
describe('dataImport error code translations', () => {
  it.for([
    { locale: 'en', errors: en.errors },
    { locale: 'de', errors: de.errors },
  ])('has translations for every import error in $locale', ({ locale, errors }) => {
    for (const code of IMPORT_ERROR_CODES) {
      const message = Reflect.get(errors, code)
      expect(message, `${locale} settings.errors.${code}`).toBeTypeOf('string')
    }
  })
})
