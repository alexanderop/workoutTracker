import { describe, it, expect, beforeEach } from 'vitest'
import { getProgressionsRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'
import { db } from '@/db/implementations/dexie/database'

/**
 * Repository-level tests for progressions and progression sessions.
 *
 * Stays in the browser tier: it certifies the Dexie adapter against real
 * IndexedDB — specifically the two cross-table transactions
 * (`recordSession`, `delete`) whose intent guarantees in
 * `src/db/interfaces.ts` are about two object stores staying consistent, a
 * capability the Node `unit` tier has no global for.
 *
 * The progression *arithmetic* those transactions carry is deliberately not
 * retested here; it lives in
 * `src/__tests__/unit/progressions/progressionAdvancement.spec.ts` against an
 * in-memory fake, where it costs milliseconds instead of a browser.
 */
describe('ProgressionsRepository', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('create', () => {
    it('persists the documented defaults for every unspecified field', async () => {
      const repo = getProgressionsRepository()

      const created = await repo.create({ name: 'Ladder', availableWeights: [16, 20] })

      const stored = await db.progressions.get(created.id)
      expect(stored).toMatchObject({
        name: 'Ladder',
        availableWeights: [16, 20],
        currentWeightIndex: 0,
        currentReps: 10,
        maxReps: 20,
        repIncrement: 2,
        currentMinutes: 10,
        maxMinutes: 20,
        minuteIncrement: 2,
        sessionsCompleted: 0,
        isComplete: false,
        lastSessionAt: null,
      })
    })

    it('honours an explicit starting weight index', async () => {
      const repo = getProgressionsRepository()

      const created = await repo.create({
        name: 'Ladder',
        availableWeights: [16, 20, 24],
        startingWeightIndex: 2,
      })

      expect((await repo.getById(created.id))?.currentWeightIndex).toBe(2)
    })
  })

  describe('getAll', () => {
    it('orders by most recent session, falling back to newest created', async () => {
      const repo = getProgressionsRepository()
      const first = await repo.create({ name: 'First', availableWeights: [16] })
      const second = await repo.create({ name: 'Second', availableWeights: [16] })
      const third = await repo.create({ name: 'Third', availableWeights: [16] })
      // Only `first` has a session, so it outranks both never-used plans; those
      // two fall back to createdAt, newest first.
      await repo.recordSession(first.id, true)

      const all = await repo.getAll()

      expect(all.map((entry) => entry.id)).toEqual([first.id, third.id, second.id])
    })
  })

  describe('update', () => {
    it('rejects for an id that is not stored', async () => {
      const repo = getProgressionsRepository()

      await expect(repo.update('missing', { currentReps: 12 })).rejects.toThrow()
    })
  })

  describe('recordSession', () => {
    it('commits the session row and the parent update together', async () => {
      const repo = getProgressionsRepository()
      const progression = await repo.create({ name: 'Ladder', availableWeights: [16, 20] })

      await repo.recordSession(progression.id, true, {
        reps: 12,
        minutes: 10,
        weightIndex: 0,
        isComplete: false,
      })

      // Read both object stores directly: the guarantee is that neither is
      // visible without the other.
      const storedSessions = await db.progressionSessions
        .where('progressionId')
        .equals(progression.id)
        .toArray()
      const storedProgression = await db.progressions.get(progression.id)
      expect(storedSessions).toHaveLength(1)
      expect(storedSessions[0]).toMatchObject({ weight: 16, reps: 10, completed: true })
      expect(storedProgression).toMatchObject({
        currentReps: 12,
        sessionsCompleted: 1,
      })
      expect(storedProgression?.lastSessionAt).not.toBeNull()
    })

    it('stamps the session with the level it was performed at, not the level it advanced to', async () => {
      const repo = getProgressionsRepository()
      const progression = await repo.create({ name: 'Ladder', availableWeights: [16, 20] })

      const session = await repo.recordSession(progression.id, true, {
        reps: 12,
        minutes: 10,
        weightIndex: 0,
        isComplete: false,
      })

      expect(session.reps).toBe(10)
      expect(session.weight).toBe(16)
    })

    it('rejects for an id that is not stored', async () => {
      const repo = getProgressionsRepository()

      await expect(repo.recordSession('missing', true)).rejects.toThrow()
    })
  })

  describe('getSessionHistory', () => {
    it('returns only this progression sessions, newest first', async () => {
      const repo = getProgressionsRepository()
      const mine = await repo.create({ name: 'Mine', availableWeights: [16] })
      const other = await repo.create({ name: 'Other', availableWeights: [16] })
      await repo.recordSession(mine.id, true)
      await repo.recordSession(other.id, true)
      await repo.recordSession(mine.id, false)

      const history = await repo.getSessionHistory(mine.id)

      expect(history).toHaveLength(2)
      expect(history.map((session) => session.completed)).toEqual([false, true])
    })
  })

  describe('delete', () => {
    it('removes the progression and leaves no orphaned sessions behind', async () => {
      const repo = getProgressionsRepository()
      const doomed = await repo.create({ name: 'Doomed', availableWeights: [16] })
      const kept = await repo.create({ name: 'Kept', availableWeights: [16] })
      await repo.recordSession(doomed.id, true)
      await repo.recordSession(kept.id, true)

      await repo.delete(doomed.id)

      expect(await repo.getById(doomed.id)).toBeUndefined()
      const orphans = await db.progressionSessions
        .where('progressionId')
        .equals(doomed.id)
        .toArray()
      expect(orphans).toEqual([])
      // The neighbour's sessions must survive — the delete is scoped, not a sweep.
      expect(await repo.getSessionHistory(kept.id)).toHaveLength(1)
    })
  })
})
