import type { CustomExercisesRepository } from '@/db/interfaces'
import type { DbCustomExercise } from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

export function createDexieCustomExercisesRepository(
  database: WorkoutTrackerDatabase,
): CustomExercisesRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbCustomExercise>> {
      return database.customExercises.orderBy('createdAt').reverse().toArray()
    },

    async getById(id: string): Promise<DbCustomExercise | undefined> {
      return database.customExercises.get(id)
    },

    async add(exercise: Readonly<DbCustomExercise>): Promise<void> {
      await database.customExercises.add(exercise)
    },

    async update(
      id: string,
      updates: Partial<Omit<DbCustomExercise, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const updated = await database.customExercises.update(id, {
        ...updates,
        updatedAt: Date.now(),
      })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update custom exercise')
      }
    },

    async delete(id: string): Promise<void> {
      await database.customExercises.delete(id)
    },

    async existsByName(name: string): Promise<boolean> {
      const count = await database.customExercises.where('name').equalsIgnoreCase(name).count()
      return count > 0
    },

    async searchByName(query: string): Promise<ReadonlyArray<DbCustomExercise>> {
      const lowerQuery = query.toLowerCase()
      return database.customExercises
        .filter((exercise) => exercise.name.toLowerCase().includes(lowerQuery))
        .toArray()
    },
  }
}
