import { page } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getWeightRepository } from '@/db'
import { getStartOfDay } from '@/lib/date'
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

    it('pre-fills the sheet with the saved value for today when reopened', async ({
      createTestApp,
    }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // Save today's weight through the sheet.
      await weight.addEntry('100')

      // Reopening the sheet for today should pre-fill the value just saved.
      await weight.openSheet()
      const input = page.getByLabelText('Weight', { exact: true })
      await expect.element(input).toHaveValue('100')
    })

    it('pre-fills the sheet with the saved weight after navigating away and back', async ({
      createTestApp,
    }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      // Add entry of 100kg
      await weight.addEntry('100')

      // Navigate away to a different page
      await navigateTo({ name: RouteNames.Settings })

      // Navigate back to weight page
      await navigateTo({ name: RouteNames.Weight })

      // Reopening the sheet should still show 100 (from the database).
      await weight.openSheet()
      const input = page.getByLabelText('Weight', { exact: true })
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

  describe('logging via the calendar', () => {
    it('logs a weight for a past date picked via the calendar, storing it on that date', async ({
      createTestApp,
    }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      await weight.openSheet()
      await weight.openDatePicker()
      await weight.goToPreviousMonth()
      await weight.pickDay(15)
      await weight.enterWeight('77')
      await weight.clickSave()

      await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)

      const previousMonth = new Date()
      previousMonth.setDate(1)
      previousMonth.setMonth(previousMonth.getMonth() - 1)
      const expectedDate = getStartOfDay(
        new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 15),
      )

      const [entry] = await getWeightRepository().getAll()
      expect(entry?.date).toBe(expectedDate)
      expect(entry?.weight).toBe(77)
    })

    it('logs body fat alongside weight and stores bodyFatPct', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      await weight.openSheet()
      await weight.enterWeight('80')
      await weight.enterBodyFat('18.5')
      await weight.clickSave()

      await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)

      const [entry] = await getWeightRepository().getAll()
      expect(entry?.weight).toBe(80)
      expect(entry?.bodyFatPct).toBe(18.5)
    })

    it('cannot select a date after today in the calendar', async ({ createTestApp }) => {
      const { navigateTo, weight } = await createTestApp()

      await navigateTo({ name: RouteNames.Weight })

      await weight.openSheet()
      await weight.openDatePicker()

      // Targeted by exact date value (not day-of-month) so this holds
      // regardless of whether tomorrow falls in the currently visible month
      // or rolls into the next one (e.g. when today is the last day of a month).
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowValue = [
        tomorrow.getFullYear(),
        String(tomorrow.getMonth() + 1).padStart(2, '0'),
        String(tomorrow.getDate()).padStart(2, '0'),
      ].join('-')
      // eslint-disable-next-line no-restricted-syntax -- data-value is the calendar's frozen rendered contract (see WeightLogSheet.spec.ts), targeting an exact date without reconstructing its locale-formatted accessible name
      const tomorrowCell = document.querySelector(`[data-value="${CSS.escape(tomorrowValue)}"]`)
      expect(tomorrowCell).not.toBeNull()
      expect(tomorrowCell?.hasAttribute('data-disabled')).toBe(true)

      tomorrowCell?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      // The disabled day rejects the click -- the calendar stays open
      // instead of returning to the entry form for an impossible future date.
      await expect.element(page.getByRole('group', { name: 'Select a date' })).toBeVisible()

      const entries = await getWeightRepository().getAll()
      expect(entries).toHaveLength(0)
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
