import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { getWeightRepository } from '@/db'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { mockTouchDevice, restoreMatchMedia } from '../helpers/mockTouchDevice'
import { NumericInputModalPO } from '../helpers/pages/NumericInputModalPO'
import { createDbWeightEntry } from '../factories/dbWeightEntry.factory'

describe('Weight Tracking (Mobile)', () => {
  beforeEach(async () => {
    mockTouchDevice()
    await setupIntegrationTest()
  })
  afterEach(async () => {
    await cleanupIntegrationTest()
    restoreMatchMedia()
  })

  const modalPO = new NumericInputModalPO()

  describe('preset centering', () => {
    it('centers presets around last saved weight when opening modal (pre-seeded)', async () => {
      // Seed DB with a weight entry of 65kg BEFORE navigating
      const repo = getWeightRepository()
      await repo.add(createDbWeightEntry({ weight: 65 }))

      const { navigateTo, cleanup } = await createTestApp()

      // Navigate to weight page
      await navigateTo({ name: RouteNames.Weight })

      // Button should show 65 (last weight) - match the exact format "65 kg"
      const weightButton = page.getByRole('button', { name: '65 kg' })
      await expect.element(weightButton).toBeVisible()

      // Open the modal
      await weightButton.click()
      await modalPO.waitForOpen()

      // The selected preset should show 65, not 80
      const selectedPreset = page.getByTestId('preset-selected')
      await expect.element(selectedPreset).toBeVisible()

      // Get the text content of the selected preset
      const selectedElement = await selectedPreset.element()
      const selectedText = selectedElement.textContent?.trim()
      expect(selectedText).toContain('65')

      // Also verify that presets around 65 exist (e.g., 62.5 and 67.5)
      // These should be visible if presets are centered around 65
      await expect.element(page.getByRole('option', { name: /^62\.5/ })).toBeVisible()
      await expect.element(page.getByRole('option', { name: /^67\.5/ })).toBeVisible()

      await modalPO.clickCancel()
      cleanup()
    })

    it('centers presets around newly saved weight after first entry', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Navigate to weight page (no existing entries - defaults to 80)
      await navigateTo({ name: RouteNames.Weight })

      // Default value should be 80 (or converted if lbs)
      const defaultButton = page.getByRole('button', { name: '80 kg' })
      await expect.element(defaultButton).toBeVisible()

      // Open modal and save 65kg
      await defaultButton.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(65)
      await modalPO.waitForClose()

      // Click save button
      const saveButton = page.getByRole('button', { name: /save/i })
      await saveButton.click()

      // Wait for save to complete
      await expect.poll(async () => {
        const entries = await getWeightRepository().getAll()
        return entries.length
      }).toBe(1)

      // Now the button should show 65
      const updatedButton = page.getByRole('button', { name: '65 kg' })
      await expect.element(updatedButton).toBeVisible()

      // Open the modal again - presets should now be centered around 65
      await updatedButton.click()
      await modalPO.waitForOpen()

      // The selected preset should show 65, not 80
      const selectedPreset = page.getByTestId('preset-selected')
      await expect.element(selectedPreset).toBeVisible()

      const selectedElement = await selectedPreset.element()
      const selectedText = selectedElement.textContent?.trim()
      expect(selectedText).toContain('65')

      // Presets around 65 should exist
      await expect.element(page.getByRole('option', { name: /^62\.5/ })).toBeVisible()
      await expect.element(page.getByRole('option', { name: /^67\.5/ })).toBeVisible()

      await modalPO.clickCancel()
      cleanup()
    })

    it('syncs presets when value changes while modal is closed', async () => {
      // This tests the specific bug where:
      // 1. Modal mounts with default value (80)
      // 2. Entries load asynchronously, value changes to saved weight
      // 3. Modal should show presets centered around saved weight, not 80

      const { navigateTo, cleanup } = await createTestApp()

      // Navigate to weight page (starts with default 80)
      await navigateTo({ name: RouteNames.Weight })

      // Wait for page to load with default value
      const defaultButton = page.getByRole('button', { name: '80 kg' })
      await expect.element(defaultButton).toBeVisible()

      // Simulate async data load by adding entry directly to DB
      // This mimics what happens when entries load after component mounts
      const repo = getWeightRepository()
      await repo.add(createDbWeightEntry({ weight: 100 }))

      // Trigger re-render by navigating away and back
      // (This simulates the reactive update from DB)
      await navigateTo({ name: RouteNames.Settings })
      await navigateTo({ name: RouteNames.Weight })

      // Button should now show 100
      const updatedButton = page.getByRole('button', { name: '100 kg' })
      await expect.element(updatedButton).toBeVisible()

      // Open modal - presets should be centered around 100, not 80
      await updatedButton.click()
      await modalPO.waitForOpen()

      // Verify the selected preset shows 100
      const selectedPreset = page.getByTestId('preset-selected')
      await expect.element(selectedPreset).toBeVisible()

      const selectedElement = await selectedPreset.element()
      const selectedText = selectedElement.textContent?.trim()
      expect(selectedText).toContain('100')

      await modalPO.clickCancel()
      cleanup()
    })

    it('centers presets around last saved weight after navigating away and back', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Navigate to weight page (no existing entries - defaults to 80)
      await navigateTo({ name: RouteNames.Weight })

      // Default value should be 80
      const defaultButton = page.getByRole('button', { name: '80 kg' })
      await expect.element(defaultButton).toBeVisible()

      // Open modal and enter 100kg
      await defaultButton.click()
      await modalPO.waitForOpen()
      await modalPO.enterValueAndConfirm(100)
      await modalPO.waitForClose()

      // Click save button
      const saveButton = page.getByRole('button', { name: /save/i })
      await saveButton.click()

      // Wait for save to complete
      await expect.poll(async () => {
        const entries = await getWeightRepository().getAll()
        return entries.length
      }).toBe(1)

      // Navigate away to settings (simulating "next day")
      await navigateTo({ name: RouteNames.Settings })

      // Navigate back to weight page
      await navigateTo({ name: RouteNames.Weight })

      // Button should show 100 (last saved weight)
      const weightButton = page.getByRole('button', { name: '100 kg' })
      await expect.element(weightButton).toBeVisible()

      // Open the modal - presets should be centered around 100, not 80
      await weightButton.click()
      await modalPO.waitForOpen()

      // The selected preset should show 100, not 80
      const selectedPreset = page.getByTestId('preset-selected')
      await expect.element(selectedPreset).toBeVisible()

      const selectedElement = await selectedPreset.element()
      const selectedText = selectedElement.textContent?.trim()
      expect(selectedText).toContain('100')

      // Presets around 100 should exist (e.g., 97.5 and 102.5)
      await expect.element(page.getByRole('option', { name: /^97\.5/ })).toBeVisible()
      await expect.element(page.getByRole('option', { name: /^102\.5/ })).toBeVisible()

      await modalPO.clickCancel()
      cleanup()
    })
  })
})
