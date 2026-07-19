/* eslint-disable vitest/no-conditional-in-test -- Settings controls are conditionally rendered by preference values. */

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
  beforeEach(() => {
    localStorage.removeItem(VUEUSE_COLOR_SCHEME_KEY)
  })

  describe('Dark Mode Toggle', () => {
    it('toggles the document theme, persists it, and survives navigation', async ({
      createTestApp,
    }) => {
      const { common, router } = await createTestApp()
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
      const initialIsDark = document.documentElement.classList.contains('dark')

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

      await expect
        .poll(() => document.documentElement.classList.contains('dark'))
        .toBe(!initialIsDark)

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
    it('changes the UI and document language and persists the selection', async ({
      createTestApp,
    }) => {
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

      await expect.poll(() => document.documentElement.lang).toBe('de')

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

    it('pressing Escape in delete dialog preserves data', async ({ createTestApp }) => {
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
    it('toggles sounds, controls slider visibility, and persists volume', async ({
      createTestApp,
    }) => {
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

      // Volume slider is hidden while sounds are disabled.
      const volumeSlider = page.getByTestId('timer-sound-volume-slider')
      await expect.element(volumeSlider).not.toBeInTheDocument()

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
      await expect.element(volumeSlider).toBeVisible()

      // Simulate slider change to 70% (slider uses @change event, not @input)
      const sliderElement = await volumeSlider.element()
      if (sliderElement instanceof HTMLInputElement) {
        sliderElement.value = '0.7'
        sliderElement.dispatchEvent(new Event('change', { bubbles: true }))
      }

      await expectSettingValue('timerSoundVolume', 0.7)
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
    it('switches both ways, persists, and retains pounds across navigation', async ({
      createTestApp,
    }) => {
      const { common, router, getByRole } = await createTestApp()
      await common.navigateToSettings()

      // Find the lbs button in the weight toggle group (uses role="button" with aria-label)
      const lbsButton = getByRole('button', { name: /pounds/i })
      await expect.element(lbsButton).toBeVisible()
      await userEvent.click(lbsButton)

      // Verify persisted to database
      await expectSettingValue('weightUnit', 'lbs')

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

      // Then switch back to kg and verify the reverse transition persists.
      const kgButton = getByRole('button', { name: /kilograms/i })
      await userEvent.click(kgButton)
      await expectSettingValue('weightUnit', 'kg')
    })
  })

  describe('Height Unit Setting', () => {
    it('switches from cm to ft/in and back, persisting both transitions', async ({
      createTestApp,
    }) => {
      const { common, getByRole } = await createTestApp()
      await common.navigateToSettings()

      // Find the ft/in button in the height toggle group
      const ftInButton = getByRole('button', { name: /feet and inches/i })
      await expect.element(ftInButton).toBeVisible()
      await userEvent.click(ftInButton)

      // Verify persisted to database
      await expectSettingValue('heightUnit', 'ft-in')

      // Then switch back to cm
      const cmButton = getByRole('button', { name: /centimeters/i })
      await userEvent.click(cmButton)

      // Verify persisted to database
      await expectSettingValue('heightUnit', 'cm')
    })
  })

  describe('Screen Wake Lock Setting', () => {
    it('is visible and enabled by default, then persists off and on transitions', async ({
      createTestApp,
    }) => {
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
    it('defaults to 90, persists 120 across navigation, and can be disabled', async ({
      createTestApp,
    }) => {
      const { common, router } = await createTestApp()
      await common.navigateToSettings()

      const preset = page.getByRole('button', { name: /90 second rest timer target/i })
      await expect.element(preset).toBeVisible()
      await expect
        .poll(async () => {
          const element = await preset.element()
          return element.dataset.state
        })
        .toBe('on')

      const twoMinutePreset = page.getByRole('button', { name: /120 second rest timer target/i })
      await userEvent.click(twoMinutePreset)

      await expectSettingValue('defaultRestTimer', 120)

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

      const offPreset = page.getByRole('button', { name: /no rest timer target/i })
      await userEvent.click(offPreset)
      await expectSettingValue('defaultRestTimer', 0)
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
