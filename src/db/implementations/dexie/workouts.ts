/* eslint-disable @typescript-eslint/consistent-type-assertions -- Type assertions needed for discriminated union block assembly */
import type { GetByDateRangeParams, GetHistoryParams, WorkoutsRepository, WorkoutWithBlocks } from '@/db/interfaces'
import type {
  DbActiveWorkout,
  DbAmrapBlock,
  DbBlockConfig,
  DbBlockResult,
  DbCardioBlock,
  DbCompletedWorkout,
  DbEmomBlock,
  DbForTimeBlock,
  DbNormalizedBlock,
  DbNormalizedBlockExercise,
  DbNormalizedSet,
  DbStrengthBlock,
  DbTabataBlock,
  DbWorkoutBlock,
  DbWorkoutHeader,
  DbWorkoutStats,
} from '@/db/schema'
import { isDbStrengthBlock } from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import { db, generateId } from './database'

/**
 * Compute workout statistics from embedded blocks.
 */
function computeStats(blocks: ReadonlyArray<DbWorkoutBlock>): DbWorkoutStats {
  let setCount = 0
  let completedSetCount = 0
  let totalVolume = 0
  let timedBlockCount = 0
  let totalRounds = 0

  for (const block of blocks) {
    if (block.kind === 'strength') {
      setCount += block.sets.length
      for (const set of block.sets) {
        if (set.status === 'completed') {
          completedSetCount++
        }
        if (set.status === 'completed') {
          const kg = parseFloat(set.kg) || 0
          const reps = parseInt(set.reps, 10) || 0
          totalVolume += kg * reps
        }
      }
      continue
    }

    if (block.kind === 'cardio') {
      continue
    }

    // Timed blocks (emom, amrap, tabata, fortime)
    timedBlockCount++
    if (block.kind === 'amrap' && block.result) {
      totalRounds += block.result.rounds
    }
  }

  return {
    blockCount: blocks.length,
    setCount,
    completedSetCount,
    totalVolume,
    timedBlockCount,
    totalRounds,
  }
}

/**
 * Normalize a strength block for storage.
 */
function normalizeStrengthBlock(
  block: DbStrengthBlock,
  workoutId: string,
): {
  normalizedBlock: DbNormalizedBlock
  sets: ReadonlyArray<DbNormalizedSet>
} {
  const config: DbBlockConfig = { kind: 'strength' }

  const normalizedBlock: DbNormalizedBlock = {
    id: block.id,
    workoutId,
    kind: 'strength',
    orderIndex: block.orderIndex,
    config,
    result: null,
    exerciseId: block.exerciseDefinitionId,
    exerciseName: block.name,
    equipment: block.equipment,
    targetReps: block.targetReps,
    thumbnail: block.thumbnail,
  }

  const sets: ReadonlyArray<DbNormalizedSet> = block.sets.map((set, idx) => ({
    id: `${block.id}-set-${idx}`,
    blockId: block.id,
    orderIndex: idx,
    kg: set.kg,
    reps: set.reps,
    rir: set.rir,
    status: set.status,
    completedAt: set.completedAt,
  }))

  return { normalizedBlock, sets }
}

/**
 * Normalize EMOM block for storage.
 */
function normalizeEmomBlock(
  block: DbEmomBlock,
  workoutId: string,
): {
  normalizedBlock: DbNormalizedBlock
  blockExercises: ReadonlyArray<DbNormalizedBlockExercise>
} {
  const config: DbBlockConfig = {
    kind: 'emom',
    minutes: block.config.minutes,
    exerciseRotation: block.config.exerciseRotation,
  }

  const result: DbBlockResult | null = block.result
    ? {
        kind: 'emom',
        completedMinutes: block.result.completedMinutes,
        missedMinutes: block.result.missedMinutes,
      }
    : null

  const normalizedBlock: DbNormalizedBlock = {
    id: block.id,
    workoutId,
    kind: 'emom',
    orderIndex: block.orderIndex,
    config,
    result,
    exerciseId: null,
    exerciseName: null,
    equipment: null,
    targetReps: null,
    thumbnail: null,
  }

  const blockExercises: ReadonlyArray<DbNormalizedBlockExercise> = block.exercises.map((ex, idx) => ({
    id: ex.id,
    blockId: block.id,
    orderIndex: idx,
    exerciseId: null,
    name: ex.name,
    prescribedReps: ex.prescribedReps,
    load: ex.load,
    thumbnail: ex.thumbnail,
  }))

  return { normalizedBlock, blockExercises }
}

