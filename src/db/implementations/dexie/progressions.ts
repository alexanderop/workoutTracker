import type { CreateProgressionData, ProgressionsRepository } from '@/db/interfaces'
import type { DbProgression, DbProgressionSession } from '@/db/schema'
import type { WorkoutTrackerDb } from './database'
import { generateId } from './database'

/**
 * Calculate the next level after a successful session.
 * Progression order: reps → time → weight
 */
function calculateNextLevel(current: DbProgression): {
  reps: number
  minutes: number
  weightIndex: number
  isComplete: boolean
} {
  // Phase 1: Increasing reps (10→12→14→16→18→20)
  if (current.currentReps < current.maxReps) {
    return {
      reps: current.currentReps + current.repIncrement,
      minutes: current.currentMinutes,
      weightIndex: current.currentWeightIndex,
      isComplete: false,
    }
  }

  // Phase 2: At max reps, increase time (10→12→...→20 min)
  if (current.currentMinutes < current.maxMinutes) {
    return {
      reps: current.maxReps, // Stay at max reps
      minutes: current.currentMinutes + current.minuteIncrement,
      weightIndex: current.currentWeightIndex,
      isComplete: false,
    }
  }

  // Phase 3: Both maxed → next kettlebell
  const nextWeightIndex = current.currentWeightIndex + 1
  if (nextWeightIndex >= current.availableWeights.length) {
    // All kettlebells completed!
    return {
      reps: current.currentReps,
      minutes: current.currentMinutes,
      weightIndex: current.currentWeightIndex,
      isComplete: true,
    }
  }

  // Reset to starting values with new weight
  return {
    reps: current.startReps,
    minutes: current.startMinutes,
    weightIndex: nextWeightIndex,
    isComplete: false,
  }
}

export function createDexieProgressionsRepository(
  db: WorkoutTrackerDb,
): ProgressionsRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbProgression>> {
      // Sort by lastSessionAt (most recent first), then createdAt for never-used
      const all = await db.progressions.toArray()
      return all.toSorted((a, b) => {
        const aTime = a.lastSessionAt ?? 0
        const bTime = b.lastSessionAt ?? 0
        if (aTime !== bTime) return bTime - aTime
        return b.createdAt - a.createdAt
      })
    },

    async getById(id: string): Promise<DbProgression | undefined> {
      return db.progressions.get(id)
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

      await db.progressions.add(progression)
      return progression
    },

    async update(
      id: string,
      updates: Partial<Omit<DbProgression, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const count = await db.progressions.where('id').equals(id).modify(updates)
      if (count === 0) {
        throw new Error(`Progression with id ${id} not found`)
      }
    },

    async delete(id: string): Promise<void> {
      await db.transaction('rw', [db.progressions, db.progressionSessions], async () => {
        await db.progressionSessions.where('progressionId').equals(id).delete()
        await db.progressions.delete(id)
      })
    },

    async recordSession(
      progressionId: string,
      completed: boolean,
    ): Promise<DbProgressionSession> {
      const progression = await db.progressions.get(progressionId)
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

      // Only advance if completed successfully
      if (completed && !progression.isComplete) {
        const next = calculateNextLevel(progression)
        updates.currentReps = next.reps
        updates.currentMinutes = next.minutes
        updates.currentWeightIndex = next.weightIndex
        updates.isComplete = next.isComplete
      }

      // Save both in a transaction
      await db.transaction('rw', [db.progressions, db.progressionSessions], async () => {
        await db.progressionSessions.add(session)
        await db.progressions.update(progressionId, updates)
      })

      return session
    },

    async getSessionHistory(
      progressionId: string,
    ): Promise<ReadonlyArray<DbProgressionSession>> {
      return db.progressionSessions
        .where('progressionId')
        .equals(progressionId)
        .reverse()
        .sortBy('completedAt')
    },
  }
}
