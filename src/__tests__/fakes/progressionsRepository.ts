/**
 * In-memory `ProgressionsRepository` fake. Node-safe: only `import type` from
 * `@/db/schema` and `@/db/interfaces`, so it is reachable from the Node `unit`
 * tier (enforced by `src/__tests__/architecture/unitTierImports.test.ts`). No
 * `vi`/Vitest import — a plain factory usable from any tier.
 *
 * Mirrors the observable behaviour of `createDexieProgressionsRepository`
 * (`src/db/implementations/dexie/progressions.ts`) and the contracts documented
 * on `ProgressionsRepository` (`src/db/interfaces.ts`): `getAll` ordering and
 * its `createdAt` tie-break, `update`'s not-found throw, `delete`'s
 * no-orphaned-sessions guarantee, `recordSession`'s advance-only-on-success
 * rule, and `getSessionHistory`'s newest-first ordering.
 *
 * Reads return shallow copies. Dexie hands back a fresh object per read, so a
 * fake that returned its own stored references would let a test pass on
 * aliasing that does not hold against the real adapter.
 *
 * `now` and `nextId` are deterministic counters rather than `Date.now()` /
 * `crypto.randomUUID()`, so ordering (which `getAll` and `getSessionHistory`
 * both depend on) is provable rather than incidental.
 */
import type { CreateProgressionData, ProgressionsRepository } from '@/db/interfaces'
import type { DbProgression, DbProgressionSession } from '@/db/schema'

export function createFakeProgressionsRepository(): ProgressionsRepository {
  let progressions: Array<DbProgression> = []
  let sessions: Array<DbProgressionSession> = []

  let tick = 1000
  const now = () => tick++

  let idCounter = 0
  const nextId = () => `progression-${++idCounter}`

  function find(id: string): DbProgression | undefined {
    return progressions.find((entry) => entry.id === id)
  }

  return {
    async getAll(): Promise<ReadonlyArray<DbProgression>> {
      return progressions
        .toSorted((a, b) => {
          const aTime = a.lastSessionAt ?? 0
          const bTime = b.lastSessionAt ?? 0
          if (aTime !== bTime) return bTime - aTime
          return b.createdAt - a.createdAt
        })
        .map((entry) => ({ ...entry }))
    },

    async getById(id: string): Promise<DbProgression | undefined> {
      const found = find(id)
      return found ? { ...found } : undefined
    },

    async create(data: CreateProgressionData): Promise<DbProgression> {
      const startReps = data.startReps ?? 10
      const startMinutes = data.startMinutes ?? 10
      const startingWeightIndex = data.startingWeightIndex ?? 0

      const progression: DbProgression = {
        id: nextId(),
        name: data.name,
        availableWeights: data.availableWeights,
        currentWeightIndex: startingWeightIndex,
        currentReps: startReps,
        currentMinutes: startMinutes,
        startReps,
        maxReps: data.maxReps ?? 20,
        repIncrement: data.repIncrement ?? 2,
        startMinutes,
        maxMinutes: data.maxMinutes ?? 20,
        minuteIncrement: data.minuteIncrement ?? 2,
        sessionsCompleted: 0,
        isComplete: false,
        createdAt: now(),
        lastSessionAt: null,
      }

      progressions.push(progression)
      return { ...progression }
    },

    async update(
      id: string,
      updates: Partial<Omit<DbProgression, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const found = find(id)
      if (!found) {
        throw new Error(`Progression with id ${id} not found`)
      }
      Object.assign(found, updates)
    },

    async delete(id: string): Promise<void> {
      // Both halves together, per the interface's intent guarantee: an adapter
      // must never leave sessions referencing a deleted progression.
      sessions = sessions.filter((session) => session.progressionId !== id)
      progressions = progressions.filter((entry) => entry.id !== id)
    },

    async recordSession(
      progressionId: string,
      completed: boolean,
      nextLevel?: { reps: number; minutes: number; weightIndex: number; isComplete: boolean },
    ): Promise<DbProgressionSession> {
      const progression = find(progressionId)
      if (!progression) {
        throw new Error(`Progression with id ${progressionId} not found`)
      }

      const currentWeight = progression.availableWeights[progression.currentWeightIndex]
      if (currentWeight === undefined) {
        throw new Error(`Invalid weight index ${progression.currentWeightIndex}`)
      }

      const completedAt = now()
      const session: DbProgressionSession = {
        id: nextId(),
        progressionId,
        weight: currentWeight,
        reps: progression.currentReps,
        minutes: progression.currentMinutes,
        completed,
        completedAt,
      }

      sessions.push(session)

      progression.sessionsCompleted += 1
      progression.lastSessionAt = completedAt

      // Only advance on a successful session of a progression that is not
      // already finished — a failed session still counts and still stamps
      // `lastSessionAt`, it just leaves the level alone.
      if (completed && !progression.isComplete && nextLevel) {
        progression.currentReps = nextLevel.reps
        progression.currentMinutes = nextLevel.minutes
        progression.currentWeightIndex = nextLevel.weightIndex
        progression.isComplete = nextLevel.isComplete
      }

      return { ...session }
    },

    async getSessionHistory(progressionId: string): Promise<ReadonlyArray<DbProgressionSession>> {
      return sessions
        .filter((session) => session.progressionId === progressionId)
        .toSorted((a, b) => b.completedAt - a.completedAt)
        .map((session) => ({ ...session }))
    },
  }
}
