import { db, generateId } from '../index'
import type { DbActiveWorkout, DbSet, DbWorkoutExercise, DbWorkoutTemplate } from '../schema'

/**
 * Repository for managing workout templates.
 */
export const templatesRepository = {
  /**
   * Get all templates, ordered by most recently used.
   */
  async getAll(): Promise<ReadonlyArray<DbWorkoutTemplate>> {
    return db.templates.orderBy('lastUsedAt').reverse().toArray()
  },

  /**
   * Get a specific template by ID.
   */
  async getById(id: string): Promise<DbWorkoutTemplate | undefined> {
    return db.templates.get(id)
  },

  /**
   * Create a template from an active workout.
   */
  async createFromWorkout(
    workout: Readonly<DbActiveWorkout>,
    templateName: string,
  ): Promise<DbWorkoutTemplate> {
    const template: DbWorkoutTemplate = {
      id: generateId(),
      name: templateName,
      exercises: workout.exercises.map((ex) => ({
        exerciseDefinitionId: ex.exerciseDefinitionId,
        name: ex.name,
        equipment: ex.equipment,
        targetReps: ex.targetReps,
        thumbnail: ex.thumbnail,
        defaultSetCount: ex.sets.length,
      })),
      createdAt: Date.now(),
      lastUsedAt: null,
    }

    await db.templates.add(template)
    return template
  },

  /**
   * Create a new active workout from a template.
   */
  async startFromTemplate(templateId: string): Promise<DbActiveWorkout> {
    const template = await db.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const now = Date.now()
    const exercises: ReadonlyArray<DbWorkoutExercise> = template.exercises.map((ex, index) => {
      const sets: ReadonlyArray<DbSet> = Array.from(
        { length: ex.defaultSetCount },
        (_, setIndex) => ({
          id: generateId(),
          kg: '',
          reps: '',
          rir: '',
          status: setIndex === 0 ? 'active' : 'planned',
          completedAt: null,
        }),
      )

      return {
        id: generateId(),
        exerciseDefinitionId: ex.exerciseDefinitionId,
        name: ex.name,
        equipment: ex.equipment,
        targetReps: ex.targetReps,
        thumbnail: ex.thumbnail,
        orderIndex: index,
        sets,
      }
    })

    const activeWorkout: DbActiveWorkout = {
      id: 'current',
      name: template.name,
      selectedExerciseId: exercises[0]?.id ?? '',
      startedAt: now,
      lastModifiedAt: now,
      exercises,
    }

    // Update template usage and return the workout (don't save to DB yet)
    await db.templates.update(templateId, { lastUsedAt: now })

    return activeWorkout
  },

  /**
   * Update a template.
   */
  async update(
    id: string,
    updates: Partial<Omit<DbWorkoutTemplate, 'id' | 'createdAt'>>,
  ): Promise<void> {
    await db.templates.update(id, updates)
  },

  /**
   * Delete a template.
   */
  async delete(id: string): Promise<void> {
    await db.templates.delete(id)
  },

  /**
   * Rename a template.
   */
  async rename(id: string, newName: string): Promise<void> {
    await db.templates.update(id, { name: newName })
  },
}
