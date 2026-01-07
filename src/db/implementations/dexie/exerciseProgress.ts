import type {
  ExerciseProgressRepository,
  GetExerciseHistoryOptions,
} from '@/db/interfaces'
import type {
  DbCompletedWorkout,
  DbStrengthBlock,
  ExerciseSession,
  ExerciseStats,
  PerformedExercise,
  PersonalRecords,
  SetPerformance,
} from '@/db/schema'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

/**
 * Calculate estimated 1RM using Brzycki formula.
 * Returns the actual weight for single rep.
 * For high reps (>12), the formula becomes less accurate.
 */
function calculateEstimated1RM(kg: number, reps: number): number {
  if (reps <= 0 || kg <= 0) return 0
  if (reps === 1) return kg
  // Brzycki formula: weight × (36 / (37 - reps))
  // Capped at 12 reps for accuracy
  const effectiveReps = Math.min(reps, 12)
  return kg * (36 / (37 - effectiveReps))
}

/**
 * Parse a string value to number, returning 0 for invalid values.
 */
function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * Extract strength blocks containing a specific exercise from a workout.
 */
function getStrengthBlocksForExercise(
  workout: DbCompletedWorkout,
  exerciseDefinitionId: string,
): ReadonlyArray<DbStrengthBlock> {
  return workout.blocks.filter(
    (block): block is DbStrengthBlock =>
      block.kind === 'strength' && block.exerciseDefinitionId === exerciseDefinitionId,
  )
}

/**
 * Convert a strength block to set performance data.
 */
function extractSetPerformances(block: DbStrengthBlock): ReadonlyArray<SetPerformance> {
  return block.sets
    .filter((set) => set.status === 'completed')
    .map((set) => {
      const kg = parseNumber(set.kg)
      const reps = parseNumber(set.reps)
      const duration = parseNumber(set.duration)
      const rirValue = parseNumber(set.rir)
      return {
        kg,
        reps,
        duration,
        rir: rirValue > 0 ? rirValue : null,
        estimated1RM: calculateEstimated1RM(kg, reps),
      }
    })
    // Keep weight-based sets OR duration-based sets (for isometric exercises)
    .filter((set) => (set.kg > 0 && set.reps > 0) || set.duration > 0)
}

/**
 * Check if a workout is within the specified date range.
 */
function isWithinDateRange(
  workout: DbCompletedWorkout,
  dateRange: { from: Date; to: Date } | undefined,
): boolean {
  if (!dateRange) return true
  const workoutDate = new Date(workout.completedAt)
  return workoutDate >= dateRange.from && workoutDate <= dateRange.to
}

/**
 * Extract exercise sessions from workouts for a specific exercise.
 */
function extractExerciseSessions(
  workouts: ReadonlyArray<DbCompletedWorkout>,
  exerciseDefinitionId: string,
  dateRange?: { from: Date; to: Date },
): Array<ExerciseSession> {
  const sessions: Array<ExerciseSession> = []

  for (const workout of workouts) {
    if (!isWithinDateRange(workout, dateRange)) continue

    const strengthBlocks = getStrengthBlocksForExercise(workout, exerciseDefinitionId)
    if (strengthBlocks.length === 0) continue

    const allSets: Array<SetPerformance> = strengthBlocks.flatMap(extractSetPerformances)
    if (allSets.length === 0) continue

    sessions.push({
      workoutId: workout.id,
      workoutName: workout.name,
      date: new Date(workout.completedAt),
      sets: allSets,
      totalVolume: allSets.reduce((sum, set) => sum + set.kg * set.reps, 0),
      maxWeight: Math.max(...allSets.map((s) => s.kg)),
      totalReps: allSets.reduce((sum, set) => sum + set.reps, 0),
    })
  }

  return sessions
}

/**
 * Find exercise name from workouts (legacy support when not in exercises table).
 */
function findExerciseNameFromWorkouts(
  workouts: ReadonlyArray<DbCompletedWorkout>,
  exerciseDefinitionId: string,
): string {
  for (const workout of workouts) {
    for (const block of workout.blocks) {
      if (block.kind === 'strength' && block.exerciseDefinitionId === exerciseDefinitionId) {
        return block.name
      }
    }
  }
  return ''
}

/**
 * Update personal records tracking maps based on a single set.
 */
function updateSetRecords(
  set: SetPerformance,
  sessionDate: Date,
  records: {
    maxWeight: { kg: number; date: Date; reps: number } | null
    maxE1RM: { kg: number; date: Date; fromReps: number } | null
    repsAtWeight: Map<number, { reps: number; date: Date }>
  },
): void {
  if (!records.maxWeight || set.kg > records.maxWeight.kg) {
    records.maxWeight = { kg: set.kg, date: sessionDate, reps: set.reps }
  }

  if (!records.maxE1RM || set.estimated1RM > records.maxE1RM.kg) {
    records.maxE1RM = { kg: set.estimated1RM, date: sessionDate, fromReps: set.reps }
  }

  const currentRecord = records.repsAtWeight.get(set.kg)
  if (!currentRecord || set.reps > currentRecord.reps) {
    records.repsAtWeight.set(set.kg, { reps: set.reps, date: sessionDate })
  }
}

