import type { WorkoutSetsRepository } from '@/db/interfaces'
import type { DbNormalizedSet } from '@/db/schema'
import { db } from './database'

export function createDexieWorkoutSetsRepository(): WorkoutSetsRepository {
  return {
    async getByBlockId(blockId: string): Promise<ReadonlyArray<DbNormalizedSet>> {
      return db.workoutSets.where('blockId').equals(blockId).sortBy('orderIndex')
    },

    async getByBlockIds(
      blockIds: ReadonlyArray<string>,
    ): Promise<Map<string, ReadonlyArray<DbNormalizedSet>>> {
      const sets = await db.workoutSets.where('blockId').anyOf([...blockIds]).toArray()

      const result = new Map<string, ReadonlyArray<DbNormalizedSet>>()
      for (const set of sets) {
        const existing = result.get(set.blockId) ?? []
        result.set(set.blockId, [...existing, set])
      }

      // Sort each group by orderIndex
      for (const [blockId, blockSets] of result) {
        const sorted = [...blockSets].toSorted((a, b) => a.orderIndex - b.orderIndex)
        result.set(blockId, sorted)
      }

      return result
    },

    async bulkAdd(sets: ReadonlyArray<DbNormalizedSet>): Promise<void> {
      await db.workoutSets.bulkAdd([...sets])
    },

    async deleteByBlockId(blockId: string): Promise<void> {
      await db.workoutSets.where('blockId').equals(blockId).delete()
    },

    async deleteByBlockIds(blockIds: ReadonlyArray<string>): Promise<void> {
      await db.workoutSets.where('blockId').anyOf([...blockIds]).delete()
    },
  }
}
