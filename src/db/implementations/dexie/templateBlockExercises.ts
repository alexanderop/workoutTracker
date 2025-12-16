import type { TemplateBlockExercisesRepository } from '@/db/interfaces'
import type { DbNormalizedTemplateBlockExercise } from '@/db/schema'
import { db } from './database'

export function createDexieTemplateBlockExercisesRepository(): TemplateBlockExercisesRepository {
  return {
    async getByBlockIds(
      blockIds: ReadonlyArray<string>,
    ): Promise<Map<string, ReadonlyArray<DbNormalizedTemplateBlockExercise>>> {
      const exercises = await db.templateBlockExercises
        .where('blockId')
        .anyOf([...blockIds])
        .toArray()

      const result = new Map<string, ReadonlyArray<DbNormalizedTemplateBlockExercise>>()
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

    async bulkAdd(exercises: ReadonlyArray<DbNormalizedTemplateBlockExercise>): Promise<void> {
      await db.templateBlockExercises.bulkAdd([...exercises])
    },

    async deleteByBlockIds(blockIds: ReadonlyArray<string>): Promise<void> {
      await db.templateBlockExercises.where('blockId').anyOf([...blockIds]).delete()
    },
  }
}
