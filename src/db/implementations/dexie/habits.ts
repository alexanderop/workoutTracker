import type { HabitRepository } from '@/db/interfaces'
import type { DbHabit, DbHabitEntry } from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

/**
 * Active (non-archived) habits ordered for display.
 * Fetched as a full table scan + JS filter/sort rather than an indexed
 * `archivedAt` query -- same approach `templates.ts` uses for `lastUsedAt`,
 * since IndexedDB's handling of `null` as an index key is inconsistent
 * across browsers.
 */
function queryActiveHabits(database: WorkoutTrackerDatabase): Promise<ReadonlyArray<DbHabit>> {
  return database.habits
    .toArray()
    .then((habits) =>
      habits
        .filter((habit) => habit.archivedAt === null)
        .toSorted((a, b) => a.orderIndex - b.orderIndex),
    )
}

export function createDexieHabitsRepository(database: WorkoutTrackerDatabase): HabitRepository {
  return {
    async getAllHabits(): Promise<ReadonlyArray<DbHabit>> {
      return queryActiveHabits(database)
    },

    async getArchivedHabits(): Promise<ReadonlyArray<DbHabit>> {
      const habits = await database.habits.toArray()
      // Type-predicate filter narrows `archivedAt` to `number`, so the sort
      // below needs no `?? 0` fallback -- every habit here was just proven
      // to have a real archivedAt.
      return habits
        .filter((habit): habit is DbHabit & { archivedAt: number } => habit.archivedAt !== null)
        .toSorted((a, b) => b.archivedAt - a.archivedAt)
    },

    async getHabitById(id: string): Promise<DbHabit | undefined> {
      return database.habits.get(id)
    },

    async addHabit(habit: Readonly<DbHabit>): Promise<void> {
      await database.habits.add(habit)
    },

    async updateHabit(
      id: string,
      updates: Partial<Omit<DbHabit, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const updated = await database.habits.update(id, updates)
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update habit')
      }
    },

    async archiveHabit(id: string): Promise<void> {
      const updated = await database.habits.update(id, { archivedAt: Date.now() })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'archive habit')
      }
    },

    async unarchiveHabit(id: string): Promise<void> {
      const updated = await database.habits.update(id, { archivedAt: null })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'unarchive habit')
      }
    },

    async reorderHabits(ids: ReadonlyArray<string>): Promise<void> {
      await database.transaction('rw', database.habits, async () => {
        await Promise.all(ids.map((id, index) => database.habits.update(id, { orderIndex: index })))
      })
    },

    async upsertEntry(entry: Readonly<DbHabitEntry>): Promise<void> {
      const existing = await database.habitEntries
        .where('[habitId+date]')
        .equals([entry.habitId, entry.date])
        .first()

      if (existing) {
        await database.habitEntries.delete(existing.id)
      }

      await database.habitEntries.add(entry)
    },

    async deleteEntry(id: string): Promise<void> {
      await database.habitEntries.delete(id)
    },

    async clearEntryForDay(habitId: string, date: number): Promise<void> {
      await database.habitEntries.where('[habitId+date]').equals([habitId, date]).delete()
    },

    async getEntriesForHabit(habitId: string): Promise<ReadonlyArray<DbHabitEntry>> {
      return database.habitEntries.where('habitId').equals(habitId).sortBy('date')
    },

    async getEntriesInRange(from: number, to: number): Promise<ReadonlyArray<DbHabitEntry>> {
      return database.habitEntries.where('date').between(from, to, true, true).sortBy('date')
    },

    async getEntriesForDay(date: number): Promise<ReadonlyArray<DbHabitEntry>> {
      return database.habitEntries.where('date').equals(date).toArray()
    },
  }
}
