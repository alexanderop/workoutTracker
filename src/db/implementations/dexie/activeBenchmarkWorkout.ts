import type { ActiveBenchmarkWorkoutRepository } from '@/db/interfaces'
import type { DbActiveBenchmarkWorkout, DbCompletedWorkout } from '@/db/schema'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'
import { generateId } from './database'

export function createDexieActiveBenchmarkWorkoutRepository(
  database: WorkoutTrackerDatabase,
): ActiveBenchmarkWorkoutRepository {
  return {
    async load(): Promise<DbActiveBenchmarkWorkout | undefined> {
      return database.activeBenchmark.get('current-benchmark')
    },

    async save(workout: Readonly<DbActiveBenchmarkWorkout>): Promise<void> {
      await database.activeBenchmark.put({
        ...workout,
        id: 'current-benchmark',
        lastModifiedAt: Date.now(),
      })
    },

    async delete(): Promise<void> {
      await database.activeBenchmark.delete('current-benchmark')
    },

    async exists(): Promise<boolean> {
      const workout = await database.activeBenchmark.get('current-benchmark')
      return workout !== undefined
    },

    async complete(
      activeBenchmark: Readonly<DbActiveBenchmarkWorkout>,
    ): Promise<DbCompletedWorkout> {
      const now = Date.now()
      const durationSeconds = Math.floor((now - activeBenchmark.startedAt) / 1000)

      const completed: DbCompletedWorkout = {
        id: generateId(),
        name: activeBenchmark.name,
        blocks: activeBenchmark.blocks,
        startedAt: activeBenchmark.startedAt,
        completedAt: now,
        durationSeconds,
        notes: '',
        benchmarkId: activeBenchmark.benchmarkId,
      }

      // Transaction: Save completed workout and remove active benchmark
      await database.transaction('rw', [database.workouts, database.activeBenchmark], async () => {
        await database.workouts.add(completed)
        await database.activeBenchmark.delete('current-benchmark')
      })

      return completed
    },
  }
}
