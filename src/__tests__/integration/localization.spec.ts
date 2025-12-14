import { waitFor } from '@testing-library/vue'
import { userEvent } from '@vitest/browser/context'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import { RouteNames } from '@/router'
import { useSettingsStore } from '@/stores/settings'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Localization', () => {
  beforeEach(setupIntegrationTest)
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
    it('displays English translations when switching from German to English via UI', async () => {
      const { navigateTo, queryByText, queryByRole, getByRole, findByText, cleanup } =
        await createTestApp()

      // Set German as the starting language
      const settingsStore = useSettingsStore()
      settingsStore.setLanguage('de')

      // Navigate to settings page
      await navigateTo({ name: RouteNames.Settings })

      // Wait for settings page to render in German
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

      // Open the language select dropdown (aria-label is "Sprache" in German)
      const languageSelect = getByRole('combobox', { name: /sprache/i })
      await userEvent.click(languageSelect)

      // Select English from the dropdown options
      const englishOption = await findByText('English')
      await userEvent.click(englishOption)

      // Wait for UI to update to English
      await waitFor(
        () => {
          const heading = queryByRole('heading', { level: 1 })
          expect(heading?.textContent).toBe('Settings')
        },
        { timeout: 3000 },
      )

      // Verify English labels display correctly
      const settingsHeading = getByRole('heading', { level: 1 })
      expect(settingsHeading.textContent).toBe('Settings')

      const weightLabel = queryByText(/^weight$/i)
      expect(weightLabel).toBeTruthy()

      cleanup()
    })
  })
})
