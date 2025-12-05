import { db } from '@/db'
import type { DbCustomExercise } from '@/db/schema'

/**
 * Repository for managing custom exercise definitions.
 */
export const customExercisesRepository = {
  /**
   * Get all custom exercises.
   */
  async getAll(): Promise<ReadonlyArray<DbCustomExercise>> {
    return db.customExercises.orderBy('createdAt').reverse().toArray()
  },

  /**
   * Get a specific exercise by ID.
   */
  async getById(id: string): Promise<DbCustomExercise | undefined> {
    return db.customExercises.get(id)
  },

  /**
   * Add a new custom exercise.
   */
  async add(exercise: Readonly<DbCustomExercise>): Promise<void> {
    await db.customExercises.add(exercise)
  },

  /**
   * Update an existing custom exercise.
   */
  async update(
    id: string,
    updates: Partial<Omit<DbCustomExercise, 'id' | 'createdAt'>>,
  ): Promise<void> {
    await db.customExercises.update(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },

  /**
   * Delete a custom exercise.
   */
  async delete(id: string): Promise<void> {
    await db.customExercises.delete(id)
  },

  /**
   * Check if an exercise with the given name exists.
   */
  async existsByName(name: string): Promise<boolean> {
    const count = await db.customExercises.where('name').equalsIgnoreCase(name).count()
    return count > 0
  },

  /**
   * Search exercises by name.
   */
  async searchByName(query: string): Promise<ReadonlyArray<DbCustomExercise>> {
    const lowerQuery = query.toLowerCase()
    return db.customExercises
      .filter((exercise) => exercise.name.toLowerCase().includes(lowerQuery))
      .toArray()
  },
}
