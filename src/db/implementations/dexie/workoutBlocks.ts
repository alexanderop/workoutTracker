import type { WorkoutBlocksRepository } from '@/db/interfaces'
import type { DbNormalizedBlock } from '@/db/schema'
import { db } from './database'

export function createDexieWorkoutBlocksRepository(): WorkoutBlocksRepository {
  return {
    async getByWorkoutId(workoutId: string): Promise<ReadonlyArray<DbNormalizedBlock>> {
      return db.workoutBlocks.where('workoutId').equals(workoutId).sortBy('orderIndex')
    },

    async getById(id: string): Promise<DbNormalizedBlock | undefined> {
      return db.workoutBlocks.get(id)
    },

    async bulkAdd(blocks: ReadonlyArray<DbNormalizedBlock>): Promise<void> {
      await db.workoutBlocks.bulkAdd([...blocks])
    },

    async deleteByWorkoutId(workoutId: string): Promise<void> {
      await db.workoutBlocks.where('workoutId').equals(workoutId).delete()
    },
  }
}
