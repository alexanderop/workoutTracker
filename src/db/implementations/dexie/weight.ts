import { liveQuery } from 'dexie'
import type { LiveQuery, WeightRepository } from '@/db/interfaces'
import type { DbWeightEntry } from '@/db/schema'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

/**
 * Get the start of day timestamp for a given date.
 * Used for one-entry-per-day deduplication.
 */
function getStartOfDay(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Shared query logic for `getAll()` and `observeEntries()` so both read the
 * same ordering (newest first).
 */
function queryAll(database: WorkoutTrackerDatabase): Promise<ReadonlyArray<DbWeightEntry>> {
  return database.weightEntries.orderBy('date').reverse().toArray()
}

export function createDexieWeightRepository(database: WorkoutTrackerDatabase): WeightRepository {
  return {
    async add(entry: Readonly<DbWeightEntry>): Promise<void> {
      // Check if entry for this date already exists
      const existing = await database.weightEntries.where('date').equals(entry.date).first()

      if (existing) {
        // Replace existing entry for the same day
        await database.weightEntries.delete(existing.id)
      }

      await database.weightEntries.add(entry)
    },

    async getAll(): Promise<ReadonlyArray<DbWeightEntry>> {
      return queryAll(database)
    },

    observeEntries(): LiveQuery<ReadonlyArray<DbWeightEntry>> {
      const run = () => queryAll(database)
      return {
        get: () => run(),
        subscribe(onChange: (value: ReadonlyArray<DbWeightEntry>) => void) {
          const subscription = liveQuery(run).subscribe({ next: onChange })
          return () => subscription.unsubscribe()
        },
      }
    },

    async getByDateRange(startDate: Date, endDate: Date): Promise<ReadonlyArray<DbWeightEntry>> {
      const startTimestamp = getStartOfDay(startDate)
      const endTimestamp = getStartOfDay(endDate)

      return database.weightEntries
        .where('date')
        .between(startTimestamp, endTimestamp, true, true)
        .reverse()
        .toArray()
    },

    async getLatest(): Promise<DbWeightEntry | undefined> {
      return database.weightEntries.orderBy('date').reverse().first()
    },

    async getByDate(date: Date): Promise<DbWeightEntry | undefined> {
      const timestamp = getStartOfDay(date)
      return database.weightEntries.where('date').equals(timestamp).first()
    },

    async delete(id: string): Promise<void> {
      await database.weightEntries.delete(id)
    },
  }
}
