import { liveQuery } from 'dexie'
import type { CreateTemplateData, LiveQuery, TemplatesRepository } from '@/db/interfaces'
import type { DbActiveWorkout, DbCompletedWorkout, DbWorkoutTemplate } from '@/db/schema'
import type {
  BlockKind,
  DbBlockByKind,
  DbTemplateBlock,
  DbTemplateBlockByKind,
  DbWorkoutBlock,
} from '@/blocks'
import { BLOCK_CODECS } from '@/blocks'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'
import { generateId } from './database'

// Per-kind template conversion lives in the Block Codecs (ADR 002 stage 5);
// this module dispatches through the registry and injects ID generation,
// which src/blocks must not import from src/db.

/**
 * Convert a workout block to a template block.
 * Generic indexed-access dispatch keeps this cast-free (see `blockToDatabase`).
 */
function workoutBlockToTemplateBlock<K extends BlockKind>(
  block: Readonly<DbBlockByKind[K]>,
): DbTemplateBlock {
  const kind: K = block.kind
  return BLOCK_CODECS[kind].toTemplate(block)
}

/**
 * Convert a template block to a workout block for starting a workout.
 */
function templateBlockToWorkoutBlock<K extends BlockKind>(
  templateBlock: Readonly<DbTemplateBlockByKind[K]>,
  orderIndex: number,
): DbWorkoutBlock {
  const kind: K = templateBlock.kind
  return BLOCK_CODECS[kind].fromTemplate(templateBlock, { orderIndex, generateId })
}

/**
 * Shared query logic for `getAll()` and `observeAll()` so both read the same
 * ordering: by lastUsedAt descending, with never-used templates last.
 */
function queryAll(database: WorkoutTrackerDatabase): Promise<ReadonlyArray<DbWorkoutTemplate>> {
  return database.templates.toArray().then((templates) =>
    templates.toSorted((a, b) => {
      if (a.lastUsedAt === null && b.lastUsedAt === null) return 0
      if (a.lastUsedAt === null) return 1
      if (b.lastUsedAt === null) return -1
      return b.lastUsedAt - a.lastUsedAt
    }),
  )
}

export function createDexieTemplatesRepository(
  database: WorkoutTrackerDatabase,
): TemplatesRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbWorkoutTemplate>> {
      return queryAll(database)
    },

    observeAll(): LiveQuery<ReadonlyArray<DbWorkoutTemplate>> {
      const run = () => queryAll(database)
      return {
        get: () => run(),
        subscribe(onChange: (value: ReadonlyArray<DbWorkoutTemplate>) => void) {
          const subscription = liveQuery(run).subscribe({ next: onChange })
          return () => subscription.unsubscribe()
        },
      }
    },

    async getById(id: string): Promise<DbWorkoutTemplate | undefined> {
      return database.templates.get(id)
    },

    async createFromWorkout(
      workout: Readonly<DbActiveWorkout | DbCompletedWorkout>,
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

      await database.templates.add(template)
      return template
    },

    async startFromTemplate(templateId: string): Promise<DbActiveWorkout> {
      const template = await database.templates.get(templateId)
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
      await database.templates.update(templateId, { lastUsedAt: now })

      return activeWorkout
    },

    async update(
      id: string,
      updates: Partial<Omit<DbWorkoutTemplate, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const updated = await database.templates.update(id, updates)
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update template')
      }
    },

    async delete(id: string): Promise<void> {
      await database.templates.delete(id)
    },

    async rename(id: string, newName: string): Promise<void> {
      const updated = await database.templates.update(id, { name: newName })
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

      await database.templates.add(template)
      return template
    },
  }
}
