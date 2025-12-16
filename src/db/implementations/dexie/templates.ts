/* eslint-disable @typescript-eslint/consistent-type-assertions -- Type assertions needed for discriminated union block conversion */
import type { CreateTemplateData, TemplatesRepository, TemplateWithBlocks } from '@/db/interfaces'
import type {
  DbActiveWorkout,
  DbBlockConfig,
  DbBlockExercise,
  DbNormalizedTemplateBlock,
  DbNormalizedTemplateBlockExercise,
  DbSet,
  DbStrengthBlock,
  DbTemplateBlock,
  DbTemplateHeader,
  DbWorkoutBlock,
} from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import { db, generateId } from './database'

/**
 * Transform template block exercises to workout block exercises with generated IDs.
 */
function templateExercisesToWorkoutExercises(
  exercises: ReadonlyArray<DbNormalizedTemplateBlockExercise>,
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
 * Normalize a workout block to template block format for storage.
 */
function normalizeTemplateBlock(
  block: Readonly<DbWorkoutBlock>,
  templateId: string,
  orderIndex: number,
): {
  normalizedBlock: DbNormalizedTemplateBlock
  blockExercises: ReadonlyArray<DbNormalizedTemplateBlockExercise>
} {
  const blockId = generateId()

  switch (block.kind) {
    case 'strength': {
      const config: DbBlockConfig = { kind: 'strength' }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'strength',
          orderIndex,
          config,
          exerciseId: block.exerciseDefinitionId,
          exerciseName: block.name,
          equipment: block.equipment,
          targetReps: block.targetReps,
          thumbnail: block.thumbnail,
          defaultSetCount: block.sets.length,
        },
        blockExercises: [],
      }
    }
    case 'emom': {
      const config: DbBlockConfig = {
        kind: 'emom',
        minutes: block.config.minutes,
        exerciseRotation: block.config.exerciseRotation,
      }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'emom',
          orderIndex,
          config,
          exerciseId: null,
          exerciseName: null,
          equipment: null,
          targetReps: null,
          thumbnail: null,
          defaultSetCount: null,
        },
        blockExercises: block.exercises.map((ex, idx) => ({
          id: generateId(),
          blockId,
          orderIndex: idx,
          exerciseId: null,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
      }
    }
    case 'amrap': {
      const config: DbBlockConfig = {
        kind: 'amrap',
        durationSeconds: block.config.durationSeconds,
      }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'amrap',
          orderIndex,
          config,
          exerciseId: null,
          exerciseName: null,
          equipment: null,
          targetReps: null,
          thumbnail: null,
          defaultSetCount: null,
        },
        blockExercises: block.exercises.map((ex, idx) => ({
          id: generateId(),
          blockId,
          orderIndex: idx,
          exerciseId: null,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
      }
    }
    case 'tabata': {
      const config: DbBlockConfig = {
        kind: 'tabata',
        rounds: block.config.rounds,
        workSeconds: block.config.workSeconds,
        restSeconds: block.config.restSeconds,
      }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'tabata',
          orderIndex,
          config,
          exerciseId: null,
          exerciseName: null,
          equipment: null,
          targetReps: null,
          thumbnail: null,
          defaultSetCount: null,
        },
        blockExercises: [
          {
            id: generateId(),
            blockId,
            orderIndex: 0,
            exerciseId: null,
            name: block.exercise.name,
            prescribedReps: block.exercise.prescribedReps,
            load: block.exercise.load,
            thumbnail: block.exercise.thumbnail,
          },
        ],
      }
    }
    case 'fortime': {
      const config: DbBlockConfig = {
        kind: 'fortime',
        timeCapSeconds: block.config.timeCapSeconds,
      }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'fortime',
          orderIndex,
          config,
          exerciseId: null,
          exerciseName: null,
          equipment: null,
          targetReps: null,
          thumbnail: null,
          defaultSetCount: null,
        },
        blockExercises: block.exercises.map((ex, idx) => ({
          id: generateId(),
          blockId,
          orderIndex: idx,
          exerciseId: null,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
      }
    }
    case 'cardio': {
      const config: DbBlockConfig = {
        kind: 'cardio',
        activity: block.config.activity,
        targetDurationSeconds: block.config.targetDurationSeconds,
        targetDistanceMeters: block.config.targetDistanceMeters,
      }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'cardio',
          orderIndex,
          config,
          exerciseId: null,
          exerciseName: null,
          equipment: null,
          targetReps: null,
          thumbnail: null,
          defaultSetCount: null,
        },
        blockExercises: [],
      }
    }
  }
}

