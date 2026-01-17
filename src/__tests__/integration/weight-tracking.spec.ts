import { page } from '../helpers/locator'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { RouteNames } from '@/router'
import { getWeightRepository } from '@/db'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbWeightEntriesForDays as createDatabaseWeightEntriesForDays } from '../factories/dbWeightEntry.factory'

describe('Weight Tracking', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('adding weight entries', () => {
    it('saves entry and displays in history list', async () => {
      const { navigateTo, weight, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // Add a weight entry
      await weight.addEntry('75.5')

      // Verify entry was saved to database
      const repo = getWeightRepository()
      const entries = await repo.getAll()
      expect(entries).toHaveLength(1)
      expect(entries[0]?.weight).toBe(75.5)

      // Verify weight is displayed on page (stats and history)
      await expect.element(page.getByText('75.5 kg').first()).toBeVisible()

      cleanup()
    })

    it('preserves entered weight as default after first entry', async () => {
      const { navigateTo, weight, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // No entries exist - form defaults to 80kg
      // User enters 100kg and saves
      await weight.addEntry('100')

      // After saving, form should show 100 (the value just entered)
      // NOT 80 (the hardcoded default)
      const input = page.getByRole('spinbutton', { name: /weight/i })
      await expect.element(input).toHaveValue('100')

      cleanup()
    })

    it('shows last saved weight after navigating away and back', async () => {
      const { navigateTo, weight, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // Add entry of 100kg
      await weight.addEntry('100')

      // Navigate away to a different page
      await navigateTo({ name: RouteNames.Settings })

      // Navigate back to weight page
      await navigateTo({ name: RouteNames.Weight })

      // Form should show 100 (from database), NOT 80 (default)
      const input = page.getByRole('spinbutton', { name: /weight/i })
      await expect.element(input).toHaveValue('100')

      cleanup()
    })

    it('replaces same-day entry with newest value', async () => {
      const { navigateTo, weight, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // Add first entry
      await weight.addEntry('75')

      // Verify entry was saved
      await expect.poll(async () => {
        const entries = await getWeightRepository().getAll()
        return entries.length
      }).toBe(1)

      // Add second entry for same day - this should replace the first
      await weight.addEntry('76')

      // Verify database has only one entry with newest value
      const repo = getWeightRepository()
      await expect.poll(async () => {
        const entries = await repo.getAll()
        return entries.length
      }).toBe(1)

      const entries = await repo.getAll()
      expect(entries[0]?.weight).toBe(76)

      cleanup()
    })

    it('respects weight unit setting (lbs)', async () => {
      const { navigateTo, weight, cleanup } = await createTestApp()

      // Set preference to lbs first
      await navigateTo({ name: RouteNames.Settings })
      await page.getByRole('button', { name: /pounds/i }).click()

      // Navigate to weight
      await navigateTo({ name: RouteNames.Weight })

      // Add entry in lbs (220 lbs ≈ 99.79 kg)
      await weight.addEntry('220')

      // Verify stored internally as kg (220 lbs = 99.79 kg)
      const repo = getWeightRepository()
      await expect.poll(async () => {
        const entries = await repo.getAll()
        return entries.length
      }).toBe(1)

      const entries = await repo.getAll()
      expect(entries[0]?.weight).toBeCloseTo(99.79, 1)

      cleanup()
    })
  })

  describe('stats and data operations', () => {
    it('calculates stats from seeded data', async () => {
      // Seed data: entries over the past week
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      const entries = createDatabaseWeightEntriesForDays(startDate, [74, 74.5, 75, 75.5, 76, 75.8, 75.5, 75])

      const repo = getWeightRepository()
      for (const entry of entries) {
        await repo.add(entry)
      }

      // Verify database has all entries
      const allEntries = await repo.getAll()
      expect(allEntries).toHaveLength(8)

      // Verify most recent entry (75 kg from today)
      const latest = await repo.getLatest()
      expect(latest?.weight).toBe(75)

      // Verify oldest entry (74 kg from 7 days ago)
      expect(allEntries.at(-1)?.weight).toBe(74)
    })

    it('filters entries by time range in repository', async () => {
      // Seed data: 40 days of entries
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 40)
      const weights = Array.from({ length: 41 }, (_, index) => 70 + index * 0.1)
      const entries = createDatabaseWeightEntriesForDays(startDate, weights)

      const repo = getWeightRepository()
      for (const entry of entries) {
        await repo.add(entry)
      }

      // Verify all entries are stored
      const allEntries = await repo.getAll()
      expect(allEntries).toHaveLength(41)

      // Verify date range filtering works (7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentEntries = await repo.getByDateRange(sevenDaysAgo, new Date())
      expect(recentEntries.length).toBeGreaterThan(0)
      expect(recentEntries.length).toBeLessThan(41)
    })
  })

  describe('chart visualization', () => {
    it('shows time range tabs when entries exist', async () => {
      const { navigateTo, weight, cleanup } = await createTestApp()

      // Add an entry first via UI
      await navigateTo({ name: RouteNames.Weight })
      await weight.addEntry('75')

      // Verify time range tabs are visible
      await expect.element(page.getByRole('tab', { name: '7D' })).toBeVisible()
      await expect.element(page.getByRole('tab', { name: '30D' })).toBeVisible()
      await expect.element(page.getByRole('tab', { name: '90D' })).toBeVisible()
      await expect.element(page.getByRole('tab', { name: 'All' })).toBeVisible()

      cleanup()
    })
  })

  describe('deleting entries', () => {
    it('removes entry after confirmation', async () => {
      const { navigateTo, weight, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // Add entry via UI
      await weight.addEntry('80')

      // Verify entry was saved
      const repo = getWeightRepository()
      await expect.poll(async () => (await repo.getAll()).length).toBe(1)

      // Click delete and confirm
      await weight.clickDeleteButton(0)
      await weight.confirmDelete()

      // Verify database is empty
      await expect.poll(async () => (await repo.getAll()).length).toBe(0)

      // Verify empty state is shown
      await expect.element(weight.getEmptyState()).toBeVisible()

      cleanup()
    })

    it('keeps entry when delete is cancelled', async () => {
      const { navigateTo, weight, cleanup } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // Add entry via UI
      await weight.addEntry('82')

      // Verify entry was saved
      const repo = getWeightRepository()
      await expect.poll(async () => (await repo.getAll()).length).toBe(1)

      // Click delete but cancel
      await weight.clickDeleteButton(0)
      await weight.cancelDelete()

      // Verify database still has entry
      await expect.poll(async () => (await repo.getAll()).length).toBe(1)

      cleanup()
    })
  })
})
