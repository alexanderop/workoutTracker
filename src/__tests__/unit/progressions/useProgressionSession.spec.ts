/**
 * Node-tier composable spec for `useProgressionSession` (ADR 004:
 * brain/decisions/004-db-in-di.md).
 *
 * The EMOM timer state machine runs here on `vi.useFakeTimers()`. That is why
 * the plan deliberately did *not* inject a clock: `setInterval` is a Node
 * global, so the whole tick/stop/complete cycle is reachable in the unit tier
 * with no new service. The browser suite has to shrink the session to two real
 * seconds by writing `currentMinutes: 1/30` to the repository; nothing here
 * needs that trick.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope } from 'vue'
import { useProgressionSession } from '@/features/progressions/composables/useProgressionSession'
import { rejects } from '@/__tests__/helpers/di'
import { progressionContext as contextFor, seeded as seedProgression } from './helpers'
import type { DbProgression } from '@/db/schema'
import type { ProgressionsRepository } from '@/db/interfaces'

/** A one-minute EMOM by default, so a full timer run is 60 fake ticks, not 600. */
function seeded(
  overrides: Partial<Omit<DbProgression, 'id' | 'createdAt'>> = {},
): Promise<{ repo: ProgressionsRepository; id: string }> {
  return seedProgression({ currentMinutes: 1, ...overrides })
}

describe('useProgressionSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('load', () => {
    it('reaches the ready state for a live progression', async () => {
      const { repo, id } = await seeded()
      const { state, load, isReady, level, totalSeconds } = useProgressionSession(
        id,
        contextFor(repo),
      )

      await load()

      expect(state.value.status).toBe('ready')
      expect(isReady.value).toBe(true)
      expect(level.value).toEqual({ weight: 16, reps: 10, minutes: 1 })
      expect(totalSeconds.value).toBe(60)
    })

    it('errors for an id that was never stored', async () => {
      const { repo } = await seeded()
      const { state, load } = useProgressionSession('missing', contextFor(repo))

      await load()

      expect(state.value.status).toBe('error')
    })

    it('refuses to start a session for an already finished progression', async () => {
      const { repo, id } = await seeded({ isComplete: true })
      const { state, load } = useProgressionSession(id, contextFor(repo))

      await load()

      expect(state.value.status).toBe('error')
    })

    it('errors when the lookup itself throws', async () => {
      const { repo, id } = await seeded()
      const { state, load } = useProgressionSession(id, contextFor(repo, { getById: rejects }))

      await load()

      expect(state.value.status).toBe('error')
    })
  })

  describe('the timer', () => {
    it('does nothing when started before the progression is ready', async () => {
      const { repo, id } = await seeded()
      const { startTimer, isActive, currentSecond } = useProgressionSession(id, contextFor(repo))

      startTimer()
      vi.advanceTimersByTime(5000)

      expect(isActive.value).toBe(false)
      expect(currentSecond.value).toBe(0)
    })

    it('ticks once per second while active', async () => {
      const { repo, id } = await seeded()
      const { load, startTimer, currentSecond, isActive } = useProgressionSession(
        id,
        contextFor(repo),
      )
      await load()

      startTimer()
      expect(isActive.value).toBe(true)
      vi.advanceTimersByTime(3000)

      expect(currentSecond.value).toBe(3)
    })

    it('derives the current minute and the seconds within it', async () => {
      const { repo, id } = await seeded({ currentMinutes: 3 })
      const { load, startTimer, currentMinute, secondsInCurrentMinute, secondsUntilNextMinute } =
        useProgressionSession(id, contextFor(repo))
      await load()

      startTimer()
      vi.advanceTimersByTime(75_000)

      expect(currentMinute.value).toBe(2)
      expect(secondsInCurrentMinute.value).toBe(15)
      expect(secondsUntilNextMinute.value).toBe(45)
    })

    it('flags the last minute only once it is reached', async () => {
      const { repo, id } = await seeded({ currentMinutes: 2 })
      const { load, startTimer, isLastMinute } = useProgressionSession(id, contextFor(repo))
      await load()

      startTimer()
      vi.advanceTimersByTime(30_000)
      expect(isLastMinute.value).toBe(false)

      vi.advanceTimersByTime(30_000)
      expect(isLastMinute.value).toBe(true)
    })

    it('stops itself at the end and does not run past the session length', async () => {
      const { repo, id } = await seeded()
      const { load, startTimer, currentSecond, isTimerComplete } = useProgressionSession(
        id,
        contextFor(repo),
      )
      await load()

      startTimer()
      vi.advanceTimersByTime(120_000)

      expect(currentSecond.value).toBe(60)
      expect(isTimerComplete.value).toBe(true)
    })

    it('stops ticking when its owning effect scope is disposed', async () => {
      const { repo, id } = await seeded()
      const scope = effectScope()
      const session = scope.run(() => useProgressionSession(id, contextFor(repo)))!
      await session.load()

      session.startTimer()
      vi.advanceTimersByTime(3000)
      expect(session.currentSecond.value).toBe(3)

      scope.stop()
      vi.advanceTimersByTime(3000)
      expect(session.currentSecond.value).toBe(3)
    })

    it('rewinds to ready and clears the tick when the session is cancelled', async () => {
      const { repo, id } = await seeded()
      const { load, startTimer, cancelSession, state, currentSecond } = useProgressionSession(
        id,
        contextFor(repo),
      )
      await load()

      startTimer()
      vi.advanceTimersByTime(5000)
      cancelSession()
      vi.advanceTimersByTime(5000)

      expect(state.value.status).toBe('ready')
      expect(currentSecond.value).toBe(0)
    })
  })

  describe('completeSession', () => {
    it('advances the level and records the session on success', async () => {
      const { repo, id } = await seeded()
      const { load, startTimer, completeSession } = useProgressionSession(id, contextFor(repo))
      await load()
      startTimer()
      vi.advanceTimersByTime(60_000)

      const session = await completeSession(true)

      expect(session?.completed).toBe(true)
      const updated = await repo.getById(id)
      expect(updated?.currentReps).toBe(12)
      expect(updated?.sessionsCompleted).toBe(1)
    })

    it('records a failed session without advancing the level', async () => {
      const { repo, id } = await seeded()
      const { load, completeSession } = useProgressionSession(id, contextFor(repo))
      await load()

      const session = await completeSession(false)

      expect(session?.completed).toBe(false)
      const updated = await repo.getById(id)
      expect(updated?.currentReps).toBe(10)
      expect(updated?.sessionsCompleted).toBe(1)
    })

    it('returns null and records nothing when no progression is loaded', async () => {
      const { repo, id } = await seeded()
      const { completeSession } = useProgressionSession(id, contextFor(repo))

      await expect(completeSession(true)).resolves.toBeNull()

      expect((await repo.getById(id))?.sessionsCompleted).toBe(0)
    })

    it('surfaces an error state when recording throws', async () => {
      const { repo, id } = await seeded()
      const { load, state, completeSession } = useProgressionSession(
        id,
        contextFor(repo, { recordSession: rejects }),
      )
      await load()

      await expect(completeSession(true)).resolves.toBeNull()

      expect(state.value.status).toBe('error')
    })

    it('stops the timer, so no tick survives completion', async () => {
      const { repo, id } = await seeded()
      const { load, startTimer, completeSession, currentSecond } = useProgressionSession(
        id,
        contextFor(repo),
      )
      await load()
      startTimer()
      vi.advanceTimersByTime(5000)

      await completeSession(true)
      const atCompletion = currentSecond.value
      vi.advanceTimersByTime(10_000)

      expect(currentSecond.value).toBe(atCompletion)
    })
  })
})