/**
 * Normalize a DbTemplateBlock (embedded format) to normalized format.
 */
function normalizeEmbeddedTemplateBlock(
  block: Readonly<DbTemplateBlock>,
  templateId: string,
  orderIndex: number,
): {
  normalizedBlock: DbNormalizedTemplateBlock
  blockExercises: ReadonlyArray<DbNormalizedTemplateBlockExercise>
} {
  const blockId = generateId()

  switch (block.kind) {
    case 'strength': {
      const config: DbBlockConfig = { kind: 'strength' }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'strength',
          orderIndex,
          config,
          exerciseId: block.exerciseDefinitionId,
          exerciseName: block.name,
          equipment: block.equipment,
          targetReps: block.targetReps,
          thumbnail: block.thumbnail,
          defaultSetCount: block.defaultSetCount,
        },
        blockExercises: [],
      }
    }
    case 'emom': {
      const config: DbBlockConfig = {
        kind: 'emom',
        minutes: block.config.minutes,
        exerciseRotation: block.config.exerciseRotation,
      }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'emom',
          orderIndex,
          config,
          exerciseId: null,
          exerciseName: null,
          equipment: null,
          targetReps: null,
          thumbnail: null,
          defaultSetCount: null,
        },
        blockExercises: block.exercises.map((ex, idx) => ({
          id: generateId(),
          blockId,
          orderIndex: idx,
          exerciseId: ex.exerciseDefinitionId,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
      }
    }
    case 'amrap': {
      const config: DbBlockConfig = {
        kind: 'amrap',
        durationSeconds: block.config.durationSeconds,
      }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'amrap',
          orderIndex,
          config,
          exerciseId: null,
          exerciseName: null,
          equipment: null,
          targetReps: null,
          thumbnail: null,
          defaultSetCount: null,
        },
        blockExercises: block.exercises.map((ex, idx) => ({
          id: generateId(),
          blockId,
          orderIndex: idx,
          exerciseId: ex.exerciseDefinitionId,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
      }
    }
    case 'tabata': {
      const config: DbBlockConfig = {
        kind: 'tabata',
        rounds: block.config.rounds,
        workSeconds: block.config.workSeconds,
        restSeconds: block.config.restSeconds,
      }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'tabata',
          orderIndex,
          config,
          exerciseId: null,
          exerciseName: null,
          equipment: null,
          targetReps: null,
          thumbnail: null,
          defaultSetCount: null,
        },
        blockExercises: [
          {
            id: generateId(),
            blockId,
            orderIndex: 0,
            exerciseId: block.exercise.exerciseDefinitionId,
            name: block.exercise.name,
            prescribedReps: block.exercise.prescribedReps,
            load: block.exercise.load,
            thumbnail: block.exercise.thumbnail,
          },
        ],
      }
    }
    case 'fortime': {
      const config: DbBlockConfig = {
        kind: 'fortime',
        timeCapSeconds: block.config.timeCapSeconds,
      }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'fortime',
          orderIndex,
          config,
          exerciseId: null,
          exerciseName: null,
          equipment: null,
          targetReps: null,
          thumbnail: null,
          defaultSetCount: null,
        },
        blockExercises: block.exercises.map((ex, idx) => ({
          id: generateId(),
          blockId,
          orderIndex: idx,
          exerciseId: ex.exerciseDefinitionId,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
      }
    }
    case 'cardio': {
      const config: DbBlockConfig = {
        kind: 'cardio',
        activity: block.config.activity,
        targetDurationSeconds: block.config.targetDurationSeconds,
        targetDistanceMeters: block.config.targetDistanceMeters,
      }
      return {
        normalizedBlock: {
          id: blockId,
          templateId,
          kind: 'cardio',
          orderIndex,
          config,
          exerciseId: null,
          exerciseName: null,
          equipment: null,
          targetReps: null,
          thumbnail: null,
          defaultSetCount: null,
        },
        blockExercises: [],
      }
    }
  }
}

/**
 * Convert normalized template block to workout block for starting a workout.
 */
