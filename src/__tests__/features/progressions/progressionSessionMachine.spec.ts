import { createActor, fromCallback, fromPromise, waitFor } from 'xstate'
import { describe, expect, it, vi } from 'vitest'
import type { DbProgression, DbProgressionSession } from '@/db/schema'
import {
  progressionSessionMachine,
  type LoadProgressionResult,
  type RecordSessionInput,
} from '@/features/progressions/machines/progressionSessionMachine'

function createProgression(overrides: Partial<DbProgression> = {}): DbProgression {
  return {
    id: 'progression-1',
    name: 'KB Swing Ladder',
    availableWeights: [16, 20],
    currentWeightIndex: 0,
    currentReps: 10,
    currentMinutes: 1 / 30,
    startReps: 10,
    maxReps: 20,
    repIncrement: 2,
    startMinutes: 10,
    maxMinutes: 20,
    minuteIncrement: 2,
    sessionsCompleted: 0,
    isComplete: false,
    createdAt: 1,
    lastSessionAt: null,
    ...overrides,
  }
}

function createSession(overrides: Partial<DbProgressionSession> = {}): DbProgressionSession {
  return {
    id: 'session-1',
    progressionId: 'progression-1',
    weight: 16,
    reps: 10,
    minutes: 1 / 30,
    completed: true,
    completedAt: 3,
    ...overrides,
  }
}

function createTestActor(
  options: {
    load?: (input: { progressionId: string }) => Promise<LoadProgressionResult>
    record?: (input: RecordSessionInput) => Promise<DbProgressionSession>
    onTickerCleanup?: () => void
  } = {},
) {
  const progression = createProgression()
  const machine = progressionSessionMachine.provide({
    actors: {
      loadProgression: fromPromise<LoadProgressionResult, { progressionId: string }>(
        async ({ input }) => options.load?.(input) ?? { status: 'ready', progression },
      ),
      recordSession: fromPromise<DbProgressionSession, RecordSessionInput>(
        async ({ input }) => options.record?.(input) ?? createSession(),
      ),
      ticker: fromCallback(() => options.onTickerCleanup),
    },
  })

  return createActor(machine, {
    input: { progressionId: progression.id },
  }).start()
}

async function loadReady(actor: ReturnType<typeof createTestActor>): Promise<void> {
  actor.send({ type: 'LOAD' })
  await waitFor(actor, (snapshot) => snapshot.matches('ready'))
}

function finishTimer(actor: ReturnType<typeof createTestActor>): void {
  actor.send({ type: 'START', now: 10_000 })
  actor.send({ type: 'TICK', now: 12_000 })
}

describe('progressionSessionMachine', () => {
  it('loads a valid progression and ignores START until ready', async () => {
    const actor = createTestActor()

    actor.send({ type: 'START', now: 10_000 })
    expect(actor.getSnapshot().matches('idle')).toBe(true)

    await loadReady(actor)

    expect(actor.getSnapshot().context.progression?.name).toBe('KB Swing Ladder')
    actor.stop()
  })

  it('uses timestamps and stops the ticker when the duration is reached', async () => {
    const onTickerCleanup = vi.fn()
    const actor = createTestActor({ onTickerCleanup })
    await loadReady(actor)

    actor.send({ type: 'START', now: 10_000 })
    actor.send({ type: 'TICK', now: 11_999 })

    expect(actor.getSnapshot().matches('running')).toBe(true)
    expect(actor.getSnapshot().context.currentSecond).toBe(1)

    actor.send({ type: 'TICK', now: 12_000 })

    expect(actor.getSnapshot().matches('awaitingResult')).toBe(true)
    expect(actor.getSnapshot().context.currentSecond).toBe(2)
    expect(onTickerCleanup).toHaveBeenCalledTimes(1)
    actor.stop()
  })

  it('catches up immediately after a throttled or suspended interval', async () => {
    const actor = createTestActor()
    await loadReady(actor)

    actor.send({ type: 'START', now: 10_000 })
    actor.send({ type: 'TICK', now: 75_000 })

    expect(actor.getSnapshot().matches('awaitingResult')).toBe(true)
    expect(actor.getSnapshot().context.currentSecond).toBe(2)
    actor.stop()
  })

  it('cancels an active session back to a clean ready state', async () => {
    const actor = createTestActor()
    await loadReady(actor)

    actor.send({ type: 'START', now: 10_000 })
    actor.send({ type: 'TICK', now: 11_000 })
    actor.send({ type: 'CANCEL' })

    expect(actor.getSnapshot().matches('ready')).toBe(true)
    expect(actor.getSnapshot().context.currentSecond).toBe(0)
    expect(actor.getSnapshot().context.startedAt).toBeNull()
    actor.stop()
  })

  it('records a successful result with the calculated next level', async () => {
    const record = vi.fn<(input: RecordSessionInput) => Promise<DbProgressionSession>>()
    record.mockResolvedValue(createSession())
    const actor = createTestActor({ record })
    await loadReady(actor)
    finishTimer(actor)

    const completed = waitFor(actor, (snapshot) => snapshot.matches('completed'))
    actor.send({ type: 'SUBMIT_RESULT', completed: true })
    const snapshot = await completed

    expect(record).toHaveBeenCalledWith({
      progressionId: 'progression-1',
      completed: true,
      nextLevel: {
        reps: 12,
        minutes: 1 / 30,
        weightIndex: 0,
        isComplete: false,
      },
    })
    expect(snapshot.context.session?.id).toBe('session-1')
  })

  it('preserves session context and retries a failed save', async () => {
    const saveError = new Error('IndexedDB unavailable')
    const record = vi.fn<(input: RecordSessionInput) => Promise<DbProgressionSession>>()
    record.mockRejectedValueOnce(saveError).mockResolvedValueOnce(createSession())
    const actor = createTestActor({ record })
    await loadReady(actor)
    finishTimer(actor)

    actor.send({ type: 'SUBMIT_RESULT', completed: true })
    const failed = await waitFor(actor, (snapshot) => snapshot.matches('failure'))

    expect(failed.context.error).toBe(saveError)
    expect(failed.context.progression?.id).toBe('progression-1')
    expect(failed.context.pendingResult).toBe(true)
    expect(failed.context.canRetry).toBe(true)

    const completed = waitFor(actor, (snapshot) => snapshot.matches('completed'))
    actor.send({ type: 'RETRY' })
    await completed

    expect(record).toHaveBeenCalledTimes(2)
  })

  it('distinguishes terminal load results from retryable repository errors', async () => {
    const load = vi
      .fn<(input: { progressionId: string }) => Promise<LoadProgressionResult>>()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ status: 'not-found' })
    const actor = createTestActor({ load })

    actor.send({ type: 'LOAD' })
    const retryable = await waitFor(actor, (snapshot) => snapshot.matches('failure'))
    expect(retryable.context.canRetry).toBe(true)

    actor.send({ type: 'RETRY' })
    const terminal = await waitFor(
      actor,
      (snapshot) => snapshot.matches('failure') && !snapshot.context.canRetry,
    )

    expect(terminal.context.error?.message).toBe('Progression not found')
    expect(load).toHaveBeenCalledTimes(2)
    actor.stop()
  })
})
