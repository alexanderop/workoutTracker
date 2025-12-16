import type { BenchmarkAttemptsRepository } from '@/db/interfaces'
import type { DbBenchmarkAttempt } from '@/db/schema'
import { db } from './database'

export function createDexieBenchmarkAttemptsRepository(): BenchmarkAttemptsRepository {
  return {
    async getByBenchmarkId(benchmarkId: string): Promise<ReadonlyArray<DbBenchmarkAttempt>> {
      const attempts = await db.benchmarkAttempts
        .where('benchmarkId')
        .equals(benchmarkId)
        .toArray()

      // Sort by completedAt descending (newest first)
      return attempts.toSorted((a, b) => b.completedAt - a.completedAt)
    },

    async add(attempt: Readonly<DbBenchmarkAttempt>): Promise<void> {
      await db.benchmarkAttempts.add({ ...attempt })
    },

    async deleteByBenchmarkId(benchmarkId: string): Promise<void> {
      await db.benchmarkAttempts.where('benchmarkId').equals(benchmarkId).delete()
    },

    async deleteByWorkoutId(workoutId: string): Promise<void> {
      await db.benchmarkAttempts.where('workoutId').equals(workoutId).delete()
    },
  }
}
