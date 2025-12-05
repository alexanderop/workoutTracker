import { waitFor } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'
import { i18n } from '@/i18n'
import type { MessageSchema } from '@/i18n/types'
import { useSettingsStore } from '@/stores/settings'

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- intentionally invalid for test
const emptyMessages = {} as MessageSchema

describe('Language Switch', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  it('displays English translations when switching from German to English', async () => {
    // Create app first (initializes Pinia)
    const { queryByText, queryByRole, getByRole, navigateTo, cleanup } = await createTestApp()

    // Clear preloaded English messages to expose the bug
    // The createTestApp helper preloads English at line 73, which masks the bug
    i18n.global.setLocaleMessage('en', emptyMessages)

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
    await navigateTo('/settings')

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
