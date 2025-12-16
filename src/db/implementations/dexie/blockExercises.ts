import type { BlockExercisesRepository } from '@/db/interfaces'
import type { DbNormalizedBlockExercise } from '@/db/schema'
import { db } from './database'

export function createDexieBlockExercisesRepository(): BlockExercisesRepository {
  return {
    async getByBlockId(blockId: string): Promise<ReadonlyArray<DbNormalizedBlockExercise>> {
      return db.blockExercises.where('blockId').equals(blockId).sortBy('orderIndex')
    },

    async getByBlockIds(
      blockIds: ReadonlyArray<string>,
    ): Promise<Map<string, ReadonlyArray<DbNormalizedBlockExercise>>> {
      const exercises = await db.blockExercises.where('blockId').anyOf([...blockIds]).toArray()

      const result = new Map<string, ReadonlyArray<DbNormalizedBlockExercise>>()
      for (const exercise of exercises) {
        const existing = result.get(exercise.blockId) ?? []
        result.set(exercise.blockId, [...existing, exercise])
      }

      // Sort each group by orderIndex
      for (const [blockId, blockExercises] of result) {
        const sorted = [...blockExercises].toSorted((a, b) => a.orderIndex - b.orderIndex)
        result.set(blockId, sorted)
      }

      return result
    },

    async bulkAdd(exercises: ReadonlyArray<DbNormalizedBlockExercise>): Promise<void> {
      await db.blockExercises.bulkAdd([...exercises])
    },

    async deleteByBlockId(blockId: string): Promise<void> {
      await db.blockExercises.where('blockId').equals(blockId).delete()
    },

    async deleteByBlockIds(blockIds: ReadonlyArray<string>): Promise<void> {
      await db.blockExercises.where('blockId').anyOf([...blockIds]).delete()
    },
  }
}
