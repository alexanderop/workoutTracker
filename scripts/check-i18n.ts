/**
 * i18n Locale Parity Checker
 *
 * Compares all translation keys between locales to ensure:
 * 1. All keys in the primary locale (en) exist in all other locales
 * 2. All keys in secondary locales exist in the primary locale
 *
 * Run: pnpm i18n:check
 */

import en from '../src/i18n/messages/en/index.ts'
import de from '../src/i18n/messages/de/index.ts'

function isNestedObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getKeys(obj: Record<string, unknown>, prefix = ''): Array<string> {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return isNestedObject(value) ? getKeys(value, fullKey) : [fullKey]
  })
}

function checkLocales(): boolean {
  const enKeys = new Set(getKeys(en))
  const deKeys = new Set(getKeys(de))

  const missingInDe = [...enKeys].filter((k) => !deKeys.has(k)).toSorted()
  const missingInEn = [...deKeys].filter((k) => !enKeys.has(k)).toSorted()

  let hasErrors = false

  if (missingInDe.length > 0) {
    console.error('\n❌ Keys missing in German (de):')
    missingInDe.forEach((key) => console.error(`   - ${key}`))
    hasErrors = true
  }

  if (missingInEn.length > 0) {
    console.error('\n❌ Keys missing in English (en):')
    missingInEn.forEach((key) => console.error(`   - ${key}`))
    hasErrors = true
  }

  if (!hasErrors) {
    console.warn('✅ All locales have matching keys')
    console.warn(`   Total keys: ${enKeys.size}`)
  }

  return hasErrors
}

const hasErrors = checkLocales()
process.exit(hasErrors ? 1 : 0)
