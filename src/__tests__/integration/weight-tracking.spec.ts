import { page } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getWeightRepository } from '@/db'
import { createDbWeightEntriesForDays as createDatabaseWeightEntriesForDays } from '../factories/dbWeightEntry.factory'

describe('Weight Tracking', () => {
  describe('adding weight entries', () => {
    it('saves entry and displays in history list', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

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
    })

    it('preserves entered weight as default after first entry', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // No entries exist - form defaults to 80kg
      // User enters 100kg and saves
      await weight.addEntry('100')

      // After saving, form should show 100 (the value just entered)
      // NOT 80 (the hardcoded default)
      const input = page.getByRole('spinbutton', { name: /weight/i })
      await expect.element(input).toHaveValue('100')
    })

    it('shows last saved weight after navigating away and back', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

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
    })

    it('replaces same-day entry with newest value', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // Add first entry
      await weight.addEntry('75')

      // Verify entry was saved
      await expect
        .poll(async () => {
          const entries = await getWeightRepository().getAll()
          return entries.length
        })
        .toBe(1)

      // Add second entry for same day - this should replace the first
      await weight.addEntry('76')

      // Verify database has only one entry with newest value
      const repo = getWeightRepository()
      await expect
        .poll(async () => {
          const entries = await repo.getAll()
          return entries.length
        })
        .toBe(1)

      const entries = await repo.getAll()
      expect(entries[0]?.weight).toBe(76)
    })

    it('saves a two-decimal weight instead of snapping it to the input step', async ({
      createTestApp,
    }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // A scale reading like 116.25 sits between the 0.5 steps of the +/- buttons.
      await weight.addEntry('116.25')

      await expect
        .poll(async () => {
          const entries = await getWeightRepository().getAll()
          return entries[0]?.weight
        })
        .toBe(116.25)

      // Stats and history must show what was entered, not a rounded stand-in.
      await expect.element(page.getByText('116.25 kg').first()).toBeVisible()
    })

    it('saves a two-decimal weight in lbs without losing the quarter pound', async ({
      createTestApp,
    }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Settings })
      await page.getByRole('button', { name: /pounds/i }).click()

      await navigateTo({ name: RouteNames.Weight })
      await weight.addEntry('116.25')

      await expect
        .poll(async () => {
          const entries = await getWeightRepository().getAll()
          return entries.length
        })
        .toBe(1)

      await expect.element(page.getByText('116.25 lbs').first()).toBeVisible()
    })

    it('respects weight unit setting (lbs)', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

      // Set preference to lbs first
      await navigateTo({ name: RouteNames.Settings })
      await page.getByRole('button', { name: /pounds/i }).click()

      // Navigate to weight
      await navigateTo({ name: RouteNames.Weight })

      // Add entry in lbs (220 lbs ≈ 99.79 kg)
      await weight.addEntry('220')

      // Verify stored internally as kg (220 lbs = 99.79 kg)
      const repo = getWeightRepository()
      await expect
        .poll(async () => {
          const entries = await repo.getAll()
          return entries.length
        })
        .toBe(1)

      const entries = await repo.getAll()
      expect(entries[0]?.weight).toBeCloseTo(99.79, 1)
    })
  })

  describe('stats and data operations', () => {
    it('calculates stats from seeded data', async () => {
      // Seed data: entries over the past week
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      const entries = createDatabaseWeightEntriesForDays(
        startDate,
        [74, 74.5, 75, 75.5, 76, 75.8, 75.5, 75],
      )

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
    it('shows time range tabs when entries exist', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

      // Add an entry first via UI
      await navigateTo({ name: RouteNames.Weight })
      await weight.addEntry('75')

      // Verify time range tabs are visible
      await expect.element(page.getByRole('tab', { name: '7D' })).toBeVisible()
      await expect.element(page.getByRole('tab', { name: '30D' })).toBeVisible()
      await expect.element(page.getByRole('tab', { name: '90D' })).toBeVisible()
      await expect.element(page.getByRole('tab', { name: 'All' })).toBeVisible()
    })

    it('shows the unit alongside the weight for a single data point', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })
      await weight.addEntry('80')

      // With only one entry, the chart falls back to a single-value display
      // (distinct from the stats summary, which already shows the unit).
      // It must show the unit too, not just the bare number.
      await expect
        .poll(() => {
          // eslint-disable-next-line no-restricted-syntax -- Chart's single-value display has no accessible label of its own
          const chartValue = document.querySelector('.text-3xl.font-semibold')
          return chartValue?.textContent?.trim()
        })
        .toBe('80 kg')
    })
  })

  describe('outlier confirmation', () => {
    it('saves the first entry immediately without asking for confirmation', async ({
      createTestApp,
    }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // Even a wild first entry should save immediately - there's nothing to compare against.
      await weight.addEntry('500')

      await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)
      await expect.element(weight.getOutlierConfirmBanner()).not.toBeInTheDocument()
    })

    it('asks for confirmation when a new entry deviates wildly from the last one', async ({
      createTestApp,
    }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      await weight.addEntry('80')
      await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)

      // 500kg is both >15kg and >20% away from 80kg
      await weight.addEntry('500')

      // Should not have saved yet - the confirmation banner is shown instead
      await expect.element(weight.getOutlierConfirmBanner()).toBeVisible()
      await expect.element(page.getByText(/80 kg/)).toBeVisible()
      const repo = getWeightRepository()
      expect(await repo.getAll()).toHaveLength(1)

      // Confirming saves the outlier value. Both entries are for "today" so the
      // same-day dedup rule replaces the first row rather than adding a second.
      await weight.confirmOutlierSave()
      await expect.poll(async () => (await repo.getAll())[0]?.weight).toBe(500)
      expect(await repo.getAll()).toHaveLength(1)
      await expect.element(weight.getOutlierConfirmBanner()).not.toBeInTheDocument()
    })

    it('does not save when the outlier confirmation is cancelled', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      await weight.addEntry('80')
      await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)

      await weight.addEntry('500')
      await expect.element(weight.getOutlierConfirmBanner()).toBeVisible()

      await weight.cancelOutlierSave()

      await expect.element(weight.getOutlierConfirmBanner()).not.toBeInTheDocument()
      const repo = getWeightRepository()
      expect(await repo.getAll()).toHaveLength(1)
      expect((await repo.getAll())[0]?.weight).toBe(80)
    })

    it('does not ask for confirmation when the change is small', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      await weight.addEntry('80')
      await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)

      // 82kg is a 2.5% / 2kg change from 80kg - well within tolerance
      await weight.addEntry('82')

      await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)
      await expect.element(weight.getOutlierConfirmBanner()).not.toBeInTheDocument()
    })
  })

  describe('deleting entries', () => {
    it('removes entry after confirmation', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

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
    })

    it('keeps entry when delete is cancelled', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

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
    })
  })
})
