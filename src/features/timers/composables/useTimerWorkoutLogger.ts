/**
 * Composable for logging standalone timer sessions as workouts.
 *
 * Converts a timer block + result into a DbCompletedWorkout and saves it to history.
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  AmrapBlock,
  EmomBlock,
  TabataBlock,
  ForTimeBlock,
  AmrapResult,
  EmomResult,
  TabataResult,
  ForTimeResult,
} from '@/types/blocks'
import type {
  DbAmrapBlock,
  DbEmomBlock,
  DbTabataBlock,
  DbForTimeBlock,
  DbCompletedWorkout,
  DbWorkoutBlock,
} from '@/db/schema'
import { getWorkoutsRepository, generateId } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

type TimedBlock = AmrapBlock | EmomBlock | TabataBlock | ForTimeBlock

type AmrapSession = {
  block: AmrapBlock
  result: AmrapResult
  startedAt: number
  completedAt: number
}

type EmomSession = {
  block: EmomBlock
  result: EmomResult
  startedAt: number
  completedAt: number
}

type TabataSession = {
  block: TabataBlock
  result: TabataResult
  startedAt: number
  completedAt: number
}

type ForTimeSession = {
  block: ForTimeBlock
  result: ForTimeResult
  startedAt: number
  completedAt: number
}

type TimerSession = AmrapSession | EmomSession | TabataSession | ForTimeSession

/**
 * Check whether a TimerSession represents an AMRAP session.
 *
 * @returns `true` if `session` is an `AmrapSession`, `false` otherwise.
 */
function isAmrapSession(session: TimerSession): session is AmrapSession {
  return session.block.kind === 'amrap'
}

/**
 * Type guard that determines whether a timer session represents an EMOM session.
 *
 * @param session - The timer session to check
 * @returns `true` if the session is an EMOM session, `false` otherwise.
 */
function isEmomSession(session: TimerSession): session is EmomSession {
  return session.block.kind === 'emom'
}

/**
 * Determines whether the given timer session represents a Tabata session.
 *
 * @returns `true` if the session's block kind is `'tabata'`, `false` otherwise.
 */
function isTabataSession(session: TimerSession): session is TabataSession {
  return session.block.kind === 'tabata'
}

// isForTimeSession not needed - used as fallback in convertSessionToDbBlock

/**
 * Create a human-readable workout name from a timer block using translations.
 *
 * @param block - The timer block (AMRAP, EMOM, Tabata, or For Time) whose config determines the name
 * @param t - i18n translation function used to localize the timer type label
 * @returns A formatted workout name, for example: `5 min AMRAP`, `EMOM 10 min`, `TABATA 8×20/10`, or `FOR TIME (10 min cap)`
 */
function generateWorkoutName(block: TimedBlock, t: ReturnType<typeof useI18n>['t']): string {
  const timerType = t(`timers.types.${block.kind}`).toUpperCase()

  switch (block.kind) {
    case 'amrap': {
      const minutes = Math.floor(block.config.durationSeconds / 60)
      return `${minutes} min ${timerType}`
    }
    case 'emom': {
      return `${block.config.minutes} min ${timerType}`
    }
    case 'tabata': {
      const { rounds, workSeconds, restSeconds } = block.config
      return `${timerType} ${rounds}×${workSeconds}/${restSeconds}`
    }
    case 'fortime': {
      if (block.config.timeCapSeconds) {
        const minutes = Math.floor(block.config.timeCapSeconds / 60)
        return `${timerType} (${minutes} min cap)`
      }
      return timerType
    }
  }
}

/**
 * Create a database-ready AMRAP block from a timer block and its result for standalone storage.
 *
 * @param block - Source AMRAP timer block whose configuration will be copied into the DB block
 * @param result - Result produced by the timer session to store with the DB block
 * @returns A DbAmrapBlock with a generated `id`, `orderIndex` set to 0, `kind` set to `"amrap"`, a plain copy of `config`, an empty `exercises` array, and a copy of `result`
 */
function createAmrapDatabaseBlock(block: AmrapBlock, result: AmrapResult): DbAmrapBlock {
  return {
    id: generateId(),
    orderIndex: 0,
    kind: 'amrap',
    config: { ...block.config }, // Spread to create plain object
    exercises: [], // Empty for standalone timer
    result: { ...result },
  }
}

/**
 * Create a database-ready EMOM block representing a standalone timer session.
 *
 * Produces a DbEmomBlock with a generated `id`, `orderIndex` set to 0, `kind` "emom",
 * a plain `config` object copied from the source block, an empty `exercises` array,
 * and the provided `result`.
 *
 * @param block - The EMOM timer block to convert
 * @param result - The EMOM session result to attach to the DB block
 * @returns The constructed DbEmomBlock ready for persistence
 */
function createEmomDatabaseBlock(block: EmomBlock, result: EmomResult): DbEmomBlock {
  return {
    id: generateId(),
    orderIndex: 0,
    kind: 'emom',
    config: { ...block.config }, // Spread to create plain object
    exercises: [], // Empty for standalone timer
    result: { ...result },
  }
}

/**
 * Create a database-ready Tabata block from a timer Tabata block and its result.
 *
 * The returned block has new identifiers, orderIndex set to 0, and includes a single
 * placeholder exercise named "Conditioning" for standalone workout logging.
 *
 * @param block - Source Tabata block configuration to convert
 * @param result - Recorded result for the Tabata block
 * @returns A DbTabataBlock populated with the provided config and result, ready for persistence
 */
