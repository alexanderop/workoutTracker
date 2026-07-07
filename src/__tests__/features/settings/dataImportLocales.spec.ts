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
  it.each(IMPORT_ERROR_CODES)(
    'should have an English string translation for error code "%s"',
    (code) => {
      const message = Reflect.get(en.errors, code)
      expect(message, `en settings.errors.${code}`).toBeTypeOf('string')
    },
  )

  it.each(IMPORT_ERROR_CODES)(
    'should have a German string translation for error code "%s"',
    (code) => {
      const message = Reflect.get(de.errors, code)
      expect(message, `de settings.errors.${code}`).toBeTypeOf('string')
    },
  )
})
