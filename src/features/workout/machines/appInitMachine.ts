/**
 * App boot + resume-prompt state machine.
 *
 * Replaces a hand-rolled `InitState` union whose transitions were scattered
 * across an async function with early returns and a live-query subscription
 * that mutated the union from the outside. Two invariants that used to be
 * upheld by convention (and comments) are now structural:
 *
 * 1. `initialize()` can only run once. `INITIALIZE` is only handled in
 *    `loading.pending`; re-sending it while bootstrapping or after boot is an
 *    unhandled event, which XState drops.
 * 2. The cross-tab live query is only observed while the resume prompt is on
 *    screen. It is an actor invoked *by* `promptResume`, so leaving that state
 *    unsubscribes it — a stale snapshot can no longer clobber a resumed
 *    workout's in-memory working copy.
 *
 * Effects that need Vue scope (the router, and the per-component
 * `useWorkoutPersistence` instance) deliberately stay in the composable. The
 * machine owns the state; `useAppInitialization` reports outcomes back to it
 * via `RESUME_DONE` / `DISCARD_DONE`.
 */

import { assign, fromCallback, fromPromise, setup } from 'xstate'
import { getActiveWorkoutRepository, type LiveQuery } from '@/db'
import type { DbActiveWorkout } from '@/db/schema'
import { seedPopularExercises } from '@/db/seedExercises'
import { seedPopularTemplates } from '@/db/seedTemplates'
import { useExercisesStore } from '@/stores/exercises'
import { useSettingsStore } from '@/stores/settings'
import { tryCatch } from '@/lib/tryCatch'

/**
 * The shape App.vue and the integration tests consume. Kept as the original
 * discriminated union so the machine is an implementation detail of
 * `useAppInitialization` rather than a new public contract.
 */
export type InitState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'prompt-resume'; workoutName: string; blockCount: number }
  | { status: 'error'; error: Error }

export type AppInitContext = {
  workoutName: string
  blockCount: number
  error: Error | null
}

export type AppInitEvent =
  | { type: 'INITIALIZE' }
  | { type: 'RESUME' }
  | { type: 'RESUME_DONE' }
  | { type: 'RESUME_FAILED'; error: Error }
  | { type: 'DISCARD' }
  | { type: 'DISCARD_DONE' }
  | { type: 'DISCARD_FAILED'; error: Error }
  | { type: 'ACTIVE_WORKOUT_CHANGED'; workout: DbActiveWorkout | undefined }

export type ResumableWorkout = { workoutName: string; blockCount: number }

/** Output of the `bootstrap` actor; exported so tests can supply a stand-in. */
export type BootstrapOutput = { resumable: ResumableWorkout | null }

// Lazily-created, module-lifetime live query over the active workout. Created
// on first use (not at module import time) so it never races repository
// provider setup, and shared between the boot probe's `get()` and the
// resume-prompt watcher's `subscribe()` so both read the same query.
let activeWorkoutQuery: LiveQuery<DbActiveWorkout | undefined> | undefined

function getActiveWorkoutQuery(): LiveQuery<DbActiveWorkout | undefined> {
  activeWorkoutQuery ??= getActiveWorkoutRepository().observe()
  return activeWorkoutQuery
}

/** A draft is only worth resuming if it has blocks and is not already finished. */
function toResumableWorkout(workout: DbActiveWorkout | undefined): ResumableWorkout | null {
  if (!workout) return null
  if (workout.mode === 'completed') return null
  if (workout.blocks.length === 0) return null
  return { workoutName: workout.name, blockCount: workout.blocks.length }
}

const bootstrap = fromPromise<BootstrapOutput>(async () => {
  // Seed popular exercises and templates first (idempotent)
  await seedPopularExercises()
  await seedPopularTemplates()

  // Load settings and custom exercises from DB in parallel
  await Promise.all([useSettingsStore().loadFromDb(), useExercisesStore().loadFromDb()])

  const activeWorkout = await getActiveWorkoutQuery().get()

  // A draft in 'completed' mode is a finished workout that already lives in
  // history (older builds' debounced auto-save resurrected the draft after
  // completion deleted it). Drop it instead of offering to resume -- resuming
  // would duplicate the workout.
  if (activeWorkout?.mode === 'completed') {
    const [clearError] = await tryCatch(getActiveWorkoutRepository().clear())
    // Rethrow so the invoking state's onError owns the failure, rather than
    // silently reporting "nothing to resume" after a failed cleanup.
    if (clearError) throw clearError
    return { resumable: null }
  }

  return { resumable: toResumableWorkout(activeWorkout) }
})