function templateBlockToWorkoutBlock(
  templateBlock: DbNormalizedTemplateBlock,
  blockExercises: ReadonlyArray<DbNormalizedTemplateBlockExercise>,
): DbWorkoutBlock {
  const orderIndex = templateBlock.orderIndex

  if (templateBlock.kind === 'strength') {
    const setCount = templateBlock.defaultSetCount ?? 3
    const sets: ReadonlyArray<DbSet> = Array.from(
      { length: setCount },
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
      exerciseDefinitionId: templateBlock.exerciseId,
      name: templateBlock.exerciseName ?? '',
      equipment: templateBlock.equipment ?? '',
      targetReps: templateBlock.targetReps ?? 0,
      thumbnail: templateBlock.thumbnail ?? '',
      sets,
      orderIndex,
    } satisfies DbStrengthBlock
  }

  // Handle timed blocks
  switch (templateBlock.kind) {
    case 'emom': {
      const config = templateBlock.config as { kind: 'emom'; minutes: number; exerciseRotation: 'each-minute' | 'full-round' }
      return {
        kind: 'emom',
        id: generateId(),
        config: {
          minutes: config.minutes,
          exerciseRotation: config.exerciseRotation,
        },
        exercises: templateExercisesToWorkoutExercises(blockExercises),
        result: null,
        orderIndex,
      }
    }
    case 'amrap': {
      const config = templateBlock.config as { kind: 'amrap'; durationSeconds: number }
      return {
        kind: 'amrap',
        id: generateId(),
        config: {
          durationSeconds: config.durationSeconds,
        },
        exercises: templateExercisesToWorkoutExercises(blockExercises),
        result: null,
        orderIndex,
      }
    }
    case 'tabata': {
      const config = templateBlock.config as { kind: 'tabata'; rounds: number; workSeconds: number; restSeconds: number }
      const exercise = blockExercises[0]
      return {
        kind: 'tabata',
        id: generateId(),
        config: {
          rounds: config.rounds,
          workSeconds: config.workSeconds,
          restSeconds: config.restSeconds,
        },
        exercise: exercise
          ? {
              id: generateId(),
              name: exercise.name,
              prescribedReps: exercise.prescribedReps,
              load: exercise.load,
              thumbnail: exercise.thumbnail,
            }
          : { id: generateId(), name: '', prescribedReps: 0, load: null, thumbnail: '' },
        result: null,
        orderIndex,
      }
    }
    case 'fortime': {
      const config = templateBlock.config as { kind: 'fortime'; timeCapSeconds: number | null }
      return {
        kind: 'fortime',
        id: generateId(),
        config: {
          timeCapSeconds: config.timeCapSeconds,
        },
        exercises: templateExercisesToWorkoutExercises(blockExercises),
        result: null,
        orderIndex,
      }
    }
    case 'cardio': {
      const config = templateBlock.config as { kind: 'cardio'; activity: 'running' | 'cycling' | 'rowing' | 'elliptical' | 'swimming' | 'stairclimber' | 'walking'; targetDurationSeconds: number | null; targetDistanceMeters: number | null }
      return {
        kind: 'cardio',
        id: generateId(),
        config: {
          activity: config.activity,
          targetDurationSeconds: config.targetDurationSeconds,
          targetDistanceMeters: config.targetDistanceMeters,
        },
        result: null,
        orderIndex,
      }
    }
  }
}

