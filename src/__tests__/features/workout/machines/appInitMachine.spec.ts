import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createActor, fromCallback, fromPromise } from 'xstate'
import {
  appInitMachine,
  toInitState,
  type AppInitEvent,
  type BootstrapOutput,
} from '@/features/workout/machines/appInitMachine'
import { getActiveWorkoutRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'
import { createDbStrengthBlock } from '@/__tests__/factories'
import type { DbActiveWorkout } from '@/db/schema'

function seedActiveWorkout(overrides: Partial<DbActiveWorkout> = {}): Promise<void> {
  const workout: DbActiveWorkout = {
    id: 'current',
    name: 'Leg Day',
    blocks: [createDbStrengthBlock()],
    selectedBlockIndex: 0,
    startedAt: Date.now() - 60_000,
    lastModifiedAt: Date.now(),
    mode: 'active',
    activeSetIndex: null,
    activeExerciseIndex: null,
    benchmarkId: null,
    globalTimerStartedAt: null,
    ...overrides,
  }
  return getActiveWorkoutRepository().save(workout)
}

/**
 * These tests drive the machine directly rather than through
 * `useAppInitialization`, so they cover the transition rules without a Vue
 * component or a router. The composable's own side effects (loading the
 * workout into memory, navigating) are covered by the workout-management
 * integration spec.
 */
describe('appInitMachine', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('boot', () => {
    it('starts parked in loading and does nothing until INITIALIZE', () => {
      const actor = createActor(appInitMachine).start()

      expect(actor.getSnapshot().value).toEqual({ loading: 'pending' })
      expect(toInitState(actor.getSnapshot())).toEqual({ status: 'loading' })

      actor.stop()
    })

    it('reaches ready when there is no active workout', async () => {
      const actor = createActor(appInitMachine).start()
      actor.send({ type: 'INITIALIZE' })

      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('ready'))
      expect(toInitState(actor.getSnapshot())).toEqual({ status: 'ready' })

      actor.stop()
    })

    it('prompts to resume when a draft with blocks exists', async () => {
      await seedActiveWorkout()

      const actor = createActor(appInitMachine).start()
      actor.send({ type: 'INITIALIZE' })

      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('promptResume'))
      expect(toInitState(actor.getSnapshot())).toEqual({
        status: 'prompt-resume',
        workoutName: 'Leg Day',
        blockCount: 1,
      })

      actor.stop()
    })

    it('clears a completed draft instead of offering to resume it', async () => {
      await seedActiveWorkout({ mode: 'completed' })

      const actor = createActor(appInitMachine).start()
      actor.send({ type: 'INITIALIZE' })

      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('ready'))
      await expect(getActiveWorkoutRepository().exists()).resolves.toBe(false)

      actor.stop()
    })

    it('does not offer to resume a draft with no blocks', async () => {
      await seedActiveWorkout({ blocks: [] })

      const actor = createActor(appInitMachine).start()
      actor.send({ type: 'INITIALIZE' })

      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('ready'))

      actor.stop()
    })

    it('runs the bootstrap exactly once even if INITIALIZE is sent repeatedly', async () => {
      const bootstrap = vi.fn<() => Promise<BootstrapOutput>>(async () => ({ resumable: null }))
      const actor = createActor(
        appInitMachine.provide({ actors: { bootstrap: fromPromise(bootstrap) } }),
      ).start()

      actor.send({ type: 'INITIALIZE' })
      actor.send({ type: 'INITIALIZE' })
      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('ready'))
      actor.send({ type: 'INITIALIZE' })

      expect(bootstrap).toHaveBeenCalledTimes(1)

      actor.stop()
    })

    it('lands in failure with the error when bootstrap rejects', async () => {
      const boom = new Error('indexeddb unavailable')
      const actor = createActor(
        appInitMachine.provide({
          actors: {
            bootstrap: fromPromise<BootstrapOutput>(() => Promise.reject(boom)),
          },
        }),
      ).start()

      actor.send({ type: 'INITIALIZE' })

      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('failure'))
      expect(toInitState(actor.getSnapshot())).toEqual({ status: 'error', error: boom })

      actor.stop()
    })
  })

  describe('resume prompt', () => {
    async function startAtPrompt() {
      await seedActiveWorkout()
      const actor = createActor(appInitMachine).start()
      actor.send({ type: 'INITIALIZE' })
      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('promptResume'))
      return actor
    }

    it('moves to resuming, then ready when the caller reports success', async () => {
      const actor = await startAtPrompt()

      actor.send({ type: 'RESUME' })
      expect(actor.getSnapshot().value).toBe('resuming')
      // The dialog stays on screen while the load is in flight.
      expect(toInitState(actor.getSnapshot()).status).toBe('prompt-resume')

      actor.send({ type: 'RESUME_DONE' })
      expect(actor.getSnapshot().value).toBe('ready')

      actor.stop()
    })

    it('ignores a second RESUME while the first is still in flight', async () => {
      const actor = await startAtPrompt()

      actor.send({ type: 'RESUME' })
      actor.send({ type: 'RESUME' })

      expect(actor.getSnapshot().value).toBe('resuming')

      actor.stop()
    })

    it('surfaces a resume failure as an error state', async () => {
      const actor = await startAtPrompt()
      const boom = new Error('load failed')

      actor.send({ type: 'RESUME' })
      actor.send({ type: 'RESUME_FAILED', error: boom })

      expect(toInitState(actor.getSnapshot())).toEqual({ status: 'error', error: boom })

      actor.stop()
    })

    it('moves to ready after a discard', async () => {
      const actor = await startAtPrompt()

      actor.send({ type: 'DISCARD' })
      expect(actor.getSnapshot().value).toBe('discarding')

      actor.send({ type: 'DISCARD_DONE' })
      expect(actor.getSnapshot().value).toBe('ready')

      actor.stop()
    })
  })

  describe('cross-tab watcher', () => {
    it('dismisses the prompt when another tab clears the draft', async () => {
      await seedActiveWorkout()

      const actor = createActor(appInitMachine).start()
      actor.send({ type: 'INITIALIZE' })
      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('promptResume'))

      await getActiveWorkoutRepository().clear()

      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('ready'))

      actor.stop()
    })

    it('refreshes the prompt in place without restarting the watcher', async () => {
      const subscribe = vi.fn(() => () => {})

      const actor = createActor(
        appInitMachine.provide({
          actors: {
            bootstrap: fromPromise<BootstrapOutput>(async () => ({
              resumable: { workoutName: 'Leg Day', blockCount: 1 },
            })),
            watchActiveWorkout: fromCallback<AppInitEvent>(subscribe),
          },
        }),
      ).start()

      actor.send({ type: 'INITIALIZE' })
      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('promptResume'))
      expect(subscribe).toHaveBeenCalledTimes(1)

      actor.send({
        type: 'ACTIVE_WORKOUT_CHANGED',
        workout: {
          id: 'current',
          name: 'Push Day',
          blocks: [createDbStrengthBlock(), createDbStrengthBlock()],
          selectedBlockIndex: 0,
          startedAt: Date.now(),
          lastModifiedAt: Date.now(),
          mode: 'active',
          activeSetIndex: null,
          activeExerciseIndex: null,
          benchmarkId: null,
          globalTimerStartedAt: null,
        },
      })

      expect(toInitState(actor.getSnapshot())).toEqual({
        status: 'prompt-resume',
        workoutName: 'Push Day',
        blockCount: 2,
      })
      // Internal transition: the watcher must not have been torn down.
      expect(subscribe).toHaveBeenCalledTimes(1)

      actor.stop()
    })

    it('stops watching once the prompt is left', async () => {
      const unsubscribe = vi.fn()
      const actor = createActor(
        appInitMachine.provide({
          actors: {
            bootstrap: fromPromise<BootstrapOutput>(async () => ({
              resumable: { workoutName: 'Leg Day', blockCount: 1 },
            })),
            watchActiveWorkout: fromCallback<AppInitEvent>(() => unsubscribe),
          },
        }),
      ).start()

      actor.send({ type: 'INITIALIZE' })
      await vi.waitFor(() => expect(actor.getSnapshot().value).toBe('promptResume'))
      expect(unsubscribe).not.toHaveBeenCalled()

      actor.send({ type: 'DISCARD' })

      expect(unsubscribe).toHaveBeenCalledTimes(1)

      actor.stop()
    })
  })
})
