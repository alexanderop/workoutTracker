import type { CustomExercisesRepository } from '@/db/interfaces'
import type { DbCustomExercise } from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb } from './database'

export function createDexieCustomExercisesRepository(
  db: WorkoutTrackerDb,
): CustomExercisesRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbCustomExercise>> {
      return db.customExercises.orderBy('createdAt').reverse().toArray()
    },

    async getById(id: string): Promise<DbCustomExercise | undefined> {
      return db.customExercises.get(id)
    },

    async add(exercise: Readonly<DbCustomExercise>): Promise<void> {
      await db.customExercises.add(exercise)
    },

    async update(
      id: string,
      updates: Partial<Omit<DbCustomExercise, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const updated = await db.customExercises.update(id, {
        ...updates,
        updatedAt: Date.now(),
      })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update custom exercise')
      }
    },

    async delete(id: string): Promise<void> {
      await db.customExercises.delete(id)
    },

    async existsByName(name: string): Promise<boolean> {
      const count = await db.customExercises.where('name').equalsIgnoreCase(name).count()
      return count > 0
    },

    async searchByName(query: string): Promise<ReadonlyArray<DbCustomExercise>> {
      const lowerQuery = query.toLowerCase()
      return db.customExercises
        .filter((exercise) => exercise.name.toLowerCase().includes(lowerQuery))
        .toArray()
    },
  }
}
