import { liveQuery } from 'dexie'
import type { LiveQuery, WeightRepository } from '@/db/interfaces'
import type { DbWeightEntry } from '@/db/schema'
import { getStartOfDay } from '@/lib/date'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

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

    async upsertForDate(entry: Readonly<DbWeightEntry>): Promise<void> {
      await database.transaction('rw', database.weightEntries, async () => {
        const rowsForDate = await database.weightEntries.where('date').equals(entry.date).toArray()

        // Total-order comparator (recordedAt desc, id desc tie-break) so the
        // "most recent" row is deterministic even when two rows share a
        // recordedAt millisecond -- see the repository comparator brain note.
        const [mostRecent] = rowsForDate.toSorted(
          (a, b) => b.recordedAt - a.recordedAt || (b.id < a.id ? -1 : Number(b.id > a.id)),
        )

        await database.weightEntries.put(mostRecent ? { ...entry, id: mostRecent.id } : entry)
      })
    },

    async delete(id: string): Promise<void> {
      await database.weightEntries.delete(id)
    },
  }
}
