import type { ExercisesRepository } from '@/db/interfaces'
import type { DbExercise } from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import { db } from './database'

export function createDexieExercisesRepository(): ExercisesRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbExercise>> {
      return db.exercises.orderBy('createdAt').reverse().toArray()
    },

    async getCustom(): Promise<ReadonlyArray<DbExercise>> {
      return db.exercises
        .where('isBuiltIn')
        .equals(0) // Dexie stores booleans as 0/1
        .reverse()
        .sortBy('createdAt')
    },

    async getById(id: string): Promise<DbExercise | undefined> {
      return db.exercises.get(id)
    },

    async add(exercise: Readonly<DbExercise>): Promise<void> {
      await db.exercises.add({ ...exercise })
    },

    async bulkAdd(exercises: ReadonlyArray<DbExercise>): Promise<void> {
      await db.exercises.bulkAdd([...exercises])
    },

    async update(
      id: string,
      updates: Partial<Omit<DbExercise, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const updated = await db.exercises.update(id, {
        ...updates,
        updatedAt: Date.now(),
      })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update exercise')
      }
    },

    async delete(id: string): Promise<void> {
      await db.exercises.delete(id)
    },

    async bulkDelete(ids: ReadonlyArray<string>): Promise<void> {
      await db.exercises.bulkDelete([...ids])
    },

    async existsByName(name: string): Promise<boolean> {
      const count = await db.exercises.where('name').equalsIgnoreCase(name).count()
      return count > 0
    },

    async searchByName(query: string): Promise<ReadonlyArray<DbExercise>> {
      const lowerQuery = query.toLowerCase()
      return db.exercises
        .filter((exercise) => exercise.name.toLowerCase().includes(lowerQuery))
        .toArray()
    },
  }
}
