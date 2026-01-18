import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement } from '../helpers/assertions'
import { page } from '../helpers/locator'
import { i18n } from '@/i18n'
import { RouteNames } from '@/router'
import { useSettingsStore } from '@/stores/settings'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

const isBrowserMode =
  globalThis.window !== undefined && '__vitest_browser__' in globalThis

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

  // This test suite requires browser-only APIs:
  // - reka-ui Select component uses target.hasPointerCapture() for pointer events
  // - Happy-DOM doesn't support pointer capture APIs
  // Skip in Happy-DOM mode
  describe.skipIf(!isBrowserMode)('Language Switching', () => {
    it('displays English translations when switching from German to English via UI', async () => {
      const { navigateTo, queryByText, getByRole, findByText, cleanup } =
        await createTestApp()

      // Set German as the starting language
      const settingsStore = useSettingsStore()
      settingsStore.setLanguage('de')

      // Navigate to settings page
      await navigateTo({ name: RouteNames.Settings })

      // Wait for settings page to render in German
      const heading = page.getByRole('heading', { name: /einstellungen/i })
      await expectElement(heading, { timeout: 3000 }).toBeVisible()
      await expectElement(heading).toHaveTextContent('Einstellungen')

      // Verify German labels display
      expect(queryByText(/gewicht/i)).toBeTruthy() // "Gewicht" = Weight in German

      // Open the language select dropdown (aria-label is "Sprache" in German)
      const languageSelect = getByRole('combobox', { name: /sprache/i })
      await languageSelect.click()

      // Select English from the dropdown options
      const englishOption = findByText('English')
      await englishOption.click()

      // Wait for UI to update to English
      await expectElement(page.getByRole('heading', { level: 1 }), { timeout: 3000 }).toHaveTextContent('Settings')

      // Verify English labels display correctly
      const settingsHeading = getByRole('heading', { level: 1 }).element()
      expect(settingsHeading.textContent).toBe('Settings')

      const weightLabel = queryByText(/^weight$/i)
      expect(weightLabel).toBeTruthy()

      cleanup()
    })
  })
})
