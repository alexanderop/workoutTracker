import { ref } from 'vue'
import type { WorkoutBlock, StrengthBlock, AmrapBlock, EmomBlock, TabataBlock, ForTimeBlock, CardioBlock } from '@/types/blocks'
import type { Set } from '@/types/workout'
import type { DbCompletedWorkout, DbWorkoutBlock, DbStrengthBlock, DbSet, DbAmrapBlock, DbEmomBlock, DbTabataBlock, DbForTimeBlock, DbCardioBlock, DbBlockExercise } from '@/db/schema'
import { getWorkoutsRepository, generateId } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

type PastWorkoutData = {
  name: string
  date: Date
  durationMinutes: number
  blocks: ReadonlyArray<WorkoutBlock>
}

function convertSetToDb(set: Readonly<Set>): DbSet {
  return {
    id: generateId(),
    kg: set.kg,
    reps: set.reps,
    rir: set.rir,
    status: 'completed',
    completedAt: Date.now(),
  }
}

function convertStrengthBlockToDb(block: Readonly<StrengthBlock>, orderIndex: number): DbStrengthBlock {
  return {
    kind: 'strength',
    id: generateId(),
    exerciseDefinitionId: block.exerciseDefinitionId,
    name: block.name,
    equipment: block.equipment,
    targetReps: block.targetReps,
    sets: block.sets.map(convertSetToDb),
    orderIndex,
    image: block.image,
  }
}

function convertBlockExerciseToDb(exercise: { id: string; name: string; prescribedReps: number; load: string | null; image: Blob | null }): DbBlockExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    image: exercise.image,
  }
}

function convertAmrapBlockToDb(block: Readonly<AmrapBlock>, orderIndex: number): DbAmrapBlock {
  return {
    kind: 'amrap',
    id: generateId(),
    config: {
      durationSeconds: block.config.durationSeconds,
    },
    exercises: block.exercises.map(convertBlockExerciseToDb),
    result: block.result ? {
      rounds: block.result.rounds,
      partialReps: block.result.partialReps,
      actualDuration: block.result.actualDuration,
    } : null,
    orderIndex,
  }
}

function convertEmomBlockToDb(block: Readonly<EmomBlock>, orderIndex: number): DbEmomBlock {
  return {
    kind: 'emom',
    id: generateId(),
    config: {
      minutes: block.config.minutes,
      exerciseRotation: block.config.exerciseRotation,
    },
    exercises: block.exercises.map(convertBlockExerciseToDb),
    result: block.result ? {
      completedMinutes: block.result.completedMinutes,
      missedMinutes: [...block.result.missedMinutes],
    } : null,
    orderIndex,
  }
}

function convertTabataBlockToDb(block: Readonly<TabataBlock>, orderIndex: number): DbTabataBlock {
  return {
    kind: 'tabata',
    id: generateId(),
    config: {
      rounds: block.config.rounds,
      workSeconds: block.config.workSeconds,
      restSeconds: block.config.restSeconds,
    },
    exercise: convertBlockExerciseToDb(block.exercise),
    result: block.result ? {
      repsPerRound: [...block.result.repsPerRound],
    } : null,
    orderIndex,
  }
}

function convertForTimeBlockToDb(block: Readonly<ForTimeBlock>, orderIndex: number): DbForTimeBlock {
  return {
    kind: 'fortime',
    id: generateId(),
    config: {
      timeCapSeconds: block.config.timeCapSeconds,
    },
    exercises: block.exercises.map(convertBlockExerciseToDb),
    result: block.result ? {
      completionTime: block.result.completionTime,
      completed: block.result.completed,
      splitTimes: block.result.splitTimes,
    } : null,
    orderIndex,
  }
}

function convertCardioBlockToDb(block: Readonly<CardioBlock>, orderIndex: number): DbCardioBlock {
  return {
    kind: 'cardio',
    id: generateId(),
    config: {
      activity: block.config.activity,
      targetDurationSeconds: block.config.targetDurationSeconds,
      targetDistanceMeters: block.config.targetDistanceMeters,
    },
    result: block.result ? {
      actualDurationSeconds: block.result.actualDurationSeconds,
      distanceMeters: block.result.distanceMeters,
      avgPaceSecondsPerKm: block.result.avgPaceSecondsPerKm,
      calories: block.result.calories,
      notes: block.result.notes,
    } : null,
    orderIndex,
  }
}

function convertBlockToDb(block: Readonly<WorkoutBlock>, orderIndex: number): DbWorkoutBlock {
  switch (block.kind) {
    case 'strength':
      return convertStrengthBlockToDb(block, orderIndex)
    case 'amrap':
      return convertAmrapBlockToDb(block, orderIndex)
    case 'emom':
      return convertEmomBlockToDb(block, orderIndex)
    case 'tabata':
      return convertTabataBlockToDb(block, orderIndex)
    case 'fortime':
      return convertForTimeBlockToDb(block, orderIndex)
    case 'cardio':
      return convertCardioBlockToDb(block, orderIndex)
  }
}

/**
 * Composable for saving past workouts to the database.
 * Converts domain workout data to database format and persists it.
 */
export function usePastWorkoutSave() {
  const isSaving = ref(false)
  const error = ref<string | undefined>(undefined)

  /**
   * Saves a past workout to the database with backdated timestamps.
   * @param data - The workout data including name, date, duration, and blocks
   * @returns The ID of the saved workout, or undefined if save failed
   */
  async function save(data: PastWorkoutData): Promise<string | undefined> {
    isSaving.value = true
    error.value = undefined

    // Calculate timestamps based on the provided date and duration
    const startedAt = data.date.getTime()
    const completedAt = startedAt + (data.durationMinutes * 60 * 1000)
    const durationSeconds = data.durationMinutes * 60

    // Convert blocks to database format
    const dbBlocks: ReadonlyArray<DbWorkoutBlock> = data.blocks.map((block, index) =>
      convertBlockToDb(block, index),
    )

    const workoutId = generateId()
    const dbWorkout: DbCompletedWorkout = {
      id: workoutId,
      name: data.name,
      blocks: dbBlocks,
      startedAt,
      completedAt,
      durationSeconds,
      notes: '',
      benchmarkId: null,
    }

    const [saveError] = await tryCatch(
      getWorkoutsRepository().add(dbWorkout),
    )

    isSaving.value = false

    if (saveError) {
      error.value = saveError.message
      return undefined
    }

    return workoutId
  }

  return {
    save,
    isSaving,
    error,
  }
}