/**
 * Normalize AMRAP block for storage.
 */
function normalizeAmrapBlock(
  block: DbAmrapBlock,
  workoutId: string,
): {
  normalizedBlock: DbNormalizedBlock
  blockExercises: ReadonlyArray<DbNormalizedBlockExercise>
} {
  const config: DbBlockConfig = {
    kind: 'amrap',
    durationSeconds: block.config.durationSeconds,
  }

  const result: DbBlockResult | null = block.result
    ? {
        kind: 'amrap',
        rounds: block.result.rounds,
        partialReps: block.result.partialReps,
        actualDuration: block.result.actualDuration,
      }
    : null

  const normalizedBlock: DbNormalizedBlock = {
    id: block.id,
    workoutId,
    kind: 'amrap',
    orderIndex: block.orderIndex,
    config,
    result,
    exerciseId: null,
    exerciseName: null,
    equipment: null,
    targetReps: null,
    thumbnail: null,
  }

  const blockExercises: ReadonlyArray<DbNormalizedBlockExercise> = block.exercises.map((ex, idx) => ({
    id: ex.id,
    blockId: block.id,
    orderIndex: idx,
    exerciseId: null,
    name: ex.name,
    prescribedReps: ex.prescribedReps,
    load: ex.load,
    thumbnail: ex.thumbnail,
  }))

  return { normalizedBlock, blockExercises }
}

/**
 * Normalize Tabata block for storage.
 */
function normalizeTabataBlock(
  block: DbTabataBlock,
  workoutId: string,
): {
  normalizedBlock: DbNormalizedBlock
  blockExercises: ReadonlyArray<DbNormalizedBlockExercise>
} {
  const config: DbBlockConfig = {
    kind: 'tabata',
    rounds: block.config.rounds,
    workSeconds: block.config.workSeconds,
    restSeconds: block.config.restSeconds,
  }

  const result: DbBlockResult | null = block.result
    ? {
        kind: 'tabata',
        repsPerRound: block.result.repsPerRound,
      }
    : null

  const normalizedBlock: DbNormalizedBlock = {
    id: block.id,
    workoutId,
    kind: 'tabata',
    orderIndex: block.orderIndex,
    config,
    result,
    exerciseId: null,
    exerciseName: null,
    equipment: null,
    targetReps: null,
    thumbnail: null,
  }

  // Tabata has a single exercise
  const blockExercises: ReadonlyArray<DbNormalizedBlockExercise> = [
    {
      id: block.exercise.id,
      blockId: block.id,
      orderIndex: 0,
      exerciseId: null,
      name: block.exercise.name,
      prescribedReps: block.exercise.prescribedReps,
      load: block.exercise.load,
      thumbnail: block.exercise.thumbnail,
    },
  ]

  return { normalizedBlock, blockExercises }
}

/**
 * Normalize ForTime block for storage.
 */
function normalizeForTimeBlock(
  block: DbForTimeBlock,
  workoutId: string,
): {
  normalizedBlock: DbNormalizedBlock
  blockExercises: ReadonlyArray<DbNormalizedBlockExercise>
} {
  const config: DbBlockConfig = {
    kind: 'fortime',
    timeCapSeconds: block.config.timeCapSeconds,
  }

  const result: DbBlockResult | null = block.result
    ? {
        kind: 'fortime',
        completionTime: block.result.completionTime,
        completed: block.result.completed,
        splitTimes: block.result.splitTimes,
      }
    : null

  const normalizedBlock: DbNormalizedBlock = {
    id: block.id,
    workoutId,
    kind: 'fortime',
    orderIndex: block.orderIndex,
    config,
    result,
    exerciseId: null,
    exerciseName: null,
    equipment: null,
    targetReps: null,
    thumbnail: null,
  }

  const blockExercises: ReadonlyArray<DbNormalizedBlockExercise> = block.exercises.map((ex, idx) => ({
    id: ex.id,
    blockId: block.id,
    orderIndex: idx,
    exerciseId: null,
    name: ex.name,
    prescribedReps: ex.prescribedReps,
    load: ex.load,
    thumbnail: ex.thumbnail,
  }))

  return { normalizedBlock, blockExercises }
}