export function createDexieExerciseProgressRepository(
  database: WorkoutTrackerDatabase,
): ExerciseProgressRepository {
  return {
    async getExerciseHistory(
      exerciseDefinitionId: string,
      options?: GetExerciseHistoryOptions,
    ): Promise<ReadonlyArray<ExerciseSession>> {
      const { limit, offset = 0, dateRange } = options ?? {}

      const workouts = await database.workouts.orderBy('completedAt').reverse().toArray()
      const sessions = extractExerciseSessions(workouts, exerciseDefinitionId, dateRange)

      // Apply pagination
      const end = limit ? offset + limit : undefined
      return sessions.slice(offset, end)
    },

    async getExerciseStats(exerciseDefinitionId: string): Promise<ExerciseStats> {
      const sessions = await this.getExerciseHistory(exerciseDefinitionId)

      // Look up exercise name from the exercises table, or fall back to workouts
      const exercise = await database.customExercises.get(exerciseDefinitionId)
      const workouts = await database.workouts.toArray()
      const exerciseName =
        exercise?.name || findExerciseNameFromWorkouts(workouts, exerciseDefinitionId)

      if (sessions.length === 0) {
        return {
          exerciseDefinitionId,
          exerciseName,
          totalSessions: 0,
          lastPerformed: null,
          firstPerformed: null,
          avgVolumePerSession: 0,
          avgFrequencyDays: null,
        }
      }

      // Sessions are sorted newest first
      const lastPerformed = sessions[0]!.date
      const firstPerformed = sessions.at(-1)!.date
      const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0)

      // Calculate average frequency (days between sessions)
      const avgFrequencyDays =
        sessions.length > 1
          ? (lastPerformed.getTime() - firstPerformed.getTime()) /
            (1000 * 60 * 60 * 24) /
            (sessions.length - 1)
          : null

      return {
        exerciseDefinitionId,
        exerciseName,
        totalSessions: sessions.length,
        lastPerformed,
        firstPerformed,
        avgVolumePerSession: totalVolume / sessions.length,
        avgFrequencyDays,
      }
    },

    async getPersonalRecords(exerciseDefinitionId: string): Promise<PersonalRecords> {
      const sessions = await this.getExerciseHistory(exerciseDefinitionId)

      if (sessions.length === 0) {
        return {
          maxWeight: null,
          estimated1RM: null,
          maxVolume: null,
          maxRepsAtWeight: new Map(),
        }
      }

      const records: {
        maxWeight: { kg: number; date: Date; reps: number } | null
        maxE1RM: { kg: number; date: Date; fromReps: number } | null
        repsAtWeight: Map<number, { reps: number; date: Date }>
      } = {
        maxWeight: null,
        maxE1RM: null,
        repsAtWeight: new Map(),
      }
      let maxVolumeRecord: { volume: number; date: Date } | null = null

      for (const session of sessions) {
        // Check volume PR
        if (!maxVolumeRecord || session.totalVolume > maxVolumeRecord.volume) {
          maxVolumeRecord = { volume: session.totalVolume, date: session.date }
        }

        // Process all sets for weight/1RM/reps records
        for (const set of session.sets) {
          updateSetRecords(set, session.date, records)
        }
      }

      return {
        maxWeight: records.maxWeight,
        estimated1RM: records.maxE1RM,
        maxVolume: maxVolumeRecord,
        maxRepsAtWeight: records.repsAtWeight,
      }
    },

    async getPerformedExercises(): Promise<ReadonlyArray<PerformedExercise>> {
      const workouts = await database.workouts.toArray()

      // Track exercise occurrences
      const exerciseMap = new Map<
        string,
        { name: string; workoutCount: number; lastPerformed: Date }
      >()

      for (const workout of workouts) {
        // Track which exercises appear in this workout (count each exercise once per workout)
        const exercisesInWorkout = new Set<string>()

        for (const block of workout.blocks) {
          if (block.kind !== 'strength' || !block.exerciseDefinitionId) continue

          exercisesInWorkout.add(block.exerciseDefinitionId)
          const workoutDate = new Date(workout.completedAt)
          const existing = exerciseMap.get(block.exerciseDefinitionId)

          if (!existing) {
            exerciseMap.set(block.exerciseDefinitionId, {
              name: block.name,
              workoutCount: 0, // Will increment below
              lastPerformed: workoutDate,
            })
            continue
          }

          if (workoutDate > existing.lastPerformed) {
            existing.lastPerformed = workoutDate
            existing.name = block.name
          }
        }

        // Increment workout count for each exercise that appeared
        for (const exerciseId of exercisesInWorkout) {
          const entry = exerciseMap.get(exerciseId)
          if (entry) {
            entry.workoutCount++
          }
        }
      }

      // Convert to array and sort by workout count (most frequent first)
      return [...exerciseMap.entries()]
        .map(([exerciseDefinitionId, data]) => ({
          exerciseDefinitionId,
          name: data.name,
          workoutCount: data.workoutCount,
          lastPerformed: data.lastPerformed,
        }))
        .toSorted((a, b) => b.workoutCount - a.workoutCount)
    },
  }
}
