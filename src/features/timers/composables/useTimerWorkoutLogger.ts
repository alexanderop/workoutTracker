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

// Type guards for session types
function isAmrapSession(session: TimerSession): session is AmrapSession {
  return session.block.kind === 'amrap'
}

function isEmomSession(session: TimerSession): session is EmomSession {
  return session.block.kind === 'emom'
}

function isTabataSession(session: TimerSession): session is TabataSession {
  return session.block.kind === 'tabata'
}

// isForTimeSession not needed - used as fallback in convertSessionToDbBlock

/**
 * Generates a human-readable workout name from timer type and config.
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

function createAmrapDbBlock(block: AmrapBlock, result: AmrapResult): DbAmrapBlock {
  return {
    id: generateId(),
    orderIndex: 0,
    kind: 'amrap',
    config: { ...block.config }, // Spread to create plain object
    exercises: [], // Empty for standalone timer
    result: { ...result },
  }
}

function createEmomDbBlock(block: EmomBlock, result: EmomResult): DbEmomBlock {
  return {
    id: generateId(),
    orderIndex: 0,
    kind: 'emom',
    config: { ...block.config }, // Spread to create plain object
    exercises: [], // Empty for standalone timer
    result: { ...result },
  }
}

function createTabataDbBlock(block: TabataBlock, result: TabataResult): DbTabataBlock {
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

function createForTimeDbBlock(block: ForTimeBlock, result: ForTimeResult): DbForTimeBlock {
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
 * Converts a timer session to a database block using type guards.
 */
function convertSessionToDbBlock(session: TimerSession): DbWorkoutBlock {
  if (isAmrapSession(session)) {
    return createAmrapDbBlock(session.block, session.result)
  }
  if (isEmomSession(session)) {
    return createEmomDbBlock(session.block, session.result)
  }
  if (isTabataSession(session)) {
    return createTabataDbBlock(session.block, session.result)
  }
  // Must be ForTime at this point
  return createForTimeDbBlock(session.block, session.result)
}

// Export for external use
export type { TimerSession, AmrapSession, EmomSession, TabataSession, ForTimeSession }

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
    const dbBlock = convertSessionToDbBlock(session)

    const workout: DbCompletedWorkout = {
      id: generateId(),
      name: workoutName,
      blocks: [dbBlock],
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
