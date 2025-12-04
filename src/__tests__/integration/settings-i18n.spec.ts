import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'

describe('i18n message preloading', () => {
  it('preloads English messages synchronously at import time', () => {
    // The i18n module should have English messages available immediately
    // without needing to call loadLocale() asynchronously.
    // This prevents the "Not found 'settings.languages.en' key" warning
    // when components render before async loading completes.

    const enMessages = i18n.global.messages.value.en

    // Verify English messages exist and contain expected keys
    expect(enMessages).toBeDefined()

    // Guard narrows type after assertion
    if (!enMessages) throw new Error('English messages not loaded')

    expect(Object.keys(enMessages).length).toBeGreaterThan(0)

    // Verify the specific keys that caused the warning exist
    expect(enMessages.settings).toBeDefined()
    expect(enMessages.settings.languages).toBeDefined()
    expect(enMessages.settings.languages.en).toBe('English')
    expect(enMessages.settings.languages.de).toBe('Deutsch')
  })
})
