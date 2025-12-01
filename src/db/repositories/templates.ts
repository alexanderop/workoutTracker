import { db, generateId } from '../index'
import type {
  DbActiveWorkout,
  DbCompletedWorkout,
  DbSet,
  DbStrengthBlock,
  DbTemplateBlock,
  DbTemplateStrengthBlock,
  DbWorkoutBlock,
  DbWorkoutTemplate,
} from '../schema'

/**
 * Convert a workout block to a template block.
 */
function workoutBlockToTemplateBlock(block: Readonly<DbWorkoutBlock>): DbTemplateBlock {
  switch (block.kind) {
    case 'strength':
      return {
        kind: 'strength',
        exerciseDefinitionId: block.exerciseDefinitionId,
        name: block.name,
        equipment: block.equipment,
        targetReps: block.targetReps,
        thumbnail: block.thumbnail,
        defaultSetCount: block.sets.length,
      } satisfies DbTemplateStrengthBlock
    case 'emom':
      return {
        kind: 'emom',
        config: block.config,
        exercises: block.exercises.map((ex) => ({
          exerciseDefinitionId: null,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
      }
    case 'amrap':
      return {
        kind: 'amrap',
        config: block.config,
        exercises: block.exercises.map((ex) => ({
          exerciseDefinitionId: null,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
      }
    case 'tabata':
      return {
        kind: 'tabata',
        config: block.config,
        exercise: {
          exerciseDefinitionId: null,
          name: block.exercise.name,
          prescribedReps: block.exercise.prescribedReps,
          load: block.exercise.load,
          thumbnail: block.exercise.thumbnail,
        },
      }
    case 'fortime':
      return {
        kind: 'fortime',
        config: block.config,
        exercises: block.exercises.map((ex) => ({
          exerciseDefinitionId: null,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
      }
    default: {
      // Exhaustive check - if this is reached, a new block kind was added
      const exhaustiveCheck: never = block
      throw new Error(`Unknown block kind: ${JSON.stringify(exhaustiveCheck)}`)
    }
  }
}

/**
 * Convert a template block to a workout block for starting a workout.
 */
function templateBlockToWorkoutBlock(
  templateBlock: Readonly<DbTemplateBlock>,
  orderIndex: number,
): DbWorkoutBlock {
  if (templateBlock.kind === 'strength') {
    const sets: ReadonlyArray<DbSet> = Array.from(
      { length: templateBlock.defaultSetCount },
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
      kind: 'strength',
      id: generateId(),
      exerciseDefinitionId: templateBlock.exerciseDefinitionId,
      name: templateBlock.name,
      equipment: templateBlock.equipment,
      targetReps: templateBlock.targetReps,
      thumbnail: templateBlock.thumbnail,
      sets,
      orderIndex,
    } satisfies DbStrengthBlock
  }

  // Handle timed blocks
  switch (templateBlock.kind) {
    case 'emom':
      return {
        kind: 'emom',
        id: generateId(),
        config: templateBlock.config,
        exercises: templateBlock.exercises.map((ex) => ({
          id: generateId(),
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
        result: null,
        orderIndex,
      }
    case 'amrap':
      return {
        kind: 'amrap',
        id: generateId(),
        config: templateBlock.config,
        exercises: templateBlock.exercises.map((ex) => ({
          id: generateId(),
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
        result: null,
        orderIndex,
      }
    case 'tabata':
      return {
        kind: 'tabata',
        id: generateId(),
        config: templateBlock.config,
        exercise: {
          id: generateId(),
          name: templateBlock.exercise.name,
          prescribedReps: templateBlock.exercise.prescribedReps,
          load: templateBlock.exercise.load,
          thumbnail: templateBlock.exercise.thumbnail,
        },
        result: null,
        orderIndex,
      }
    case 'fortime':
      return {
        kind: 'fortime',
        id: generateId(),
        config: templateBlock.config,
        exercises: templateBlock.exercises.map((ex) => ({
          id: generateId(),
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
        result: null,
        orderIndex,
      }
  }
}

/**
 * Repository for managing workout templates.
 */
export const templatesRepository = {
  /**
   * Get all templates, ordered by most recently used (null values last).
   */
  async getAll(): Promise<ReadonlyArray<DbWorkoutTemplate>> {
    const templates = await db.templates.toArray()
    // Sort by lastUsedAt descending, with null values at the end
    return templates.sort((a, b) => {
      if (a.lastUsedAt === null && b.lastUsedAt === null) return 0
      if (a.lastUsedAt === null) return 1
      if (b.lastUsedAt === null) return -1
      return b.lastUsedAt - a.lastUsedAt
    })
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
      blocks: workout.blocks.map(workoutBlockToTemplateBlock),
      createdAt: Date.now(),
      lastUsedAt: null,
      tags: [],
    }

    await db.templates.add(template)
    return template
  },

  /**
   * Create a template from a completed workout.
   */
  async createFromCompletedWorkout(
    workout: Readonly<DbCompletedWorkout>,
    templateName: string,
  ): Promise<DbWorkoutTemplate> {
    const template: DbWorkoutTemplate = {
      id: generateId(),
      name: templateName,
      blocks: workout.blocks.map(workoutBlockToTemplateBlock),
      createdAt: Date.now(),
      lastUsedAt: null,
      tags: [],
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
    const blocks: ReadonlyArray<DbWorkoutBlock> = template.blocks.map((block, index) =>
      templateBlockToWorkoutBlock(block, index),
    )

    const activeWorkout: DbActiveWorkout = {
      id: 'current',
      name: template.name,
      blocks,
      selectedBlockIndex: 0,
      startedAt: now,
      lastModifiedAt: now,
      mode: 'builder',
      activeSetIndex: null,
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

  /**
   * Create a new template from scratch.
   */
  async create(data: {
    name: string
    blocks: ReadonlyArray<DbTemplateBlock>
    tags?: ReadonlyArray<string>
  }): Promise<DbWorkoutTemplate> {
    const template: DbWorkoutTemplate = {
      id: generateId(),
      name: data.name,
      blocks: data.blocks,
      createdAt: Date.now(),
      lastUsedAt: null,
      tags: data.tags ?? [],
    }

    await db.templates.add(template)
    return template
  },
}
