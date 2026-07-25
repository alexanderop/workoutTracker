import { useActorRef, useSelector } from '@xstate/vue'
import { computed } from 'vue'
import { waitFor, type SnapshotFrom } from 'xstate'
import type { DbProgression, DbProgressionSession } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import {
  progressionSessionMachine,
  type ProgressionSessionContext,
} from '../machines/progressionSessionMachine'
import { getCurrentLevel } from '../lib/progressionLogic'
import type { ProgressionLevel } from '../types'

type SessionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; progression: DbProgression }
  | { status: 'active'; progression: DbProgression; startedAt: number }
  | { status: 'completing' }
  | { status: 'completed'; session: DbProgressionSession }
  | { status: 'error'; error: Error }

function requireProgression(context: ProgressionSessionContext): DbProgression {
  if (!context.progression) {
    throw new Error('Progression session entered an invalid state without a progression')
  }
  return context.progression
}

function requireSession(context: ProgressionSessionContext): DbProgressionSession {
  if (!context.session) {
    throw new Error('Progression session completed without a session record')
  }
  return context.session
}

function isActiveSession(snapshot: SnapshotFrom<typeof progressionSessionMachine>): boolean {
  return snapshot.matches('running') || snapshot.matches('awaitingResult')
}

function toSessionState(snapshot: SnapshotFrom<typeof progressionSessionMachine>): SessionState {
  if (isActiveSession(snapshot)) {
    return {
      status: 'active',
      progression: requireProgression(snapshot.context),
      startedAt: snapshot.context.startedAt ?? 0,
    }
  }

  switch (snapshot.value) {
    case 'idle': {
      return { status: 'idle' }
    }
    case 'loading': {
      return { status: 'loading' }
    }
    case 'ready': {
      return { status: 'ready', progression: requireProgression(snapshot.context) }
    }
    case 'saving': {
      return { status: 'completing' }
    }
    case 'completed': {
      return { status: 'completed', session: requireSession(snapshot.context) }
    }
    case 'failure': {
      return {
        status: 'error',
        error: snapshot.context.error ?? new Error('Unknown progression session error'),
      }
    }
    default: {
      throw new Error(`Unsupported progression session state: ${String(snapshot.value)}`)
    }
  }
}

/**
 * XState-backed active EMOM progression session.
 *
 * Repository work and the timer are invoked actors, so leaving their owning
 * state cancels their lifecycle automatically. Elapsed time is derived from
 * timestamps rather than interval counts to stay correct when the browser
 * throttles background work.
 */
export function useProgressionSession(progressionId: string) {
  const actor = useActorRef(progressionSessionMachine, {
    input: { progressionId },
  })
  const snapshot = useSelector(actor, (value) => value)

  const state = computed<SessionState>(() => toSessionState(snapshot.value))

  const progression = computed(() => snapshot.value.context.progression)
  const level = computed((): ProgressionLevel | null =>
    progression.value ? getCurrentLevel(progression.value) : null,
  )
  const currentSecond = computed(() => snapshot.value.context.currentSecond)
  const totalSeconds = computed(() => (level.value?.minutes ?? 0) * 60)
  const currentMinute = computed(() => Math.floor(currentSecond.value / 60) + 1)
  const secondsInCurrentMinute = computed(() => currentSecond.value % 60)
  const secondsUntilNextMinute = computed(() => 60 - secondsInCurrentMinute.value)
  const isLastMinute = computed(
    () => level.value !== null && currentMinute.value >= level.value.minutes,
  )
  const isTimerComplete = computed(
    () => snapshot.value.matches('awaitingResult') || snapshot.value.matches('saving'),
  )
  const isActive = computed(() => snapshot.value.matches('running'))
  const isReady = computed(() => snapshot.value.matches('ready'))
  const canRetry = computed(
    () => snapshot.value.matches('failure') && snapshot.value.context.canRetry,
  )

  function load(): void {
    actor.send({ type: 'LOAD' })
  }

  function startTimer(): void {
    actor.send({ type: 'START', now: Date.now() })
  }

  function stopTimer(): void {
    actor.send({ type: 'CANCEL' })
  }

  function cancelSession(): void {
    actor.send({ type: 'CANCEL' })
  }

  async function retry(): Promise<DbProgressionSession | null> {
    const failedSave =
      actor.getSnapshot().matches('failure') &&
      actor.getSnapshot().context.failedOperation === 'save'

    if (!failedSave) {
      actor.send({ type: 'RETRY' })
      return null
    }

    actor.send({ type: 'RETRY' })
    const settled = waitFor(
      actor,
      (value) =>
        value.matches('completed') ||
        (value.matches('failure') && value.context.failedOperation === 'save'),
    )

    const [error, result] = await tryCatch(settled)
    if (error) return null
    return result.matches('completed') ? result.context.session : null
  }

  async function completeSession(completed: boolean): Promise<DbProgressionSession | null> {
    if (!actor.getSnapshot().matches('awaitingResult')) return null

    const settled = waitFor(
      actor,
      (value) =>
        value.matches('completed') ||
        (value.matches('failure') && value.context.failedOperation === 'save'),
    )
    actor.send({ type: 'SUBMIT_RESULT', completed })

    const [error, result] = await tryCatch(settled)
    if (error) return null
    return result.matches('completed') ? result.context.session : null
  }

  return {
    state,
    currentSecond,
    progression,
    level,
    totalSeconds,
    currentMinute,
    secondsInCurrentMinute,
    secondsUntilNextMinute,
    isLastMinute,
    isTimerComplete,
    isActive,
    isReady,
    canRetry,
    load,
    startTimer,
    stopTimer,
    cancelSession,
    retry,
    completeSession,
  }
}
