/* eslint-disable vitest/no-conditional-in-test -- Localized text may be conditionally present during navigation. */
import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { i18n } from '@/i18n'
import { RouteNames } from '@/router'
import { useSettingsStore } from '@/stores/settings'

describe('Localization', () => {
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
    it('displays English translations when switching from German to English via UI', async ({
      createTestApp,
    }) => {
      const { navigateTo, getByText, getByRole } = await createTestApp()

      // Set German as the starting language
      const settingsStore = useSettingsStore()
      settingsStore.setLanguage('de')

      // Navigate to settings page
      await navigateTo({ name: RouteNames.Settings })

      // Wait for settings page to render in German
      const heading = page.getByRole('heading', { name: /einstellungen/i })
      await expect.element(heading, { timeout: 3000 }).toBeVisible()
      await expect.element(heading).toHaveTextContent('Einstellungen')

      // Verify German labels display
      await expect.element(getByText(/gewicht/i).first()).toBeVisible() // "Gewicht" = Weight in German
      await expect.element(getByRole('switch', { name: 'Dunkelmodus' })).toBeVisible()
      await expect.element(getByRole('switch', { name: 'Bildschirm anlassen' })).toBeVisible()
      await expect.element(getByRole('switch', { name: 'Timer-Töne' })).toBeVisible()

      // Open the language select dropdown (aria-label is "Sprache" in German)
      const languageSelect = getByRole('combobox', { name: /sprache/i })
      await userEvent.click(languageSelect)

      // Select English from the dropdown options
      const englishOption = getByText('English')
      await userEvent.click(englishOption)

      // Wait for UI to update to English
      await expect
        .element(page.getByRole('heading', { level: 1 }), { timeout: 3000 })
        .toHaveTextContent('Settings')

      // Verify English labels display correctly
      const settingsHeading = await getByRole('heading', { level: 1 }).element()
      expect(settingsHeading.textContent).toBe('Settings')

      // Unanchored: the settings "Weight" label renders with surrounding
      // whitespace, which Playwright's regex matching does not normalize.
      // (The old anchored form matched the Weight nav tab, which moved into
      // the quick-add sheet.)
      await expect.element(getByText(/weight/i).first()).toBeVisible()
      await expect.element(getByRole('switch', { name: 'Dark Mode' })).toBeVisible()
      await expect.element(getByRole('switch', { name: 'Keep Screen On' })).toBeVisible()
      await expect.element(getByRole('switch', { name: 'Timer Sounds' })).toBeVisible()
    })
  })
})
