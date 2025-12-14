import type { CreateTemplateData, TemplatesRepository } from '@/db/interfaces'
import type {
  DbActiveWorkout,
  DbBlockExercise,
  DbCompletedWorkout,
  DbSet,
  DbStrengthBlock,
  DbTemplateBlock,
  DbTemplateBlockExercise,
  DbTemplateStrengthBlock,
  DbWorkoutBlock,
  DbWorkoutTemplate,
} from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb } from './database'
import { generateId } from './database'

/**
 * Transform template exercises to workout block exercises with generated IDs.
 */
function templateExercisesToWorkoutExercises(
  exercises: ReadonlyArray<Readonly<DbTemplateBlockExercise>>,
): Array<DbBlockExercise> {
  return exercises.map((ex) => ({
    id: generateId(),
    name: ex.name,
    prescribedReps: ex.prescribedReps,
    load: ex.load,
    thumbnail: ex.thumbnail,
  }))
}

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
    case 'cardio':
      return {
        kind: 'cardio',
        config: block.config,
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
        exercises: templateExercisesToWorkoutExercises(templateBlock.exercises),
        result: null,
        orderIndex,
      }
    case 'amrap':
      return {
        kind: 'amrap',
        id: generateId(),
        config: templateBlock.config,
        exercises: templateExercisesToWorkoutExercises(templateBlock.exercises),
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
        exercises: templateExercisesToWorkoutExercises(templateBlock.exercises),
        result: null,
        orderIndex,
      }
    case 'cardio':
      return {
        kind: 'cardio',
        id: generateId(),
        config: templateBlock.config,
        result: null,
        orderIndex,
      }
  }
}

export function createDexieTemplatesRepository(db: WorkoutTrackerDb): TemplatesRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbWorkoutTemplate>> {
      const templates = await db.templates.toArray()
      // Sort by lastUsedAt descending, with null values at the end
      return templates.toSorted((a, b) => {
        if (a.lastUsedAt === null && b.lastUsedAt === null) return 0
        if (a.lastUsedAt === null) return 1
        if (b.lastUsedAt === null) return -1
        return b.lastUsedAt - a.lastUsedAt
      })
    },

    async getById(id: string): Promise<DbWorkoutTemplate | undefined> {
      return db.templates.get(id)
    },

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

    async startFromTemplate(templateId: string): Promise<DbActiveWorkout> {
      const template = await db.templates.get(templateId)
      if (!template) {
        throw createDatabaseError('NOT_FOUND', 'start workout from template')
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
        activeExerciseIndex: null,
        benchmarkId: null,
        globalTimerStartedAt: null,
      }

      // Update template usage tracking (template exists, so this will always succeed)
      await db.templates.update(templateId, { lastUsedAt: now })

      return activeWorkout
    },

    async update(
      id: string,
      updates: Partial<Omit<DbWorkoutTemplate, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const updated = await db.templates.update(id, updates)
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update template')
      }
    },

    async delete(id: string): Promise<void> {
      await db.templates.delete(id)
    },

    async rename(id: string, newName: string): Promise<void> {
      const updated = await db.templates.update(id, { name: newName })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'rename template')
      }
    },

    async create(data: CreateTemplateData): Promise<DbWorkoutTemplate> {
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
}