/**
 * Mirrors the active workout into the machine while the resume prompt is up,
 * giving cross-tab awareness for the one window where it is safe: another tab
 * discarding or completing the workout while this tab is still asking
 * "resume?". Stops (and unsubscribes) the moment `promptResume` is left.
 */
const watchActiveWorkout = fromCallback<AppInitEvent>(({ sendBack }) => {
  return getActiveWorkoutQuery().subscribe((workout) => {
    sendBack({ type: 'ACTIVE_WORKOUT_CHANGED', workout })
  })
})

export const appInitMachine = setup({
  types: {
    context: {} as AppInitContext,
    events: {} as AppInitEvent,
  },
  actors: { bootstrap, watchActiveWorkout },
  guards: {
    isStillResumable: ({ event }) => {
      if (event.type !== 'ACTIVE_WORKOUT_CHANGED') return false
      return toResumableWorkout(event.workout) !== null
    },
  },
  actions: {
    assignResumableFromEvent: assign(({ event }) => {
      if (event.type !== 'ACTIVE_WORKOUT_CHANGED') return {}
      const resumable = toResumableWorkout(event.workout)
      if (!resumable) return {}
      return { workoutName: resumable.workoutName, blockCount: resumable.blockCount }
    }),
    assignFailure: assign(({ event }) => {
      if (event.type !== 'RESUME_FAILED' && event.type !== 'DISCARD_FAILED') return {}
      return { error: event.error }
    }),
  },
}).createMachine({
  id: 'appInit',
  initial: 'loading',
  context: { workoutName: '', blockCount: 0, error: null },
  states: {
    loading: {
      initial: 'pending',
      states: {
        // Parked here until the app mounts and calls initialize().
        pending: {
          on: { INITIALIZE: 'running' },
        },
        // INITIALIZE is deliberately unhandled here: re-entry is impossible
        // rather than merely guarded against.
        running: {
          invoke: {
            src: 'bootstrap',
            onDone: [
              {
                guard: ({ event }) => event.output.resumable !== null,
                target: '#appInit.promptResume',
                actions: assign(({ event }) => ({
                  workoutName: event.output.resumable?.workoutName ?? '',
                  blockCount: event.output.resumable?.blockCount ?? 0,
                })),
              },
              { target: '#appInit.ready' },
            ],
            onError: {
              target: '#appInit.failure',
              actions: assign(({ event }) => ({
                error: event.error instanceof Error ? event.error : new Error(String(event.error)),
              })),
            },
          },
        },
      },
    },

    promptResume: {
      invoke: { src: 'watchActiveWorkout' },
      on: {
        // No target: an internal transition, so the watcher actor is not torn
        // down and restarted on every snapshot.
        ACTIVE_WORKOUT_CHANGED: [
          { guard: 'isStillResumable', actions: 'assignResumableFromEvent' },
          { target: 'ready' },
        ],
        RESUME: 'resuming',
        DISCARD: 'discarding',
      },
    },

    // RESUME/DISCARD are unhandled while an outcome is pending, so a
    // double-tap on the resume dialog cannot start the work twice.
    resuming: {
      on: {
        RESUME_DONE: 'ready',
        RESUME_FAILED: { target: 'failure', actions: 'assignFailure' },
      },
    },

    discarding: {
      on: {
        DISCARD_DONE: 'ready',
        DISCARD_FAILED: { target: 'failure', actions: 'assignFailure' },
      },
    },

    ready: {},

    failure: {},
  },
})

type AppInitSnapshot = { value: unknown; context: AppInitContext }

/**
 * Project the machine onto the `InitState` union App.vue renders from.
 *
 * `resuming`/`discarding` still report `prompt-resume` so the dialog stays on
 * screen until the work settles, matching the pre-machine behavior.
 */
export function toInitState(snapshot: AppInitSnapshot): InitState {
  const { value, context } = snapshot

  if (typeof value === 'object' && value !== null && 'loading' in value) {
    return { status: 'loading' }
  }

  if (value === 'promptResume' || value === 'resuming' || value === 'discarding') {
    return {
      status: 'prompt-resume',
      workoutName: context.workoutName,
      blockCount: context.blockCount,
    }
  }

  if (value === 'failure') {
    return { status: 'error', error: context.error ?? new Error('App initialization failed') }
  }

  return { status: 'ready' }
}
