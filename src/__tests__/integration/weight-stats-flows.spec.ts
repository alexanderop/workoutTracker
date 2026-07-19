import { page } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getWeightRepository } from '@/db'
import {
  createDbWeightEntriesForDays as createDatabaseWeightEntriesForDays,
  createDbWeightEntryForDate as createDatabaseWeightEntryForDate,
} from '../factories/dbWeightEntry.factory'

/**
 * Returns a Date N days before today. Used to seed a realistic weigh-in
 * history for a user who has been tracking for a while.
 */
function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

describe('Weight Stats Flows', () => {
  describe('stats summary after a week of tracking', () => {
    it('shows current weight, positive 7-day change and upward trend after logging a gain', async ({
      createTestApp,
    }) => {
      // A user has weighed in daily for the past week, gaining steadily.
      const repo = getWeightRepository()
      const history = createDatabaseWeightEntriesForDays(
        daysAgo(7),
        [74, 74.5, 75, 75.5, 76, 76.5, 77],
      )
      for (const entry of history) {
        await repo.add(entry)
      }

      const { navigateTo, weight } = await createTestApp()
      await navigateTo({ name: RouteNames.Weight })

      // Today's weigh-in continues the upward trend.
      await weight.addEntry('77.5')

      // Current weight is shown in the stats summary (and history).
      await expect.element(page.getByText('77.5 kg').first()).toBeVisible()

      // The 7-day change compares against the entry closest to a week ago
      // (75 kg, five days back is within the matching tolerance): +2.5 kg.
      await expect.element(page.getByText(/7-day change/i)).toBeVisible()
      await expect.element(page.getByText('+2.5 kg')).toBeVisible()

      // Rising average over the last entries reads as "trending up".
      await expect.element(page.getByText(/trending up/i)).toBeInTheDocument()
    })

    it('shows negative 7-day change and downward trend after a week of losses', async ({
      createTestApp,
    }) => {
      // A user on a cut opens the weight page to review progress.
      const repo = getWeightRepository()
      const history = createDatabaseWeightEntriesForDays(
        daysAgo(7),
        [80, 79.5, 79, 78.5, 78, 77.5, 77, 76.5],
      )
      for (const entry of history) {
        await repo.add(entry)
      }

      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.Weight })

      // Current weight (today's entry) is shown.
      await expect.element(page.getByText('76.5 kg').first()).toBeVisible()

      // Change vs ~a week ago (79 kg): -2.5 kg, rendered with a minus sign.
      await expect.element(page.getByText('-2.5 kg')).toBeVisible()

      // Falling average reads as "trending down".
      await expect.element(page.getByText(/trending down/i)).toBeInTheDocument()
    })

    it('shows a stable trend when weight barely moves', async ({ createTestApp }) => {
      // A user maintaining their weight sees a stable trend, not up/down noise.
      const repo = getWeightRepository()
      const history = createDatabaseWeightEntriesForDays(
        daysAgo(5),
        [75.2, 74.9, 75.1, 75, 75.1, 75],
      )
      for (const entry of history) {
        await repo.add(entry)
      }

      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.Weight })

      // Current weight is today's 75 kg entry (rendered with one decimal).
      await expect.element(page.getByText('75.0 kg').first()).toBeVisible()

      // Tiny fluctuation vs ~a week ago (75.2 kg) still shows a change value...
      await expect.element(page.getByText('-0.2 kg')).toBeVisible()

      // ...but the trend is announced as stable.
      await expect.element(page.getByText(/stable/i)).toBeInTheDocument()
    })
  })

  describe('stats summary with a short history', () => {
    it('hides the 7-day change while history is too short to compare', async ({
      createTestApp,
    }) => {
      // A user who started tracking four days ago has no week-old entry to
      // compare against, and not enough data for a trend yet.
      const repo = getWeightRepository()
      const history = createDatabaseWeightEntriesForDays(daysAgo(3), [78, 78.2, 78.1, 78.3])
      for (const entry of history) {
        await repo.add(entry)
      }

      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.Weight })

      // Current weight still shows...
      await expect.element(page.getByText('78.3 kg').first()).toBeVisible()

      // ...but the 7-day change section stays hidden.
      await expect.element(page.getByText(/7-day change/i)).not.toBeInTheDocument()
    })
  })

  describe('chart time ranges', () => {
    it('filters the chart data when switching time ranges', async ({ createTestApp }) => {
      // A long-time user has sparse entries spread over the last ~45 days.
      const repo = getWeightRepository()
      const seededEntries = [
        createDatabaseWeightEntryForDate(daysAgo(45), 80),
        createDatabaseWeightEntryForDate(daysAgo(40), 80.5),
        createDatabaseWeightEntryForDate(daysAgo(20), 81),
        createDatabaseWeightEntryForDate(daysAgo(15), 81.5),
        createDatabaseWeightEntryForDate(daysAgo(10), 82),
      ]
      for (const entry of seededEntries) {
        await repo.add(entry)
      }

      const { navigateTo, weight } = await createTestApp()
      await navigateTo({ name: RouteNames.Weight })

      // Default range is 30D: only the three recent entries are charted.
      await expect.element(page.getByRole('img', { name: /3 data points/i })).toBeVisible()

      // 7D has no entries at all - the chart shows the empty-period message.
      await weight.selectTimeRange('7D')
      await expect.element(page.getByText(/no data for this period/i)).toBeVisible()

      // "All" brings back the complete history.
      await weight.selectTimeRange('All')
      await expect.element(page.getByRole('img', { name: /5 data points/i })).toBeVisible()

      // 90D also covers every seeded entry.
      await weight.selectTimeRange('90D')
      await expect.element(page.getByRole('img', { name: /5 data points/i })).toBeVisible()
    })
  })
})