/**
 * Normalize Cardio block for storage.
 */
function normalizeCardioBlock(block: DbCardioBlock, workoutId: string): DbNormalizedBlock {
  const config: DbBlockConfig = {
    kind: 'cardio',
    activity: block.config.activity,
    targetDurationSeconds: block.config.targetDurationSeconds,
    targetDistanceMeters: block.config.targetDistanceMeters,
  }

  const result: DbBlockResult | null = block.result
    ? {
        kind: 'cardio',
        actualDurationSeconds: block.result.actualDurationSeconds,
        distanceMeters: block.result.distanceMeters,
        avgPaceSecondsPerKm: block.result.avgPaceSecondsPerKm,
        calories: block.result.calories,
        notes: block.result.notes,
      }
    : null

  return {
    id: block.id,
    workoutId,
    kind: 'cardio',
    orderIndex: block.orderIndex,
    config,
    result,
    exerciseId: null,
    exerciseName: null,
    equipment: null,
    targetReps: null,
    thumbnail: null,
  }
}

/**
 * Normalize all blocks from an embedded workout structure.
 */
function normalizeBlocks(
  blocks: ReadonlyArray<DbWorkoutBlock>,
  workoutId: string,
): {
  normalizedBlocks: ReadonlyArray<DbNormalizedBlock>
  allSets: ReadonlyArray<DbNormalizedSet>
  allBlockExercises: ReadonlyArray<DbNormalizedBlockExercise>
} {
  const normalizedBlocks: Array<DbNormalizedBlock> = []
  const allSets: Array<DbNormalizedSet> = []
  const allBlockExercises: Array<DbNormalizedBlockExercise> = []

  for (const block of blocks) {
    switch (block.kind) {
      case 'strength': {
        const { normalizedBlock, sets } = normalizeStrengthBlock(block, workoutId)
        normalizedBlocks.push(normalizedBlock)
        allSets.push(...sets)
        break
      }
      case 'emom': {
        const { normalizedBlock, blockExercises } = normalizeEmomBlock(block, workoutId)
        normalizedBlocks.push(normalizedBlock)
        allBlockExercises.push(...blockExercises)
        break
      }
      case 'amrap': {
        const { normalizedBlock, blockExercises } = normalizeAmrapBlock(block, workoutId)
        normalizedBlocks.push(normalizedBlock)
        allBlockExercises.push(...blockExercises)
        break
      }
      case 'tabata': {
        const { normalizedBlock, blockExercises } = normalizeTabataBlock(block, workoutId)
        normalizedBlocks.push(normalizedBlock)
        allBlockExercises.push(...blockExercises)
        break
      }
      case 'fortime': {
        const { normalizedBlock, blockExercises } = normalizeForTimeBlock(block, workoutId)
        normalizedBlocks.push(normalizedBlock)
        allBlockExercises.push(...blockExercises)
        break
      }
      case 'cardio': {
        const normalizedBlock = normalizeCardioBlock(block, workoutId)
        normalizedBlocks.push(normalizedBlock)
        break
      }
    }
  }

  return { normalizedBlocks, allSets, allBlockExercises }
}

/**
 * Reassemble a DbWorkoutBlock from normalized data.
 */
