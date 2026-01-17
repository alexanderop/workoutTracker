import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { page, userEvent } from '../helpers/locator'
import { db } from '@/db'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

// Clear VueUse localStorage key before each test
const VUEUSE_COLOR_SCHEME_KEY = 'vueuse-color-scheme'

/**
 * Integration tests for settings preferences.
 * Tests non-happy-path flows like cancelling dialogs, theme persistence,
 * and language switching edge cases.
 */
describe('Settings Preferences', () => {
  beforeEach(async () => {
    await setupIntegrationTest()
    localStorage.removeItem(VUEUSE_COLOR_SCHEME_KEY)
  })
  afterEach(cleanupIntegrationTest)

  describe('Dark Mode Toggle', () => {
    it('toggles dark mode and persists preference', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Find and verify the theme toggle
      const themeToggle = page.getByTestId('theme-toggle')
      await expectElement(themeToggle).toBeVisible()

      // Get initial state
      const themeToggleElement = themeToggle.element()
      const initialChecked =
        themeToggleElement instanceof HTMLButtonElement
          ? themeToggleElement.dataset.state === 'checked'
          : false

      // Toggle theme
      await themeToggle.click()

      // Verify toggle state changed
      await expectPoll(async () => {
        const el = themeToggle.element()
        return el instanceof HTMLButtonElement ? el.dataset.state === 'checked' : false
      }).toBe(!initialChecked)

      // Verify preference persisted to localStorage (VueUse colorMode uses localStorage)
      await expectPoll(() => {
        return localStorage.getItem('vueuse-color-scheme')
      }).toBeTruthy()

      cleanup()
    })

    it('adds dark class to html element when dark mode enabled', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      const themeToggle = page.getByTestId('theme-toggle')
      const initialIsDark = document.documentElement.classList.contains('dark')

      await themeToggle.click()

      await expectPoll(() => document.documentElement.classList.contains('dark')).toBe(!initialIsDark)

      cleanup()
    })

    it('dark mode preference survives page navigation', async () => {
      const { common, router, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Toggle to ensure a known state (toggle once to change from default)
      const themeToggle = page.getByTestId('theme-toggle')
      await themeToggle.click()

      const toggleElement = themeToggle.element()
      const stateAfterToggle =
        toggleElement instanceof HTMLButtonElement ? toggleElement.dataset.state : null

      // Navigate away
      await router.push('/')
      await expectPoll(() => router.currentRoute.value.path).toBe('/')

      // Navigate back to settings
      await common.navigateToSettings()

      // Verify toggle state is preserved
      const newToggle = page.getByTestId('theme-toggle')
      await expectPoll(async () => {
        const el = newToggle.element()
        return el instanceof HTMLButtonElement ? el.dataset.state : null
      }).toBe(stateAfterToggle)

      cleanup()
    })
  })

  describe('Language Selection', () => {
    it('changes language and updates UI text', async () => {
      const { common, getByRole, findByText, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Verify initial English text - wait for page to fully load
      const heading = page.getByRole('heading', { name: 'Settings' })
      await expectElement(heading, { timeout: 3000 }).toBeVisible()

      // Open language select using aria-label on the trigger
      const languageSelect = getByRole('combobox', { name: /language/i })
      await userEvent.click(languageSelect)

      // Select German
      const germanOption = await findByText('Deutsch')
      await userEvent.click(germanOption)

      // Verify UI updated to German (the heading changes)
      await expectElement(page.getByRole('heading', { level: 1 }), { timeout: 3000 }).toHaveTextContent(
        'Einstellungen',
      )

      cleanup()
    })

    it('sets html lang attribute when language changes', async () => {
      const { common, getByRole, findByText, cleanup } = await createTestApp()
      await common.navigateToSettings()

      await expectElement(page.getByRole('heading', { name: 'Settings' }), { timeout: 3000 }).toBeVisible()

      const languageSelect = getByRole('combobox', { name: /language/i })
      await userEvent.click(languageSelect)
      const germanOption = await findByText('Deutsch')
      await userEvent.click(germanOption)

      await expectPoll(() => document.documentElement.lang).toBe('de')

      cleanup()
    })

    it('language preference persists to database', async () => {
      const { common, getByRole, findByText, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Wait for settings page to load
      await expectElement(page.getByRole('heading', { name: 'Settings' }), { timeout: 3000 }).toBeVisible()

      // Open language select and change to German
      const languageSelect = getByRole('combobox', { name: /language/i })
      await userEvent.click(languageSelect)
      const germanOption = await findByText('Deutsch')
      await userEvent.click(germanOption)

      // Verify persisted to database
      await expectPoll(async () => {
        const settings = await db.settings.toArray()
        const langSetting = settings.find((s) => s.key === 'language')
        return langSetting?.value
      }).toBe('de')

      cleanup()
    })
  })

  describe('Delete All Data Dialog', () => {
    it('cancelling delete dialog preserves all data', async () => {
      const { common, getByRole, cleanup } = await createTestApp()

      // Add some data to verify it persists
      await db.templates.add({
        id: 'test-template-delete-cancel',
        name: 'Test Template For Delete Cancel',
        blocks: [],
        createdAt: Date.now(),
        lastUsedAt: null,
        tags: [],
      })
      const initialCount = await db.templates.count()
      expect(initialCount).toBeGreaterThan(0)

      await common.navigateToSettings()

      // Click delete all data button
      const deleteButton = getByRole('button', { name: /^delete all data$/i })
      await userEvent.click(deleteButton)

      // Confirmation dialog appears
      await common.waitForDialog()
      await expectElement(page.getByRole('heading', { name: /delete all data/i })).toBeVisible()

      // Click Cancel button
      await userEvent.click(common.getDialogButton('Cancel'))

      // Dialog closes
      await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()

      // Data is preserved - count should be the same
      expect(await db.templates.count()).toBe(initialCount)
      // Specifically verify our test template still exists
      const testTemplate = await db.templates.get('test-template-delete-cancel')
      expect(testTemplate).toBeTruthy()

      cleanup()
    })

    it('clicking outside delete dialog preserves data', async () => {
      const { common, getByRole, cleanup } = await createTestApp()

      // Add test data
      await db.templates.add({
        id: 'test-template-escape-close',
        name: 'Test Template For Escape Close',
        blocks: [],
        createdAt: Date.now(),
        lastUsedAt: null,
        tags: [],
      })
      const initialCount = await db.templates.count()

      await common.navigateToSettings()

      // Open delete dialog
      await userEvent.click(getByRole('button', { name: /^delete all data$/i }))
      await common.waitForDialog()

      // Press Escape to close dialog
      await userEvent.keyboard('{Escape}')

      // Dialog closes
      await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()

      // Data preserved
      expect(await db.templates.count()).toBe(initialCount)
      // Specifically verify our test template still exists
      const testTemplate = await db.templates.get('test-template-escape-close')
      expect(testTemplate).toBeTruthy()

      cleanup()
    })
  })

  describe('Timer Sounds Setting', () => {
    it('timer sounds can be toggled off and persists', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Find timer sounds toggle
      const timerSoundsToggle = page.getByRole('switch', { name: /timer sounds/i })
      await expectElement(timerSoundsToggle).toBeVisible()

      // Verify initially enabled (default)
      await expectPoll(async () => {
        const el = timerSoundsToggle.element()
        return el instanceof HTMLButtonElement ? el.dataset.state : null
      }).toBe('checked')

      // Toggle off
      await timerSoundsToggle.click()

      // Verify toggled off
      await expectPoll(async () => {
        const el = timerSoundsToggle.element()
        return el instanceof HTMLButtonElement ? el.dataset.state : null
      }).toBe('unchecked')

      // Verify persisted (stored as 'timerSoundEnabled' - singular)
      await expectPoll(async () => {
        const settings = await db.settings.toArray()
        const soundSetting = settings.find((s) => s.key === 'timerSoundEnabled')
        return soundSetting?.value
      }).toBe(false)

      cleanup()
    })

    it('timer sounds can be toggled back on after being disabled', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      const timerSoundsToggle = page.getByRole('switch', { name: /timer sounds/i })

      // Toggle off first
      await timerSoundsToggle.click()
      await expectPoll(async () => {
        const el = timerSoundsToggle.element()
        return el instanceof HTMLButtonElement ? el.dataset.state : null
      }).toBe('unchecked')

      // Toggle back on
      await timerSoundsToggle.click()
      await expectPoll(async () => {
        const el = timerSoundsToggle.element()
        return el instanceof HTMLButtonElement ? el.dataset.state : null
      }).toBe('checked')

      // Verify database shows enabled
      await expectPoll(async () => {
        const settings = await db.settings.toArray()
        const soundSetting = settings.find((s) => s.key === 'timerSoundEnabled')
        return soundSetting?.value
      }).toBe(true)

      cleanup()
    })

    it('volume slider persists value when changed', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      const volumeSlider = page.getByTestId('timer-sound-volume-slider')
      await expectElement(volumeSlider).toBeVisible()

      // Simulate slider change to 70% (slider uses @change event, not @input)
      const sliderEl = volumeSlider.element()
      if (sliderEl instanceof HTMLInputElement) {
        sliderEl.value = '0.7'
        sliderEl.dispatchEvent(new Event('change', { bubbles: true }))
      }

      await expectPoll(async () => {
        const settings = await db.settings.toArray()
        const volumeSetting = settings.find((s) => s.key === 'timerSoundVolume')
        return volumeSetting?.value
      }).toBe(0.7)

      cleanup()
    })

    it('shows volume slider only when timer sounds are enabled', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Volume slider should be visible when sounds are enabled (default)
      const volumeSlider = page.getByTestId('timer-sound-volume-slider')
      await expectElement(volumeSlider).toBeVisible()

      // Disable timer sounds
      const timerSoundsToggle = page.getByRole('switch', { name: /timer sounds/i })
      await timerSoundsToggle.click()

      // Volume slider should be hidden
      await expectElement(volumeSlider).not.toBeInTheDocument()

      cleanup()
    })
  })

  describe('Weight Unit Setting', () => {
    it('switches from kg to lbs and persists', async () => {
      const { common, getByRole, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Find the lbs button in the weight toggle group (uses role="button" with aria-label)
      const lbsButton = getByRole('button', { name: /pounds/i })
      await expectElement(lbsButton).toBeVisible()
      await userEvent.click(lbsButton)

      // Verify persisted to database
      await expectPoll(async () => {
        const settings = await db.settings.toArray()
        const unitSetting = settings.find((s) => s.key === 'weightUnit')
        return unitSetting?.value
      }).toBe('lbs')

      cleanup()
    })

    it('switches from lbs back to kg', async () => {
      const { common, getByRole, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // First switch to lbs
      const lbsButton = getByRole('button', { name: /pounds/i })
      await userEvent.click(lbsButton)

      // Then switch back to kg
      const kgButton = getByRole('button', { name: /kilograms/i })
      await userEvent.click(kgButton)

      // Verify persisted to database
      await expectPoll(async () => {
        const settings = await db.settings.toArray()
        const unitSetting = settings.find((s) => s.key === 'weightUnit')
        return unitSetting?.value
      }).toBe('kg')

      cleanup()
    })

    it('weight unit preference survives page navigation', async () => {
      const { common, router, getByRole, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Switch to lbs
      const lbsButton = getByRole('button', { name: /pounds/i })
      await userEvent.click(lbsButton)

      // Navigate away
      await router.push('/')
      await expectPoll(() => router.currentRoute.value.path).toBe('/')

      // Navigate back to settings
      await common.navigateToSettings()

      // Verify lbs is still selected (data-state="on")
      const newLbsButton = getByRole('button', { name: /pounds/i })
      await expectPoll(async () => {
        const el = await newLbsButton.element()
        return el.dataset.state
      }).toBe('on')

      cleanup()
    })
  })

  describe('Height Unit Setting', () => {
    it('switches from cm to ft/in and persists', async () => {
      const { common, getByRole, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Find the ft/in button in the height toggle group
      const ftInButton = getByRole('button', { name: /feet and inches/i })
      await expectElement(ftInButton).toBeVisible()
      await userEvent.click(ftInButton)

      // Verify persisted to database
      await expectPoll(async () => {
        const settings = await db.settings.toArray()
        const unitSetting = settings.find((s) => s.key === 'heightUnit')
        return unitSetting?.value
      }).toBe('ft-in')

      cleanup()
    })

    it('switches from ft/in back to cm', async () => {
      const { common, getByRole, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // First switch to ft/in
      const ftInButton = getByRole('button', { name: /feet and inches/i })
      await userEvent.click(ftInButton)

      // Then switch back to cm
      const cmButton = getByRole('button', { name: /centimeters/i })
      await userEvent.click(cmButton)

      // Verify persisted to database
      await expectPoll(async () => {
        const settings = await db.settings.toArray()
        const unitSetting = settings.find((s) => s.key === 'heightUnit')
        return unitSetting?.value
      }).toBe('cm')

      cleanup()
    })
  })

  describe('Screen Wake Lock Setting', () => {
    it('screen wake lock toggle is visible and defaults to enabled', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      const wakeLockToggle = page.getByRole('switch', { name: /keep screen on/i })
      await expectElement(wakeLockToggle).toBeVisible()

      // Default is enabled
      await expectPoll(async () => {
        const el = wakeLockToggle.element()
        return el instanceof HTMLButtonElement ? el.dataset.state : null
      }).toBe('checked')

      cleanup()
    })

    it('screen wake lock can be toggled off and persists', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      const wakeLockToggle = page.getByRole('switch', { name: /keep screen on/i })
      await wakeLockToggle.click()

      // Verify toggled off
      await expectPoll(async () => {
        const el = wakeLockToggle.element()
        return el instanceof HTMLButtonElement ? el.dataset.state : null
      }).toBe('unchecked')

      // Verify persisted
      await expectPoll(async () => {
        const settings = await db.settings.toArray()
        const wakeLockSetting = settings.find((s) => s.key === 'screenWakeLock')
        return wakeLockSetting?.value
      }).toBe(false)

      cleanup()
    })

    it('screen wake lock can be toggled back on', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      const wakeLockToggle = page.getByRole('switch', { name: /keep screen on/i })

      // Toggle off first
      await wakeLockToggle.click()
      await expectPoll(async () => {
        const el = wakeLockToggle.element()
        return el instanceof HTMLButtonElement ? el.dataset.state : null
      }).toBe('unchecked')

      // Toggle back on
      await wakeLockToggle.click()
      await expectPoll(async () => {
        const el = wakeLockToggle.element()
        return el instanceof HTMLButtonElement ? el.dataset.state : null
      }).toBe('checked')

      // Verify database shows enabled
      await expectPoll(async () => {
        const settings = await db.settings.toArray()
        const wakeLockSetting = settings.find((s) => s.key === 'screenWakeLock')
        return wakeLockSetting?.value
      }).toBe(true)

      cleanup()
    })
  })

  describe('Advanced Diagnostics Section', () => {
    it('expands and collapses advanced diagnostics section', async () => {
      const { common, cleanup } = await createTestApp()
      await common.navigateToSettings()

      // Find the advanced diagnostics trigger
      const advancedTrigger = page.getByRole('button', { name: /advanced diagnostics/i })
      await expectElement(advancedTrigger).toBeVisible()

      // Initially collapsed - wake lock API section should not be visible
      await expectElement(page.getByText(/wake lock api/i)).not.toBeInTheDocument()

      // Click to expand
      await advancedTrigger.click()

      // Wait for content to become visible (Wake Lock API is the title)
      await expectElement(page.getByText(/wake lock api/i)).toBeVisible()

      // Click again to collapse
      await advancedTrigger.click()

      // Content should be hidden
      await expectElement(page.getByText(/wake lock api/i)).not.toBeInTheDocument()

      cleanup()
    })
  })
})
