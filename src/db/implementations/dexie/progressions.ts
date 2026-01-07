import type { CreateProgressionData, ProgressionsRepository } from '@/db/interfaces'
import type { DbProgression, DbProgressionSession } from '@/db/schema'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'
import { generateId } from './database'

export function createDexieProgressionsRepository(
  database: WorkoutTrackerDatabase,
): ProgressionsRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbProgression>> {
      // Sort by lastSessionAt (most recent first), then createdAt for never-used
      const all = await database.progressions.toArray()
      return all.toSorted((a, b) => {
        const aTime = a.lastSessionAt ?? 0
        const bTime = b.lastSessionAt ?? 0
        if (aTime !== bTime) return bTime - aTime
        return b.createdAt - a.createdAt
      })
    },

    async getById(id: string): Promise<DbProgression | undefined> {
      return database.progressions.get(id)
    },

    async create(data: CreateProgressionData): Promise<DbProgression> {
      const startReps = data.startReps ?? 10
      const startMinutes = data.startMinutes ?? 10
      const startingWeightIndex = data.startingWeightIndex ?? 0

      const progression: DbProgression = {
        id: generateId(),
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
        createdAt: Date.now(),
        lastSessionAt: null,
      }

      await database.progressions.add(progression)
      return progression
    },

    async update(
      id: string,
      updates: Partial<Omit<DbProgression, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const count = await database.progressions.where('id').equals(id).modify(updates)
      if (count === 0) {
        throw new Error(`Progression with id ${id} not found`)
      }
    },

    async delete(id: string): Promise<void> {
      await database.transaction('rw', [database.progressions, database.progressionSessions], async () => {
        await database.progressionSessions.where('progressionId').equals(id).delete()
        await database.progressions.delete(id)
      })
    },

    async recordSession(
      progressionId: string,
      completed: boolean,
      nextLevel?: { reps: number; minutes: number; weightIndex: number; isComplete: boolean },
    ): Promise<DbProgressionSession> {
      const progression = await database.progressions.get(progressionId)
      if (!progression) {
        throw new Error(`Progression with id ${progressionId} not found`)
      }

      const now = Date.now()
      const currentWeight = progression.availableWeights[progression.currentWeightIndex]
      if (currentWeight === undefined) {
        throw new Error(`Invalid weight index ${progression.currentWeightIndex}`)
      }

      // Create the session record
      const session: DbProgressionSession = {
        id: generateId(),
        progressionId,
        weight: currentWeight,
        reps: progression.currentReps,
        minutes: progression.currentMinutes,
        completed,
        completedAt: now,
      }

      // Calculate updates for progression
      const updates: Partial<DbProgression> = {
        sessionsCompleted: progression.sessionsCompleted + 1,
        lastSessionAt: now,
      }

      // Only advance if completed successfully and nextLevel is provided
      const shouldAdvanceLevel = completed && !progression.isComplete && nextLevel
      if (shouldAdvanceLevel) {
        updates.currentReps = nextLevel.reps
        updates.currentMinutes = nextLevel.minutes
        updates.currentWeightIndex = nextLevel.weightIndex
        updates.isComplete = nextLevel.isComplete
      }

      // Save both in a transaction
      await database.transaction('rw', [database.progressions, database.progressionSessions], async () => {
        await database.progressionSessions.add(session)
        await database.progressions.update(progressionId, updates)
      })

      return session
    },

    async getSessionHistory(
      progressionId: string,
    ): Promise<ReadonlyArray<DbProgressionSession>> {
      return database.progressionSessions
        .where('progressionId')
        .equals(progressionId)
        .reverse()
        .sortBy('completedAt')
    },
  }
}
