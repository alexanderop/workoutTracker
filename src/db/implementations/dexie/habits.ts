import { liveQuery } from 'dexie'
import type { HabitRepository, HabitSnapshot, LiveQuery } from '@/db/interfaces'
import type { DbHabit, DbHabitEntry } from '@/db/schema'
import { normalizeDbHabit } from '@/db/converters'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

/**
 * Active (non-archived) habits ordered for display.
 * Fetched as a full table scan + JS filter/sort rather than an indexed
 * `archivedAt` query -- same approach `templates.ts` uses for `lastUsedAt`,
 * since IndexedDB's handling of `null` as an index key is inconsistent
 * across browsers.
 */
function queryAllHabits(database: WorkoutTrackerDatabase): Promise<ReadonlyArray<DbHabit>> {
  return database.habits
    .toArray()
    .then((habits) =>
      habits
        .map(normalizeDbHabit)
        .toSorted(
          (a, b) =>
            a.orderIndex - b.orderIndex ||
            a.createdAt - b.createdAt ||
            (a.id < b.id ? -1 : Number(a.id > b.id)),
        ),
    )
}

async function queryActiveHabits(
  database: WorkoutTrackerDatabase,
): Promise<ReadonlyArray<DbHabit>> {
  return (await queryAllHabits(database)).filter((habit) => habit.archivedAt === null)
}

async function queryHabitSnapshot(database: WorkoutTrackerDatabase): Promise<HabitSnapshot> {
  const [habits, entries] = await Promise.all([
    queryAllHabits(database),
    database.habitEntries.orderBy('date').toArray(),
  ])
  return { habits, entries }
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
        .map(normalizeDbHabit)
        .filter((habit): habit is DbHabit & { archivedAt: number } => habit.archivedAt !== null)
        .toSorted((a, b) => b.archivedAt - a.archivedAt)
    },

    async getHabitById(id: string): Promise<DbHabit | undefined> {
      const habit = await database.habits.get(id)
      return habit ? normalizeDbHabit(habit) : undefined
    },

    observeAll(): LiveQuery<HabitSnapshot> {
      const run = () => queryHabitSnapshot(database)
      return {
        get: run,
        subscribe(onChange: (snapshot: HabitSnapshot) => void) {
          const subscription = liveQuery(run).subscribe({ next: onChange })
          return () => subscription.unsubscribe()
        },
      }
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
      await database.transaction('rw', database.habits, async () => {
        const activeHabits = (await database.habits.toArray()).filter(
          (habit) => habit.archivedAt === null,
        )
        const orderIndex =
          activeHabits.reduce((maximum, habit) => Math.max(maximum, habit.orderIndex), -1) + 1
        const updated = await database.habits.update(id, { archivedAt: null, orderIndex })
        if (updated === 0) {
          throw createDatabaseError('NOT_FOUND', 'unarchive habit')
        }
      })
    },

    async reorderHabits(ids: ReadonlyArray<string>): Promise<void> {
      await database.transaction('rw', database.habits, async () => {
        await Promise.all(ids.map((id, index) => database.habits.update(id, { orderIndex: index })))
      })
    },

    async upsertEntry(entry: Readonly<DbHabitEntry>): Promise<void> {
      await database.transaction('rw', database.habitEntries, async () => {
        await database.habitEntries
          .where('[habitId+date]')
          .equals([entry.habitId, entry.date])
          .delete()
        await database.habitEntries.put(entry)
      })
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
