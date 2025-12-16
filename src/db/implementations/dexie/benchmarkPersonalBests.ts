import type { BenchmarkPersonalBestsRepository } from '@/db/interfaces'
import type { DbBenchmarkPersonalBest } from '@/db/schema'
import { db } from './database'

export function createDexieBenchmarkPersonalBestsRepository(): BenchmarkPersonalBestsRepository {
  return {
    async get(benchmarkId: string): Promise<DbBenchmarkPersonalBest | undefined> {
      return db.benchmarkPersonalBests.get(benchmarkId)
    },

    async getMany(
      benchmarkIds: ReadonlyArray<string>,
    ): Promise<Map<string, DbBenchmarkPersonalBest>> {
      const pbs = await db.benchmarkPersonalBests.bulkGet([...benchmarkIds])

      const result = new Map<string, DbBenchmarkPersonalBest>()
      for (const pb of pbs) {
        if (pb) {
          result.set(pb.benchmarkId, pb)
        }
      }

      return result
    },

    async set(pb: Readonly<DbBenchmarkPersonalBest>): Promise<void> {
      await db.benchmarkPersonalBests.put({ ...pb })
    },

    async delete(benchmarkId: string): Promise<void> {
      await db.benchmarkPersonalBests.delete(benchmarkId)
    },
  }
}