function assembleBlock(
  normalizedBlock: DbNormalizedBlock,
  sets: ReadonlyArray<DbNormalizedSet>,
  blockExercises: ReadonlyArray<DbNormalizedBlockExercise>,
): DbWorkoutBlock {
  switch (normalizedBlock.kind) {
    case 'strength': {
      const config = normalizedBlock.config as { kind: 'strength' }
      void config // We know it's strength kind
      return {
        kind: 'strength',
        id: normalizedBlock.id,
        exerciseDefinitionId: normalizedBlock.exerciseId,
        name: normalizedBlock.exerciseName ?? '',
        equipment: normalizedBlock.equipment ?? '',
        targetReps: normalizedBlock.targetReps ?? 0,
        thumbnail: normalizedBlock.thumbnail ?? '',
        orderIndex: normalizedBlock.orderIndex,
        sets: sets.map((set) => ({
          id: set.id,
          kg: set.kg,
          reps: set.reps,
          rir: set.rir,
          status: set.status,
          completedAt: set.completedAt,
        })),
      }
    }
    case 'emom': {
      const config = normalizedBlock.config as { kind: 'emom'; minutes: number; exerciseRotation: 'each-minute' | 'full-round' }
      const result = normalizedBlock.result as { kind: 'emom'; completedMinutes: number; missedMinutes: ReadonlyArray<number> } | null
      return {
        kind: 'emom',
        id: normalizedBlock.id,
        orderIndex: normalizedBlock.orderIndex,
        config: {
          minutes: config.minutes,
          exerciseRotation: config.exerciseRotation,
        },
        exercises: blockExercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
        result: result
          ? {
              completedMinutes: result.completedMinutes,
              missedMinutes: result.missedMinutes,
            }
          : null,
      }
    }
    case 'amrap': {
      const config = normalizedBlock.config as { kind: 'amrap'; durationSeconds: number }
      const result = normalizedBlock.result as { kind: 'amrap'; rounds: number; partialReps: number; actualDuration: number } | null
      return {
        kind: 'amrap',
        id: normalizedBlock.id,
        orderIndex: normalizedBlock.orderIndex,
        config: {
          durationSeconds: config.durationSeconds,
        },
        exercises: blockExercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
        result: result
          ? {
              rounds: result.rounds,
              partialReps: result.partialReps,
              actualDuration: result.actualDuration,
            }
          : null,
      }
    }
    case 'tabata': {
      const config = normalizedBlock.config as { kind: 'tabata'; rounds: number; workSeconds: number; restSeconds: number }
      const result = normalizedBlock.result as { kind: 'tabata'; repsPerRound: ReadonlyArray<number> } | null
      const exercise = blockExercises[0]
      return {
        kind: 'tabata',
        id: normalizedBlock.id,
        orderIndex: normalizedBlock.orderIndex,
        config: {
          rounds: config.rounds,
          workSeconds: config.workSeconds,
          restSeconds: config.restSeconds,
        },
        exercise: exercise
          ? {
              id: exercise.id,
              name: exercise.name,
              prescribedReps: exercise.prescribedReps,
              load: exercise.load,
              thumbnail: exercise.thumbnail,
            }
          : { id: '', name: '', prescribedReps: 0, load: null, thumbnail: '' },
        result: result
          ? {
              repsPerRound: result.repsPerRound,
            }
          : null,
      }
    }
    case 'fortime': {
      const config = normalizedBlock.config as { kind: 'fortime'; timeCapSeconds: number | null }
      const result = normalizedBlock.result as { kind: 'fortime'; completionTime: number; completed: boolean; splitTimes?: ReadonlyArray<number> } | null
      return {
        kind: 'fortime',
        id: normalizedBlock.id,
        orderIndex: normalizedBlock.orderIndex,
        config: {
          timeCapSeconds: config.timeCapSeconds,
        },
        exercises: blockExercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          load: ex.load,
          thumbnail: ex.thumbnail,
        })),
        result: result
          ? {
              completionTime: result.completionTime,
              completed: result.completed,
              splitTimes: result.splitTimes,
            }
          : null,
      }
    }
    case 'cardio': {
      const config = normalizedBlock.config as { kind: 'cardio'; activity: DbCardioBlock['config']['activity']; targetDurationSeconds: number | null; targetDistanceMeters: number | null }
      const result = normalizedBlock.result as { kind: 'cardio'; actualDurationSeconds: number; distanceMeters: number | null; avgPaceSecondsPerKm: number | null; calories: number | null; notes: string | null } | null
      return {
        kind: 'cardio',
        id: normalizedBlock.id,
        orderIndex: normalizedBlock.orderIndex,
        config: {
          activity: config.activity,
          targetDurationSeconds: config.targetDurationSeconds,
          targetDistanceMeters: config.targetDistanceMeters,
        },
        result: result
          ? {
              actualDurationSeconds: result.actualDurationSeconds,
              distanceMeters: result.distanceMeters,
              avgPaceSecondsPerKm: result.avgPaceSecondsPerKm,
              calories: result.calories,
              notes: result.notes,
            }
          : null,
      }
    }
  }
}

