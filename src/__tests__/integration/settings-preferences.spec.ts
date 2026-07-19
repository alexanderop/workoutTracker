/* eslint-disable vitest/no-conditional-in-test -- Settings controls are conditionally rendered by preference values. */
/* eslint-disable vitest/expect-expect -- Page-object actions include their own visible-state assertions. */
import { page, userEvent } from 'vitest/browser'
import { beforeEach, describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { getSettingsRepository } from '@/db'
import {
  expectSettingValue,
  getTemplateById,
  getTemplateCount,
  seedTemplate,
} from '../helpers/dbAssertions'

// Clear VueUse localStorage key before each test
const VUEUSE_COLOR_SCHEME_KEY = 'vueuse-color-scheme'

/**
 * Integration tests for settings preferences.
 * Tests non-happy-path flows like cancelling dialogs, theme persistence,
 * and language switching edge cases.
 */
describe('Settings Preferences', () => {
  beforeEach(async () => {
    localStorage.removeItem(VUEUSE_COLOR_SCHEME_KEY)
  })

  describe('Dark Mode Toggle', () => {
    it('toggles dark mode and persists preference', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      // Find and verify the theme toggle
      const themeToggle = page.getByTestId('theme-toggle')
      await expect.element(themeToggle).toBeVisible()

      // Get initial state
      const themeToggleElement = await themeToggle.element()
      const isInitialChecked =
        themeToggleElement instanceof HTMLButtonElement
          ? themeToggleElement.dataset.state === 'checked'
          : false

      // Toggle theme
      await userEvent.click(themeToggle)

      // Verify toggle state changed
      await expect
        .poll(async () => {
          const element = await themeToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state === 'checked' : false
        })
        .toBe(!isInitialChecked)

      // Verify preference persisted to localStorage (VueUse colorMode uses localStorage)
      await expect
        .poll(() => {
          return localStorage.getItem('vueuse-color-scheme')
        })
        .toBeTruthy()
    })

    it('adds dark class to html element when dark mode enabled', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      const themeToggle = page.getByTestId('theme-toggle')
      const initialIsDark = document.documentElement.classList.contains('dark')

      await userEvent.click(themeToggle)

      await expect
        .poll(() => document.documentElement.classList.contains('dark'))
        .toBe(!initialIsDark)
    })

    it('dark mode preference survives page navigation', async ({ createTestApp }) => {
      const { common, router } = await createTestApp()
      await common.navigateToSettings()

      // Toggle to ensure a known state (toggle once to change from default)
      const themeToggle = page.getByTestId('theme-toggle')
      await userEvent.click(themeToggle)

      const toggleElement = await themeToggle.element()
      const stateAfterToggle =
        toggleElement instanceof HTMLButtonElement ? toggleElement.dataset.state : null

      // Navigate away
      await router.push('/')
      await expect.poll(() => router.currentRoute.value.path).toBe('/')

      // Navigate back to settings
      await common.navigateToSettings()

      // Verify toggle state is preserved
      const newToggle = page.getByTestId('theme-toggle')
      await expect
        .poll(async () => {
          const element = await newToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe(stateAfterToggle)
    })
  })

  describe('Language Selection', () => {
    it('changes language and updates UI text', async ({ createTestApp }) => {
      const { common, getByRole, getByText } = await createTestApp()
      await common.navigateToSettings()

      // Verify initial English text - wait for page to fully load
      const heading = page.getByRole('heading', { name: 'Settings' })
      await expect.element(heading, { timeout: 3000 }).toBeVisible()

      // Open language select using aria-label on the trigger
      const languageSelect = getByRole('combobox', { name: /language/i })
      await userEvent.click(languageSelect)

      // Select German
      const germanOption = getByText('Deutsch')
      await userEvent.click(germanOption)

      // Verify UI updated to German (the heading changes)
      await expect
        .element(page.getByRole('heading', { level: 1 }), { timeout: 3000 })
        .toHaveTextContent('Einstellungen')
    })

    it('sets html lang attribute when language changes', async ({ createTestApp }) => {
      const { common, getByRole, getByText } = await createTestApp()
      await common.navigateToSettings()

      await expect
        .element(page.getByRole('heading', { name: 'Settings' }), { timeout: 3000 })
        .toBeVisible()

      const languageSelect = getByRole('combobox', { name: /language/i })
      await userEvent.click(languageSelect)
      const germanOption = getByText('Deutsch')
      await userEvent.click(germanOption)

      await expect.poll(() => document.documentElement.lang).toBe('de')
    })

    it('language preference persists to database', async ({ createTestApp }) => {
      const { common, getByRole, getByText } = await createTestApp()
      await common.navigateToSettings()

      // Wait for settings page to load
      await expect
        .element(page.getByRole('heading', { name: 'Settings' }), { timeout: 3000 })
        .toBeVisible()

      // Open language select and change to German
      const languageSelect = getByRole('combobox', { name: /language/i })
      await userEvent.click(languageSelect)
      const germanOption = getByText('Deutsch')
      await userEvent.click(germanOption)

      // Verify persisted to database
      await expectSettingValue('language', 'de')
    })
  })

  describe('Delete All Data Dialog', () => {
    it('cancelling delete dialog preserves all data', async ({ createTestApp }) => {
      const { common, getByRole } = await createTestApp()

      // Add some data to verify it persists
      const seededTemplate = await seedTemplate({ name: 'Test Template For Delete Cancel' })
      const initialCount = await getTemplateCount()
      expect(initialCount).toBeGreaterThan(0)

      await common.navigateToSettings()

      // Click delete all data button
      const deleteButton = getByRole('button', { name: /^delete all data$/i })
      await userEvent.click(deleteButton)

      // Confirmation dialog appears
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /delete all data/i })).toBeVisible()

      // Click Cancel button
      await userEvent.click(common.getDialogButton('Cancel'))

      // Dialog closes
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

      // Data is preserved - count should be the same
      expect(await getTemplateCount()).toBe(initialCount)
      // Specifically verify our test template still exists
      const testTemplate = await getTemplateById(seededTemplate.id)
      expect(testTemplate).toBeTruthy()
    })

    it('clicking outside delete dialog preserves data', async ({ createTestApp }) => {
      const { common, getByRole } = await createTestApp()

      // Add test data
      const seededTemplate = await seedTemplate({ name: 'Test Template For Escape Close' })
      const initialCount = await getTemplateCount()

      await common.navigateToSettings()

      // Open delete dialog
      await userEvent.click(getByRole('button', { name: /^delete all data$/i }))
      await common.waitForDialog()

      // Press Escape to close dialog
      await userEvent.keyboard('{Escape}')

      // Dialog closes
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

      // Data preserved
      expect(await getTemplateCount()).toBe(initialCount)
      // Specifically verify our test template still exists
      const testTemplate = await getTemplateById(seededTemplate.id)
      expect(testTemplate).toBeTruthy()
    })
  })

  describe('Timer Sounds Setting', () => {
    it('timer sounds can be toggled off and persists', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      // Find timer sounds toggle
      const timerSoundsToggle = page.getByRole('switch', { name: /timer sounds/i })
      await expect.element(timerSoundsToggle).toBeVisible()

      // Verify initially enabled (default)
      await expect
        .poll(async () => {
          const element = await timerSoundsToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe('checked')

      // Toggle off
      await userEvent.click(timerSoundsToggle)

      // Verify toggled off
      await expect
        .poll(async () => {
          const element = await timerSoundsToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe('unchecked')

      // Verify persisted (stored as 'timerSoundEnabled' - singular)
      await expectSettingValue('timerSoundEnabled', false)
    })

    it('timer sounds can be toggled back on after being disabled', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      const timerSoundsToggle = page.getByRole('switch', { name: /timer sounds/i })

      // Toggle off first
      await userEvent.click(timerSoundsToggle)
      await expect
        .poll(async () => {
          const element = await timerSoundsToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe('unchecked')

      // Toggle back on
      await userEvent.click(timerSoundsToggle)
      await expect
        .poll(async () => {
          const element = await timerSoundsToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe('checked')

      // Verify database shows enabled
      await expectSettingValue('timerSoundEnabled', true)
    })

    it('volume slider persists value when changed', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      const volumeSlider = page.getByTestId('timer-sound-volume-slider')
      await expect.element(volumeSlider).toBeVisible()

      // Simulate slider change to 70% (slider uses @change event, not @input)
      const sliderElement = await volumeSlider.element()
      if (sliderElement instanceof HTMLInputElement) {
        sliderElement.value = '0.7'
        sliderElement.dispatchEvent(new Event('change', { bubbles: true }))
      }

      await expectSettingValue('timerSoundVolume', 0.7)
    })

    it('shows volume slider only when timer sounds are enabled', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      // Volume slider should be visible when sounds are enabled (default)
      const volumeSlider = page.getByTestId('timer-sound-volume-slider')
      await expect.element(volumeSlider).toBeVisible()

      // Disable timer sounds
      const timerSoundsToggle = page.getByRole('switch', { name: /timer sounds/i })
      await userEvent.click(timerSoundsToggle)

      // Volume slider should be hidden
      await expect.element(volumeSlider).not.toBeInTheDocument()
    })
  })

  describe('Live Updates', () => {
    it('reflects a setting changed through the repository without a manual reload', async ({
      createTestApp,
    }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      const timerSoundsToggle = page.getByRole('switch', { name: /timer sounds/i })
      await expect.element(timerSoundsToggle).toBeVisible()

      // Confirm the default (enabled) state before making the change.
      await expect
        .poll(async () => {
          const element = await timerSoundsToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe('checked')

      // Change the setting directly through the repository (bypassing the
      // store's own setter and the UI) to simulate a cross-tab change. The
      // store's live subscription — not a manual reload call — must pick this up.
      await getSettingsRepository().set({ key: 'timerSoundEnabled', value: false })

      await expect
        .poll(async () => {
          const element = await timerSoundsToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe('unchecked')
    })
  })

  describe('Weight Unit Setting', () => {
    it('switches from kg to lbs and persists', async ({ createTestApp }) => {
      const { common, getByRole } = await createTestApp()
      await common.navigateToSettings()

      // Find the lbs button in the weight toggle group (uses role="button" with aria-label)
      const lbsButton = getByRole('button', { name: /pounds/i })
      await expect.element(lbsButton).toBeVisible()
      await userEvent.click(lbsButton)

      // Verify persisted to database
      await expectSettingValue('weightUnit', 'lbs')
    })

    it('switches from lbs back to kg', async ({ createTestApp }) => {
      const { common, getByRole } = await createTestApp()
      await common.navigateToSettings()

      // First switch to lbs
      const lbsButton = getByRole('button', { name: /pounds/i })
      await userEvent.click(lbsButton)

      // Then switch back to kg
      const kgButton = getByRole('button', { name: /kilograms/i })
      await userEvent.click(kgButton)

      // Verify persisted to database
      await expectSettingValue('weightUnit', 'kg')
    })

    it('weight unit preference survives page navigation', async ({ createTestApp }) => {
      const { common, router, getByRole } = await createTestApp()
      await common.navigateToSettings()

      // Switch to lbs
      const lbsButton = getByRole('button', { name: /pounds/i })
      await userEvent.click(lbsButton)

      // Navigate away
      await router.push('/')
      await expect.poll(() => router.currentRoute.value.path).toBe('/')

      // Navigate back to settings
      await common.navigateToSettings()

      // Verify lbs is still selected (data-state="on")
      const newLbsButton = getByRole('button', { name: /pounds/i })
      await expect
        .poll(async () => {
          const element = await newLbsButton.element()
          return element.dataset.state
        })
        .toBe('on')
    })
  })

  describe('Height Unit Setting', () => {
    it('switches from cm to ft/in and persists', async ({ createTestApp }) => {
      const { common, getByRole } = await createTestApp()
      await common.navigateToSettings()

      // Find the ft/in button in the height toggle group
      const ftInButton = getByRole('button', { name: /feet and inches/i })
      await expect.element(ftInButton).toBeVisible()
      await userEvent.click(ftInButton)

      // Verify persisted to database
      await expectSettingValue('heightUnit', 'ft-in')
    })

    it('switches from ft/in back to cm', async ({ createTestApp }) => {
      const { common, getByRole } = await createTestApp()
      await common.navigateToSettings()

      // First switch to ft/in
      const ftInButton = getByRole('button', { name: /feet and inches/i })
      await userEvent.click(ftInButton)

      // Then switch back to cm
      const cmButton = getByRole('button', { name: /centimeters/i })
      await userEvent.click(cmButton)

      // Verify persisted to database
      await expectSettingValue('heightUnit', 'cm')
    })
  })

  describe('Screen Wake Lock Setting', () => {
    it('screen wake lock toggle is visible and defaults to enabled', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      const wakeLockToggle = page.getByRole('switch', { name: /keep screen on/i })
      await expect.element(wakeLockToggle).toBeVisible()

      // Default is enabled
      await expect
        .poll(async () => {
          const element = await wakeLockToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe('checked')
    })

    it('screen wake lock can be toggled off and persists', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      const wakeLockToggle = page.getByRole('switch', { name: /keep screen on/i })
      await userEvent.click(wakeLockToggle)

      // Verify toggled off
      await expect
        .poll(async () => {
          const element = await wakeLockToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe('unchecked')

      // Verify persisted
      await expectSettingValue('screenWakeLock', false)
    })

    it('screen wake lock can be toggled back on', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      const wakeLockToggle = page.getByRole('switch', { name: /keep screen on/i })

      // Toggle off first
      await userEvent.click(wakeLockToggle)
      await expect
        .poll(async () => {
          const element = await wakeLockToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe('unchecked')

      // Toggle back on
      await userEvent.click(wakeLockToggle)
      await expect
        .poll(async () => {
          const element = await wakeLockToggle.element()
          return element instanceof HTMLButtonElement ? element.dataset.state : null
        })
        .toBe('checked')

      // Verify database shows enabled
      await expectSettingValue('screenWakeLock', true)
    })
  })

  describe('Rest Timer Setting', () => {
    it('defaults to 90 seconds', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      const preset = page.getByRole('button', { name: /90 second rest timer target/i })
      await expect.element(preset).toBeVisible()
      await expect
        .poll(async () => {
          const element = await preset.element()
          return element.dataset.state
        })
        .toBe('on')
    })

    it('selecting a preset persists the new default rest timer', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      const twoMinutePreset = page.getByRole('button', { name: /120 second rest timer target/i })
      await userEvent.click(twoMinutePreset)

      await expectSettingValue('defaultRestTimer', 120)
    })

    it('selecting "Off" disables the rest timer target and persists 0', async ({
      createTestApp,
    }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      const offPreset = page.getByRole('button', { name: /no rest timer target/i })
      await userEvent.click(offPreset)

      await expectSettingValue('defaultRestTimer', 0)
    })

    it('rest timer preference survives page navigation', async ({ createTestApp }) => {
      const { common, router } = await createTestApp()
      await common.navigateToSettings()

      const twoMinutePreset = page.getByRole('button', { name: /120 second rest timer target/i })
      await userEvent.click(twoMinutePreset)

      await router.push('/')
      await expect.poll(() => router.currentRoute.value.path).toBe('/')

      await common.navigateToSettings()

      const persistedPreset = page.getByRole('button', { name: /120 second rest timer target/i })
      await expect
        .poll(async () => {
          const element = await persistedPreset.element()
          return element.dataset.state
        })
        .toBe('on')
    })
  })

  describe('Advanced Diagnostics Section', () => {
    it('expands and collapses advanced diagnostics section', async ({ createTestApp }) => {
      const { common } = await createTestApp()
      await common.navigateToSettings()

      // Find the advanced diagnostics trigger
      const advancedTrigger = page.getByRole('button', { name: /advanced diagnostics/i })
      await expect.element(advancedTrigger).toBeVisible()

      // Initially collapsed - wake lock API section should not be visible
      await expect.element(page.getByText(/wake lock api/i)).not.toBeInTheDocument()

      // Click to expand
      await userEvent.click(advancedTrigger)

      // Wait for content to become visible (Wake Lock API is the title)
      await expect.element(page.getByText(/wake lock api/i)).toBeVisible()

      // Click again to collapse
      await userEvent.click(advancedTrigger)

      // Content should be hidden
      await expect.element(page.getByText(/wake lock api/i)).not.toBeInTheDocument()
    })
  })
})
