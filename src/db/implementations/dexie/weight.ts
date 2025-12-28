import type { WeightRepository } from '@/db/interfaces'
import type { DbWeightEntry } from '@/db/schema'
import type { WorkoutTrackerDb } from './database'

/**
 * Get the start of day timestamp for a given date.
 * Used for one-entry-per-day deduplication.
 */
function getStartOfDay(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function createDexieWeightRepository(db: WorkoutTrackerDb): WeightRepository {
  return {
    async add(entry: Readonly<DbWeightEntry>): Promise<void> {
      // Check if entry for this date already exists
      const existing = await db.weightEntries.where('date').equals(entry.date).first()

      if (existing) {
        // Replace existing entry for the same day
        await db.weightEntries.delete(existing.id)
      }

      await db.weightEntries.add(entry)
    },

    async getAll(): Promise<ReadonlyArray<DbWeightEntry>> {
      return db.weightEntries.orderBy('date').reverse().toArray()
    },

    async getByDateRange(startDate: Date, endDate: Date): Promise<ReadonlyArray<DbWeightEntry>> {
      const startTimestamp = getStartOfDay(startDate)
      const endTimestamp = getStartOfDay(endDate)

      return db.weightEntries
        .where('date')
        .between(startTimestamp, endTimestamp, true, true)
        .reverse()
        .toArray()
    },

    async getLatest(): Promise<DbWeightEntry | undefined> {
      return db.weightEntries.orderBy('date').reverse().first()
    },

    async getByDate(date: Date): Promise<DbWeightEntry | undefined> {
      const timestamp = getStartOfDay(date)
      return db.weightEntries.where('date').equals(timestamp).first()
    },

    async delete(id: string): Promise<void> {
      await db.weightEntries.delete(id)
    },
  }
}