export function createDexieWorkoutsRepository(): WorkoutsRepository {
  return {
    async completeWorkout(
      activeWorkout: Readonly<DbActiveWorkout>,
      notes = '',
    ): Promise<DbWorkoutHeader> {
      const now = Date.now()
      const workoutId = generateId()
      const durationSeconds = Math.floor((now - activeWorkout.startedAt) / 1000)

      // Compute stats from embedded blocks
      const stats = computeStats(activeWorkout.blocks)

      // Normalize blocks
      const { normalizedBlocks, allSets, allBlockExercises } = normalizeBlocks(
        activeWorkout.blocks,
        workoutId,
      )

      // Create workout header
      const header: DbWorkoutHeader = {
        id: workoutId,
        name: activeWorkout.name,
        startedAt: activeWorkout.startedAt,
        completedAt: now,
        durationSeconds,
        notes,
        benchmarkId: activeWorkout.benchmarkId,
        templateId: null,
        stats,
      }

      // Transaction: Save everything atomically
      await db.transaction(
        'rw',
        [db.workoutHeaders, db.workoutBlocks, db.workoutSets, db.blockExercises, db.activeWorkout],
        async () => {
          await db.workoutHeaders.add(header)
          await db.workoutBlocks.bulkAdd([...normalizedBlocks])
          if (allSets.length > 0) {
            await db.workoutSets.bulkAdd([...allSets])
          }
          if (allBlockExercises.length > 0) {
            await db.blockExercises.bulkAdd([...allBlockExercises])
          }
          await db.activeWorkout.delete('current')
        },
      )

      return header
    },

    async add(workout: Readonly<DbCompletedWorkout>): Promise<void> {
      const workoutId = workout.id

      // Compute stats from embedded blocks
      const stats = computeStats(workout.blocks)

      // Normalize blocks
      const { normalizedBlocks, allSets, allBlockExercises } = normalizeBlocks(
        workout.blocks,
        workoutId,
      )

      // Create workout header
      const header: DbWorkoutHeader = {
        id: workoutId,
        name: workout.name,
        startedAt: workout.startedAt,
        completedAt: workout.completedAt,
        durationSeconds: workout.durationSeconds,
        notes: workout.notes,
        benchmarkId: workout.benchmarkId,
        templateId: null,
        stats,
      }

      // Transaction: Save everything atomically
      await db.transaction(
        'rw',
        [db.workoutHeaders, db.workoutBlocks, db.workoutSets, db.blockExercises],
        async () => {
          await db.workoutHeaders.add(header)
          await db.workoutBlocks.bulkAdd([...normalizedBlocks])
          if (allSets.length > 0) {
            await db.workoutSets.bulkAdd([...allSets])
          }
          if (allBlockExercises.length > 0) {
            await db.blockExercises.bulkAdd([...allBlockExercises])
          }
        },
      )
    },

    async getHistory(params: GetHistoryParams = {}): Promise<ReadonlyArray<DbWorkoutHeader>> {
      const { limit = 50, offset = 0 } = params
      return db.workoutHeaders.orderBy('completedAt').reverse().offset(offset).limit(limit).toArray()
    },

    async getByDateRange(
      params: GetByDateRangeParams,
    ): Promise<ReadonlyArray<DbWorkoutHeader>> {
      return db.workoutHeaders.where('completedAt').between(params.startDate, params.endDate).toArray()
    },

    async getHeaderById(id: string): Promise<DbWorkoutHeader | undefined> {
      return db.workoutHeaders.get(id)
    },

    async getById(id: string): Promise<WorkoutWithBlocks | undefined> {
      const header = await db.workoutHeaders.get(id)
      if (!header) {
        return undefined
      }

      // Get all blocks for this workout
      const normalizedBlocks = await db.workoutBlocks
        .where('workoutId')
        .equals(id)
        .sortBy('orderIndex')

      // Collect block IDs
      const blockIds = normalizedBlocks.map((b) => b.id)

      // Get all sets and block exercises in parallel
      const [allSets, allBlockExercises] = await Promise.all([
        db.workoutSets.where('blockId').anyOf(blockIds).toArray(),
        db.blockExercises.where('blockId').anyOf(blockIds).toArray(),
      ])

      // Group sets and exercises by block ID
      const setsByBlockId = new Map<string, Array<DbNormalizedSet>>()
      for (const set of allSets) {
        const existing = setsByBlockId.get(set.blockId) ?? []
        existing.push(set)
        setsByBlockId.set(set.blockId, existing)
      }

      const exercisesByBlockId = new Map<string, Array<DbNormalizedBlockExercise>>()
      for (const ex of allBlockExercises) {
        const existing = exercisesByBlockId.get(ex.blockId) ?? []
        existing.push(ex)
        exercisesByBlockId.set(ex.blockId, existing)
      }

      // Assemble blocks
      const blocks: Array<DbWorkoutBlock> = normalizedBlocks.map((normalizedBlock) => {
        const blockSets = (setsByBlockId.get(normalizedBlock.id) ?? []).toSorted(
          (a, b) => a.orderIndex - b.orderIndex,
        )
        const blockExercises = (exercisesByBlockId.get(normalizedBlock.id) ?? []).toSorted(
          (a, b) => a.orderIndex - b.orderIndex,
        )
        return assembleBlock(normalizedBlock, blockSets, blockExercises)
      })

      return {
        ...header,
        blocks,
      }
    },

    async delete(id: string): Promise<void> {
      // Get block IDs first
      const blocks = await db.workoutBlocks.where('workoutId').equals(id).toArray()
      const blockIds = blocks.map((b) => b.id)

      // Delete everything in a transaction
      await db.transaction(
        'rw',
        [db.workoutHeaders, db.workoutBlocks, db.workoutSets, db.blockExercises],
        async () => {
          if (blockIds.length > 0) {
            await db.workoutSets.where('blockId').anyOf(blockIds).delete()
            await db.blockExercises.where('blockId').anyOf(blockIds).delete()
          }
          await db.workoutBlocks.where('workoutId').equals(id).delete()
          await db.workoutHeaders.delete(id)
        },
      )
    },

    async bulkDelete(ids: ReadonlyArray<string>): Promise<void> {
      if (ids.length === 0) return

      // Get all block IDs
      const blocks = await db.workoutBlocks.where('workoutId').anyOf([...ids]).toArray()
      const blockIds = blocks.map((b) => b.id)

      // Delete everything in a transaction
      await db.transaction(
        'rw',
        [db.workoutHeaders, db.workoutBlocks, db.workoutSets, db.blockExercises],
        async () => {
          if (blockIds.length > 0) {
            await db.workoutSets.where('blockId').anyOf(blockIds).delete()
            await db.blockExercises.where('blockId').anyOf(blockIds).delete()
          }
          await db.workoutBlocks.where('workoutId').anyOf([...ids]).delete()
          await db.workoutHeaders.bulkDelete([...ids])
        },
      )
    },

    async count(): Promise<number> {
      return db.workoutHeaders.count()
    },

    async startFromCompleted(id: string): Promise<DbActiveWorkout> {
      const workoutWithBlocks = await this.getById(id)
      if (!workoutWithBlocks) {
        throw createDatabaseError('NOT_FOUND', 'start workout from history')
      }

      const now = Date.now()

      // Sort blocks by orderIndex to ensure correct order
      const sortedBlocks = workoutWithBlocks.blocks.toSorted(
        (a, b) => a.orderIndex - b.orderIndex,
      )

      // Map blocks with new IDs while preserving all data
      const newBlocks: ReadonlyArray<DbWorkoutBlock> = sortedBlocks.map((block) => {
        if (isDbStrengthBlock(block)) {
          // Strength block - reset set statuses
          return {
            ...block,
            id: generateId(),
            sets: block.sets.map((set) => ({
              id: generateId(),
              kg: set.kg,
              reps: set.reps,
              rir: set.rir,
              status: 'planned' as const,
              completedAt: null,
            })),
          }
        }

        // Timed blocks - reset results
        return {
          ...block,
          id: generateId(),
          result: null,
        }
      })

      const activeWorkout: DbActiveWorkout = {
        id: 'current',
        name: workoutWithBlocks.name,
        blocks: newBlocks,
        selectedBlockIndex: 0,
        startedAt: now,
        lastModifiedAt: now,
        mode: 'builder',
        activeSetIndex: null,
        activeExerciseIndex: null,
        benchmarkId: null,
        globalTimerStartedAt: null,
      }

      await db.activeWorkout.put(activeWorkout)
      return activeWorkout
    },
  }
}
