import type { DataManagementRepository, ExportDataContents } from '@/db/interfaces'
import { normalizeDbHabit } from '@/db/converters'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

async function clearTables(tables: ReadonlyArray<{ clear(): Promise<void> }>): Promise<void> {
  await Promise.all(tables.map((table) => table.clear()))
}

function bulkAddIfPresent<T>(
  values: ReadonlyArray<T> | undefined,
  bulkAdd: (items: Array<T>) => Promise<unknown>,
): Promise<unknown> {
  return values && values.length > 0 ? bulkAdd([...values]) : Promise.resolve()
}

export function createDexieDataManagementRepository(
  database: WorkoutTrackerDatabase,
): DataManagementRepository {
  // Tables covered by export/import backups. Kept separate from the full
  // wipe list below so importAll's semantics (restore exactly what the
  // backup contains) don't change if the wipe list grows.
  const backupTables = [
    database.settings,
    database.customExercises,
    database.templates,
    database.workouts,
    database.benchmarks,
    database.activeWorkout,
    database.activeBenchmark,
    database.weightEntries,
    database.drafts,
    database.onboarding,
    database.habits,
    database.habitEntries,
    database.nutritionGoals,
    database.foods,
    database.nutritionDiaryEntries,
    database.progressions,
    database.progressionSessions,
  ] as const

  // Every table in the schema, for a full wipe (Settings > Delete All Data).
  // Taken live from the Dexie schema so tables added in future versions are
  // wiped automatically — a hand-maintained list previously missed
  // progressions/progressionSessions (added in schema version 5), silently
  // leaving progression data behind after "delete all data" (UX review).
  const allTables = database.tables

  return {
    async exportAll(): Promise<ExportDataContents> {
      const [
        settings,
        customExercises,
        templates,
        workouts,
        benchmarks,
        weightEntries,
        storedHabits,
        habitEntries,
        nutritionGoals,
        foods,
        nutritionDiaryEntries,
        progressions,
        progressionSessions,
      ] = await Promise.all([
        database.settings.toArray(),
        database.customExercises.toArray(),
        database.templates.toArray(),
        database.workouts.toArray(),
        database.benchmarks.toArray(),
        database.weightEntries.toArray(),
        database.habits.toArray(),
        database.habitEntries.toArray(),
        database.nutritionGoals.toArray(),
        database.foods.toArray(),
        database.nutritionDiaryEntries.toArray(),
        database.progressions.toArray(),
        database.progressionSessions.toArray(),
      ])

      return {
        settings,
        customExercises,
        templates,
        workouts,
        benchmarks,
        weightEntries,
        habits: storedHabits.map(normalizeDbHabit),
        habitEntries,
        nutritionGoals,
        foods,
        nutritionDiaryEntries,
        progressions,
        progressionSessions,
      }
    },

    async importAll(data: ExportDataContents): Promise<void> {
      await database.transaction('rw', backupTables, async () => {
        await clearTables(backupTables)

        const {
          settings,
          customExercises,
          templates,
          workouts,
          benchmarks,
          weightEntries,
          habits,
          habitEntries,
          nutritionGoals,
          foods,
          nutritionDiaryEntries,
          progressions,
          progressionSessions,
        } = data

        await Promise.all([
          bulkAddIfPresent(settings, (items) => database.settings.bulkAdd(items)),
          bulkAddIfPresent(customExercises, (items) => database.customExercises.bulkAdd(items)),
          bulkAddIfPresent(templates, (items) => database.templates.bulkAdd(items)),
          bulkAddIfPresent(workouts, (items) => database.workouts.bulkAdd(items)),
          bulkAddIfPresent(benchmarks, (items) => database.benchmarks.bulkAdd(items)),
          bulkAddIfPresent(weightEntries, (items) => database.weightEntries.bulkAdd(items)),
          bulkAddIfPresent(habits, (items) => database.habits.bulkAdd(items)),
          bulkAddIfPresent(habitEntries, (items) => database.habitEntries.bulkAdd(items)),
          bulkAddIfPresent(nutritionGoals, (items) => database.nutritionGoals.bulkAdd(items)),
          bulkAddIfPresent(foods, (items) => database.foods.bulkAdd(items)),
          bulkAddIfPresent(nutritionDiaryEntries, (items) =>
            database.nutritionDiaryEntries.bulkAdd(items),
          ),
          bulkAddIfPresent(progressions, (items) => database.progressions.bulkAdd(items)),
          bulkAddIfPresent(progressionSessions, (items) =>
            database.progressionSessions.bulkAdd(items),
          ),
        ])
      })
    },

    async deleteAll(options?: { preserveOnboarding?: boolean }): Promise<void> {
      const { preserveOnboarding = true } = options ?? {}

      // Preserve onboarding state - users shouldn't have to re-onboard after deleting data
      const onboardingData = preserveOnboarding ? await database.onboarding.toArray() : []

      await database.transaction('rw', allTables, async () => {
        await clearTables(allTables)
        // Restore onboarding state if requested
        if (onboardingData.length > 0) {
          await database.onboarding.bulkAdd(onboardingData)
        }
      })
    },
  }
}
