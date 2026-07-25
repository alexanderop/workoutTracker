import { assign, fromCallback, fromPromise, setup } from 'xstate'
import { getProgressionsRepository } from '@/db'
import type { DbProgression, DbProgressionSession } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import { calculateNextLevel } from '../lib/progressionLogic'

const TIMER_TICK_MS = 1000

export type LoadProgressionResult =
  | { status: 'ready'; progression: DbProgression }
  | { status: 'not-found' }
  | { status: 'already-complete' }

export type RecordSessionInput = {
  progressionId: string
  completed: boolean
  nextLevel?: {
    reps: number
    minutes: number
    weightIndex: number
    isComplete: boolean
  }
}

export type ProgressionSessionContext = {
  progressionId: string
  progression: DbProgression | null
  session: DbProgressionSession | null
  error: Error | null
  failedOperation: 'load' | 'save' | null
  canRetry: boolean
  pendingResult: boolean | null
  startedAt: number | null
  currentSecond: number
}

export type ProgressionSessionEvent =
  | { type: 'LOAD' }
  | { type: 'RETRY' }
  | { type: 'START'; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'CANCEL' }
  | { type: 'SUBMIT_RESULT'; completed: boolean }

export type ProgressionSessionInput = {
  progressionId: string
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function totalSeconds(progression: DbProgression | null): number {
  return (progression?.currentMinutes ?? 0) * 60
}

const loadProgression = fromPromise<LoadProgressionResult, { progressionId: string }>(
  async ({ input }) => {
    const [error, progression] = await tryCatch(
      getProgressionsRepository().getById(input.progressionId),
    )
    if (error) throw error

    if (!progression) return { status: 'not-found' }
    if (progression.isComplete) return { status: 'already-complete' }
    return { status: 'ready', progression }
  },
)

const recordSession = fromPromise<DbProgressionSession, RecordSessionInput>(async ({ input }) => {
  const [error, session] = await tryCatch(
    getProgressionsRepository().recordSession(
      input.progressionId,
      input.completed,
      input.nextLevel,
    ),
  )
  if (error) throw error
  return session
})

const ticker = fromCallback(({ sendBack }) => {
  const interval = globalThis.setInterval(() => {
    sendBack({ type: 'TICK', now: Date.now() })
  }, TIMER_TICK_MS)

  return () => {
    globalThis.clearInterval(interval)
  }
})

export const progressionSessionMachine = setup({
  // XState uses this erased value only to carry the machine's generic types.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  types: {} as {
    context: ProgressionSessionContext
    events: ProgressionSessionEvent
    input: ProgressionSessionInput
  },
  actors: {
    loadProgression,
    recordSession,
    ticker,
  },
  guards: {
    timerComplete: ({ context }) =>
      context.progression !== null && context.currentSecond >= totalSeconds(context.progression),
    retryLoad: ({ context }) => context.canRetry && context.failedOperation === 'load',
    retrySave: ({ context }) => context.canRetry && context.failedOperation === 'save',
  },
}).createMachine({
  id: 'progressionSession',
  initial: 'idle',
  context: ({ input }) => ({
    progressionId: input.progressionId,
    progression: null,
    session: null,
    error: null,
    failedOperation: null,
    canRetry: false,
    pendingResult: null,
    startedAt: null,
    currentSecond: 0,
  }),
  states: {
    idle: {
      on: {
        LOAD: 'loading',
      },
    },
    loading: {
      invoke: {
        src: 'loadProgression',
        input: ({ context }) => ({ progressionId: context.progressionId }),
        onDone: [
          {
            guard: ({ event }) => event.output.status === 'not-found',
            target: 'failure',
            actions: assign({
              error: () => new Error('Progression not found'),
              failedOperation: () => 'load' as const,
              canRetry: () => false,
            }),
          },
          {
            guard: ({ event }) => event.output.status === 'already-complete',
            target: 'failure',
            actions: assign({
              error: () => new Error('Progression already complete'),
              failedOperation: () => 'load' as const,
              canRetry: () => false,
            }),
          },
          {
            target: 'ready',
            actions: assign({
              progression: ({ event }) =>
                event.output.status === 'ready' ? event.output.progression : null,
              error: () => null,
              failedOperation: () => null,
              canRetry: () => false,
            }),
          },
        ],
        onError: {
          target: 'failure',
          actions: assign({
            error: ({ event }) => toError(event.error),
            failedOperation: () => 'load' as const,
            canRetry: () => true,
          }),
        },
      },
    },
    ready: {
      on: {
        START: {
          target: 'running',
          actions: assign({
            startedAt: ({ event }) => event.now,
            currentSecond: () => 0,
            session: () => null,
            error: () => null,
            failedOperation: () => null,
            canRetry: () => false,
            pendingResult: () => null,
          }),
        },
      },
    },
    running: {
      invoke: {
        src: 'ticker',
      },
      always: {
        guard: 'timerComplete',
        target: 'awaitingResult',
      },
      on: {
        TICK: {
          actions: assign({
            currentSecond: ({ context, event }) => {
              if (context.startedAt === null) return 0
              return Math.max(
                0,
                Math.min(
                  totalSeconds(context.progression),
                  Math.floor((event.now - context.startedAt) / 1000),
                ),
              )
            },
          }),
        },
        CANCEL: {
          target: 'ready',
          actions: assign({
            startedAt: () => null,
            currentSecond: () => 0,
          }),
        },
      },
    },
    awaitingResult: {
      on: {
        SUBMIT_RESULT: {
          target: 'saving',
          actions: assign({
            pendingResult: ({ event }) => event.completed,
            error: () => null,
            failedOperation: () => null,
            canRetry: () => false,
          }),
        },
        CANCEL: {
          target: 'ready',
          actions: assign({
            startedAt: () => null,
            currentSecond: () => 0,
          }),
        },
      },
    },
    saving: {
      invoke: {
        src: 'recordSession',
        input: ({ context }) => {
          const completed = context.pendingResult === true
          return {
            progressionId: context.progressionId,
            completed,
            ...(completed &&
              context.progression && {
                nextLevel: calculateNextLevel(context.progression),
              }),
          }
        },
        onDone: {
          target: 'completed',
          actions: assign({
            session: ({ event }) => event.output,
            error: () => null,
            failedOperation: () => null,
            canRetry: () => false,
          }),
        },
        onError: {
          target: 'failure',
          actions: assign({
            error: ({ event }) => toError(event.error),
            failedOperation: () => 'save' as const,
            canRetry: () => true,
          }),
        },
      },
    },
    completed: {
      type: 'final',
    },
    failure: {
      on: {
        RETRY: [
          {
            guard: 'retryLoad',
            target: 'loading',
          },
          {
            guard: 'retrySave',
            target: 'saving',
          },
        ],
      },
    },
  },
})
