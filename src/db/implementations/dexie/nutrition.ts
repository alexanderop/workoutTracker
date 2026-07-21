import { liveQuery } from 'dexie'
import type { LiveQuery, NutritionRepository, NutritionSnapshot } from '@/db/interfaces'
import type { DbFood, DbNutritionDiaryEntry, DbNutritionGoal } from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

const foodNameCollator = new Intl.Collator()

async function queryDay(
  database: WorkoutTrackerDatabase,
  localDate: string,
): Promise<NutritionSnapshot> {
  const [goal, foods, diaryEntries] = await Promise.all([
    database.nutritionGoals.get('current'),
    database.foods.toArray(),
    database.nutritionDiaryEntries.where('localDate').equals(localDate).sortBy('loggedAt'),
  ])

  return {
    goal,
    foods: foods
      .filter((food) => food.archivedAt === null)
      .toSorted(
        (a, b) =>
          (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0) || foodNameCollator.compare(a.name, b.name),
      ),
    diaryEntries,
  }
}

export function createDexieNutritionRepository(
  database: WorkoutTrackerDatabase,
): NutritionRepository {
  return {
    observeDay(localDate: string): LiveQuery<NutritionSnapshot> {
      const run = () => queryDay(database, localDate)
      return {
        get: run,
        subscribe(onChange: (snapshot: NutritionSnapshot) => void) {
          const subscription = liveQuery(run).subscribe({ next: onChange })
          return () => subscription.unsubscribe()
        },
      }
    },

    observeRange(
      startLocalDate: string,
      endLocalDate: string,
    ): LiveQuery<ReadonlyArray<DbNutritionDiaryEntry>> {
      const run = () =>
        database.nutritionDiaryEntries
          .where('localDate')
          .between(startLocalDate, endLocalDate, true, true)
          .toArray()
      return {
        get: run,
        subscribe(onChange: (entries: ReadonlyArray<DbNutritionDiaryEntry>) => void) {
          const subscription = liveQuery(run).subscribe({ next: onChange })
          return () => subscription.unsubscribe()
        },
      }
    },

    async saveGoal(goal: Readonly<DbNutritionGoal>): Promise<void> {
      await database.nutritionGoals.put(goal)
    },

    async addFood(food: Readonly<DbFood>): Promise<void> {
      await database.foods.add(food)
    },

    async addFoodAndDiaryEntry(
      food: Readonly<DbFood>,
      entry: Readonly<DbNutritionDiaryEntry>,
    ): Promise<void> {
      await database.transaction('rw', database.foods, database.nutritionDiaryEntries, async () => {
        await database.foods.add(food)
        await database.nutritionDiaryEntries.add(entry)
      })
    },

    async updateFood(
      id: string,
      updates: Partial<Omit<DbFood, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const updated = await database.foods.update(id, updates)
      if (updated === 0) throw createDatabaseError('NOT_FOUND', 'update food')
    },

    async addDiaryEntry(entry: Readonly<DbNutritionDiaryEntry>): Promise<void> {
      await database.transaction('rw', database.nutritionDiaryEntries, database.foods, async () => {
        await database.nutritionDiaryEntries.add(entry)
        if (entry.foodId) {
          await database.foods.update(entry.foodId, { lastUsedAt: entry.loggedAt })
        }
      })
    },

    async deleteDiaryEntry(id: string): Promise<void> {
      await database.nutritionDiaryEntries.delete(id)
    },
  }
}