export function createDexieTemplatesRepository(): TemplatesRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbTemplateHeader>> {
      const templates = await db.templates.toArray()
      // Sort by lastUsedAt descending, with null values at the end
      return templates.toSorted((a, b) => {
        if (a.lastUsedAt === null && b.lastUsedAt === null) return 0
        if (a.lastUsedAt === null) return 1
        if (b.lastUsedAt === null) return -1
        return b.lastUsedAt - a.lastUsedAt
      })
    },

    async getById(id: string): Promise<DbTemplateHeader | undefined> {
      return db.templates.get(id)
    },

    async getByIdWithBlocks(id: string): Promise<TemplateWithBlocks | undefined> {
      const header = await db.templates.get(id)
      if (!header) {
        return undefined
      }

      // Get all blocks for this template
      const blocks = await db.templateBlocks
        .where('templateId')
        .equals(id)
        .sortBy('orderIndex')

      // Get all block exercises
      const blockIds = blocks.map((b) => b.id)
      const allExercises = blockIds.length > 0
        ? await db.templateBlockExercises.where('blockId').anyOf(blockIds).toArray()
        : []

      // Group exercises by block ID
      const exercisesByBlockId = new Map<string, Array<DbNormalizedTemplateBlockExercise>>()
      for (const ex of allExercises) {
        const existing = exercisesByBlockId.get(ex.blockId) ?? []
        existing.push(ex)
        exercisesByBlockId.set(ex.blockId, existing)
      }

      // Sort exercises within each block
      for (const [blockId, exercises] of exercisesByBlockId) {
        exercisesByBlockId.set(
          blockId,
          exercises.toSorted((a, b) => a.orderIndex - b.orderIndex),
        )
      }

      return {
        ...header,
        blocks,
        blockExercises: exercisesByBlockId,
      }
    },

    async createFromWorkout(
      workout: Readonly<DbActiveWorkout>,
      templateName: string,
    ): Promise<DbTemplateHeader> {
      const templateId = generateId()
      const now = Date.now()

      // Normalize blocks
      const allNormalizedBlocks: Array<DbNormalizedTemplateBlock> = []
      const allBlockExercises: Array<DbNormalizedTemplateBlockExercise> = []

      workout.blocks.forEach((block, idx) => {
        const { normalizedBlock, blockExercises } = normalizeTemplateBlock(block, templateId, idx)
        allNormalizedBlocks.push(normalizedBlock)
        allBlockExercises.push(...blockExercises)
      })

      const header: DbTemplateHeader = {
        id: templateId,
        name: templateName,
        createdAt: now,
        lastUsedAt: null,
        usageCount: 0,
        tags: [],
      }

      // Save everything in a transaction
      await db.transaction(
        'rw',
        [db.templates, db.templateBlocks, db.templateBlockExercises],
        async () => {
          await db.templates.add(header)
          await db.templateBlocks.bulkAdd(allNormalizedBlocks)
          if (allBlockExercises.length > 0) {
            await db.templateBlockExercises.bulkAdd(allBlockExercises)
          }
        },
      )

      return header
    },

    async createFromCompletedWorkout(
      workoutId: string,
      templateName: string,
    ): Promise<DbTemplateHeader> {
      // Get the workout with blocks
      const header = await db.workoutHeaders.get(workoutId)
      if (!header) {
        throw createDatabaseError('NOT_FOUND', 'create template from workout')
      }

      // Get blocks
      const normalizedBlocks = await db.workoutBlocks
        .where('workoutId')
        .equals(workoutId)
        .sortBy('orderIndex')

      // Get block exercises
      const blockIds = normalizedBlocks.map((b) => b.id)
      const allBlockExercises = blockIds.length > 0
        ? await db.blockExercises.where('blockId').anyOf(blockIds).toArray()
        : []

      // Group exercises by block
      const exercisesByBlockId = new Map<string, typeof allBlockExercises>()
      for (const ex of allBlockExercises) {
        const existing = exercisesByBlockId.get(ex.blockId) ?? []
        existing.push(ex)
        exercisesByBlockId.set(ex.blockId, existing)
      }

      // Create template
      const templateId = generateId()
      const now = Date.now()

      const templateBlocks: Array<DbNormalizedTemplateBlock> = []
      const templateBlockExercises: Array<DbNormalizedTemplateBlockExercise> = []

      for (const block of normalizedBlocks) {
        const newBlockId = generateId()
        const blockExercises = (exercisesByBlockId.get(block.id) ?? []).toSorted(
          (a, b) => a.orderIndex - b.orderIndex,
        )

        // Create template block
        templateBlocks.push({
          id: newBlockId,
          templateId,
          kind: block.kind,
          orderIndex: block.orderIndex,
          config: block.config,
          exerciseId: block.exerciseId,
          exerciseName: block.exerciseName,
          equipment: block.equipment,
          targetReps: block.targetReps,
          thumbnail: block.thumbnail,
          defaultSetCount: block.kind === 'strength' ? 3 : null, // Default to 3 sets for strength
        })

        // Create template block exercises
        for (const ex of blockExercises) {
          templateBlockExercises.push({
            id: generateId(),
            blockId: newBlockId,
            orderIndex: ex.orderIndex,
            exerciseId: ex.exerciseId,
            name: ex.name,
            prescribedReps: ex.prescribedReps,
            load: ex.load,
            thumbnail: ex.thumbnail,
          })
        }
      }

      const templateHeader: DbTemplateHeader = {
        id: templateId,
        name: templateName,
        createdAt: now,
        lastUsedAt: null,
        usageCount: 0,
        tags: [],
      }

      // Save everything in a transaction
      await db.transaction(
        'rw',
        [db.templates, db.templateBlocks, db.templateBlockExercises],
        async () => {
          await db.templates.add(templateHeader)
          await db.templateBlocks.bulkAdd(templateBlocks)
          if (templateBlockExercises.length > 0) {
            await db.templateBlockExercises.bulkAdd(templateBlockExercises)
          }
        },
      )

      return templateHeader
    },

    async startFromTemplate(templateId: string): Promise<DbActiveWorkout> {
      const templateWithBlocks = await this.getByIdWithBlocks(templateId)
      if (!templateWithBlocks) {
        throw createDatabaseError('NOT_FOUND', 'start workout from template')
      }

      const now = Date.now()

      // Convert template blocks to workout blocks
      const blocks: ReadonlyArray<DbWorkoutBlock> = templateWithBlocks.blocks.map((block) => {
        const blockExercises = templateWithBlocks.blockExercises.get(block.id) ?? []
        return templateBlockToWorkoutBlock(block, blockExercises)
      })

      const activeWorkout: DbActiveWorkout = {
        id: 'current',
        name: templateWithBlocks.name,
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

      // Update template usage tracking
      await db.templates.update(templateId, {
        lastUsedAt: now,
        usageCount: (templateWithBlocks.usageCount ?? 0) + 1,
      })

      return activeWorkout
    },

    async update(
      id: string,
      updates: Partial<Omit<DbTemplateHeader, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const updated = await db.templates.update(id, updates)
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update template')
      }
    },

    async updateWithBlocks(
      id: string,
      name: string,
      blocks: ReadonlyArray<DbTemplateBlock>,
    ): Promise<void> {
      // Check if template exists
      const existing = await db.templates.get(id)
      if (!existing) {
        throw createDatabaseError('NOT_FOUND', 'update template with blocks')
      }

      // Normalize new blocks
      const allNormalizedBlocks: Array<DbNormalizedTemplateBlock> = []
      const allBlockExercises: Array<DbNormalizedTemplateBlockExercise> = []

      blocks.forEach((block, idx) => {
        const { normalizedBlock, blockExercises } = normalizeEmbeddedTemplateBlock(block, id, idx)
        allNormalizedBlocks.push(normalizedBlock)
        allBlockExercises.push(...blockExercises)
      })

      // Replace everything in a transaction
      await db.transaction(
        'rw',
        [db.templates, db.templateBlocks, db.templateBlockExercises],
        async () => {
          // Get existing block IDs for cleanup
          const existingBlocks = await db.templateBlocks.where('templateId').equals(id).toArray()
          const existingBlockIds = existingBlocks.map((b) => b.id)

          // Delete old block exercises and blocks
          if (existingBlockIds.length > 0) {
            await db.templateBlockExercises.where('blockId').anyOf(existingBlockIds).delete()
            await db.templateBlocks.where('templateId').equals(id).delete()
          }

          // Update template header
          await db.templates.update(id, { name })

          // Add new blocks and exercises
          if (allNormalizedBlocks.length > 0) {
            await db.templateBlocks.bulkAdd(allNormalizedBlocks)
          }
          if (allBlockExercises.length > 0) {
            await db.templateBlockExercises.bulkAdd(allBlockExercises)
          }
        },
      )
    },

    async delete(id: string): Promise<void> {
      // Get block IDs first
      const blocks = await db.templateBlocks.where('templateId').equals(id).toArray()
      const blockIds = blocks.map((b) => b.id)

      // Delete everything in a transaction
      await db.transaction(
        'rw',
        [db.templates, db.templateBlocks, db.templateBlockExercises],
        async () => {
          if (blockIds.length > 0) {
            await db.templateBlockExercises.where('blockId').anyOf(blockIds).delete()
          }
          await db.templateBlocks.where('templateId').equals(id).delete()
          await db.templates.delete(id)
        },
      )
    },

    async rename(id: string, newName: string): Promise<void> {
      const updated = await db.templates.update(id, { name: newName })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'rename template')
      }
    },

    async create(data: CreateTemplateData): Promise<DbTemplateHeader> {
      const templateId = generateId()
      const now = Date.now()

      // Normalize blocks
      const allNormalizedBlocks: Array<DbNormalizedTemplateBlock> = []
      const allBlockExercises: Array<DbNormalizedTemplateBlockExercise> = []

      data.blocks.forEach((block, idx) => {
        const { normalizedBlock, blockExercises } = normalizeEmbeddedTemplateBlock(block, templateId, idx)
        allNormalizedBlocks.push(normalizedBlock)
        allBlockExercises.push(...blockExercises)
      })

      const header: DbTemplateHeader = {
        id: templateId,
        name: data.name,
        createdAt: now,
        lastUsedAt: null,
        usageCount: 0,
        tags: data.tags ?? [],
      }

      // Save everything in a transaction
      await db.transaction(
        'rw',
        [db.templates, db.templateBlocks, db.templateBlockExercises],
        async () => {
          await db.templates.add(header)
          await db.templateBlocks.bulkAdd(allNormalizedBlocks)
          if (allBlockExercises.length > 0) {
            await db.templateBlockExercises.bulkAdd(allBlockExercises)
          }
        },
      )

      return header
    },
  }
}
