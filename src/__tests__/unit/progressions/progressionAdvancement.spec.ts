/**
 * The kettlebell progression state machine, driven session by session through
 * a repository.
 *
 * These cases used to live in `integration/progression-management.spec.ts`
 * ("Progression Advancement"), where they ran in the browser tier against
 * fake-IndexedDB — looping `recordSession` 5–11 times to assert arithmetic
 * that has nothing to do with a browser. Against the in-memory fake they are
 * the same assertions at Node speed. What the *adapter* guarantees (the
 * session and its parent updating together, no orphaned sessions on delete)
 * stays in the browser tier as `src/__tests__/db/progressions.spec.ts`.
 */
import { describe, it, expect } from 'vitest'
import { createFakeProgressionsRepository } from '@/__tests__/fakes/progressionsRepository'
import { recordSessionWithAdvancement } from './helpers'
import type { ProgressionsRepository } from '@/db/interfaces'

async function completeSessions(
  repo: ProgressionsRepository,
  progressionId: string,
  count: number,
): Promise<void> {
  for (const _ of Array.from({ length: count })) {
    await recordSessionWithAdvancement(repo, progressionId, true)
  }
}

describe('progression advancement', () => {
  it('climbs reps to the maximum before touching the EMOM duration', async () => {
    const repo = createFakeProgressionsRepository()
    const progression = await repo.create({ name: 'Ladder', availableWeights: [16, 20] })

    // 10 -> 12 -> 14 -> 16 -> 18 -> 20 reps
    await completeSessions(repo, progression.id, 5)

    const afterRepsPhase = await repo.getById(progression.id)
    expect(afterRepsPhase?.currentReps).toBe(20)
    expect(afterRepsPhase?.currentMinutes).toBe(10)
  })

  it('advances the EMOM duration once reps are maxed', async () => {
    const repo = createFakeProgressionsRepository()
    const progression = await repo.create({ name: 'Ladder', availableWeights: [16, 20] })
    await completeSessions(repo, progression.id, 5)

    await completeSessions(repo, progression.id, 1)

    const afterTimeAdvance = await repo.getById(progression.id)
    expect(afterTimeAdvance?.currentReps).toBe(20)
    expect(afterTimeAdvance?.currentMinutes).toBe(12)
  })

  it('moves to the next kettlebell and resets the level once both phases are maxed', async () => {
    const repo = createFakeProgressionsRepository()
    const progression = await repo.create({ name: 'Ladder', availableWeights: [16, 20, 24] })

    // 5 sessions to max reps + 5 to max minutes + 1 to roll onto the next bell
    await completeSessions(repo, progression.id, 11)

    const updated = await repo.getById(progression.id)
    expect(updated?.currentWeightIndex).toBe(1)
    expect(updated?.currentReps).toBe(10)
    expect(updated?.currentMinutes).toBe(10)
    expect(updated?.sessionsCompleted).toBe(11)
  })

  it('marks the progression complete after the final kettlebell', async () => {
    const repo = createFakeProgressionsRepository()
    const progression = await repo.create({ name: 'Quick', availableWeights: [16] })

    await completeSessions(repo, progression.id, 11)

    expect((await repo.getById(progression.id))?.isComplete).toBe(true)
  })

  it('counts a failed session without moving the level', async () => {
    const repo = createFakeProgressionsRepository()
    const progression = await repo.create({ name: 'Ladder', availableWeights: [16] })

    await recordSessionWithAdvancement(repo, progression.id, false)

    const updated = await repo.getById(progression.id)
    expect(updated?.currentReps).toBe(10)
    expect(updated?.currentMinutes).toBe(10)
    expect(updated?.sessionsCompleted).toBe(1)
  })

  it('does not advance past completion, however many further sessions are logged', async () => {
    const repo = createFakeProgressionsRepository()
    const progression = await repo.create({ name: 'Quick', availableWeights: [16] })
    await completeSessions(repo, progression.id, 11)

    await completeSessions(repo, progression.id, 3)

    const updated = await repo.getById(progression.id)
    expect(updated?.isComplete).toBe(true)
    expect(updated?.currentWeightIndex).toBe(0)
    expect(updated?.sessionsCompleted).toBe(14)
  })

  it('records one session row per attempt, newest first', async () => {
    const repo = createFakeProgressionsRepository()
    const progression = await repo.create({ name: 'Ladder', availableWeights: [16] })

    await completeSessions(repo, progression.id, 2)
    await recordSessionWithAdvancement(repo, progression.id, false)

    const history = await repo.getSessionHistory(progression.id)
    expect(history).toHaveLength(3)
    // Each row is stamped with the level it was performed at, not the level it
    // advanced to. Asserted as a set, not by position: the real adapter stamps
    // `completedAt` with `Date.now()`, so rows written in the same millisecond
    // tie and their relative order is arbitrary. The fake's counter clock never
    // ties, and leaning on that would assert an ordering production does not
    // provide.
    expect(history.map((session) => session.reps).toSorted((a, b) => a - b)).toEqual([10, 12, 14])
    expect(history.filter((session) => !session.completed)).toHaveLength(1)
  })
})
