import { waitFor } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { RouteNames } from '@/router'
import { useSettingsStore } from '@/stores/settings'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest } from '../helpers/integrationSetup'

describe('Localization', () => {
  afterEach(cleanupIntegrationTest)

  describe('Message Preloading', () => {
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

  describe('Language Switching', () => {
    it('displays English translations when switching from German to English', async () => {
      // Create app first (initializes Pinia)
      const { queryByText, queryByRole, getByRole, navigateTo, cleanup } = await createTestApp()

      // Clear preloaded English messages to expose the bug
      // The createTestApp helper preloads English at line 73, which masks the bug
      // Using empty object - intentionally invalid for testing error handling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
      i18n.global.setLocaleMessage('en', {} as any)

      // Set German as the language and load German messages
      const settingsStore = useSettingsStore()
      settingsStore.setLanguage('de')

      // Wait for German to load
      await waitFor(
        () => {
          const germanText = queryByText(/neues workout/i) // Home page in German
          expect(germanText).toBeTruthy()
        },
        { timeout: 3000 },
      )

      // Navigate to settings page
      await navigateTo({ name: RouteNames.Settings })

      // Wait for settings page to load in German
      await waitFor(
        () => {
          const heading = queryByRole('heading', { name: /einstellungen/i })
          expect(heading).toBeTruthy()
          expect(heading?.textContent).toBe('Einstellungen')
        },
        { timeout: 3000 },
      )

      // Verify German labels display
      expect(queryByText(/gewicht/i)).toBeTruthy() // "Gewicht" = Weight in German

      // Switch to English programmatically (simulates user selecting English)
      // This triggers useLanguage composable which calls loadLocale('en')
      settingsStore.setLanguage('en')

      // Wait for language change attempt to complete
      // BUG: The loadLocale function sees 'en' in availableLocales and returns early
      // without loading messages, causing raw keys to display instead of English text
      await waitFor(
        () => {
          // The page should update, but with raw translation keys due to the bug
          const heading = queryByRole('heading', { level: 1 })
          expect(heading?.textContent).not.toBe('Einstellungen') // Should change from German
        },
        { timeout: 3000 },
      )

      // Assert English text displays correctly (THIS WILL FAIL due to the bug)
      const settingsHeading = getByRole('heading', { level: 1 })

      // The bug causes raw keys to display instead of English text
      // We expect "Settings" but will get "settings.title"
      expect(settingsHeading.textContent).toBe('Settings') // FAILS - actual: 'settings.title'

      // Verify English labels display not raw keys
      const weightHeading = queryByText(/^weight$/i)
      expect(weightHeading).toBeTruthy() // FAILS - will be 'settings.labels.weight'

      cleanup()
    })
  })
})
