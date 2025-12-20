import type { ActiveBenchmarkWorkoutRepository } from '@/db/interfaces'
import type { DbActiveBenchmarkWorkout, DbCompletedWorkout } from '@/db/schema'
import type { WorkoutTrackerDb } from './database'
import { generateId } from './database'

export function createDexieActiveBenchmarkWorkoutRepository(
  db: WorkoutTrackerDb,
): ActiveBenchmarkWorkoutRepository {
  return {
    async load(): Promise<DbActiveBenchmarkWorkout | undefined> {
      return db.activeBenchmark.get('current-benchmark')
    },

    async save(workout: Readonly<DbActiveBenchmarkWorkout>): Promise<void> {
      await db.activeBenchmark.put({
        ...workout,
        id: 'current-benchmark',
        lastModifiedAt: Date.now(),
      })
    },

    async delete(): Promise<void> {
      await db.activeBenchmark.delete('current-benchmark')
    },

    async exists(): Promise<boolean> {
      return (await db.activeBenchmark.count()) > 0
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
      await db.transaction('rw', [db.workouts, db.activeBenchmark], async () => {
        await db.workouts.add(completed)
        await db.activeBenchmark.delete('current-benchmark')
      })

      return completed
    },
  }
}