function createTabataDatabaseBlock(block: TabataBlock, result: TabataResult): DbTabataBlock {
  return {
    id: generateId(),
    orderIndex: 0,
    kind: 'tabata',
    config: { ...block.config }, // Spread to create plain object
    // Tabata has a single exercise, use placeholder for standalone
    exercise: {
      id: generateId(),
      name: 'Conditioning',
      prescribedReps: 0,
      load: null,
      image: null,
    },
    result: { ...result },
  }
}

/**
 * Create a database-ready For Time block representing a standalone timer session.
 *
 * The returned block has a newly generated `id`, `orderIndex` set to 0, `kind` set to `"fortime"`,
 * a shallow copy of the block's `config` and `result`, and an empty `exercises` array.
 *
 * @param block - The original For Time timer block to convert
 * @param result - The completed result from the timer session
 * @returns A `DbForTimeBlock` suitable for persisting as a standalone workout block
 */
function createForTimeDatabaseBlock(block: ForTimeBlock, result: ForTimeResult): DbForTimeBlock {
  return {
    id: generateId(),
    orderIndex: 0,
    kind: 'fortime',
    config: { ...block.config }, // Spread to create plain object
    exercises: [], // Empty for standalone timer
    result: { ...result },
  }
}

/**
 * Convert a timer session into a database-ready workout block.
 *
 * @param session - The timer session (AMRAP, EMOM, Tabata, or ForTime) to convert
 * @returns A `DbWorkoutBlock` representing the session suitable for persistence
 */
function convertSessionToDatabaseBlock(session: TimerSession): DbWorkoutBlock {
  if (isAmrapSession(session)) {
    return createAmrapDatabaseBlock(session.block, session.result)
  }
  if (isEmomSession(session)) {
    return createEmomDatabaseBlock(session.block, session.result)
  }
  if (isTabataSession(session)) {
    return createTabataDatabaseBlock(session.block, session.result)
  }
  // Must be ForTime at this point
  return createForTimeDatabaseBlock(session.block, session.result)
}

/**
 * Composable that logs standalone timer sessions as completed workouts and exposes logging state and helpers.
 *
 * Provides reactive flags to track whether a workout has been logged (`isLogged`) and whether a save is in progress (`isSaving`), helpers to persist AMRAP/EMOM/Tabata/For Time sessions as completed workouts, and a `reset` function to clear the logged state.
 *
 * @returns An object containing:
 *  - `isLogged` — a reactive flag indicating a workout has been logged
 *  - `isSaving` — a reactive flag indicating a save is in progress
 *  - `logAmrap`, `logEmom`, `logTabata`, `logForTime` — functions that persist a session and return the created workout id or `null` on failure or when saving is blocked
 *  - `reset` — clears the logged state so a new session can be recorded
 */
export function useTimerWorkoutLogger() {
  const { t } = useI18n()
  const isLogged = ref(false)
  const isSaving = ref(false)

  /**
   * Logs an AMRAP timer session as a completed workout.
   */
  async function logAmrap(
    block: AmrapBlock,
    result: AmrapResult,
    startedAt: number,
    completedAt: number,
  ): Promise<string | null> {
    return saveWorkout({ block, result, startedAt, completedAt })
  }

  /**
   * Logs an EMOM timer session as a completed workout.
   */
  async function logEmom(
    block: EmomBlock,
    result: EmomResult,
    startedAt: number,
    completedAt: number,
  ): Promise<string | null> {
    return saveWorkout({ block, result, startedAt, completedAt })
  }

  /**
   * Logs a Tabata timer session as a completed workout.
   */
  async function logTabata(
    block: TabataBlock,
    result: TabataResult,
    startedAt: number,
    completedAt: number,
  ): Promise<string | null> {
    return saveWorkout({ block, result, startedAt, completedAt })
  }

  /**
   * Logs a For Time timer session as a completed workout.
   */
  async function logForTime(
    block: ForTimeBlock,
    result: ForTimeResult,
    startedAt: number,
    completedAt: number,
  ): Promise<string | null> {
    return saveWorkout({ block, result, startedAt, completedAt })
  }

  /**
   * Internal function to save a workout from a typed session.
   */
  async function saveWorkout(session: TimerSession): Promise<string | null> {
    if (isLogged.value || isSaving.value) {
      return null
    }

    isSaving.value = true

    const workoutName = generateWorkoutName(session.block, t)
    const databaseBlock = convertSessionToDatabaseBlock(session)

    const workout: DbCompletedWorkout = {
      id: generateId(),
      name: workoutName,
      blocks: [databaseBlock],
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      durationSeconds: Math.floor((session.completedAt - session.startedAt) / 1000),
      notes: '',
      benchmarkId: null,
    }

    const [error] = await tryCatch(getWorkoutsRepository().add(workout))

    isSaving.value = false

    if (error) {
      return null
    }

    isLogged.value = true
    return workout.id
  }

  /**
   * Resets the logged state (e.g., when starting a new timer).
   */
  function reset() {
    isLogged.value = false
  }

  return {
    isLogged,
    isSaving,
    logAmrap,
    logEmom,
    logTabata,
    logForTime,
    reset,
  }
}