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
      const rirValue = parseNumber(set.rir)
      return {
        kg,
        reps,
        rir: rirValue > 0 ? rirValue : null,
        estimated1RM: calculateEstimated1RM(kg, reps),
      }
    })
    .filter((set) => set.kg > 0 && set.reps > 0)
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

      // Get all completed workouts
      const query = database.workouts.orderBy('completedAt').reverse()

      // Apply date range filter if provided
      const workouts = await query.toArray()

      // Filter workouts containing this exercise and within date range
      const sessions: Array<ExerciseSession> = []

      for (const workout of workouts) {
        // Check date range
        if (dateRange) {
          const workoutDate = new Date(workout.completedAt)
          if (workoutDate < dateRange.from || workoutDate > dateRange.to) {
            continue
          }
        }

        // Get strength blocks for this exercise
        const strengthBlocks = getStrengthBlocksForExercise(workout, exerciseDefinitionId)
        if (strengthBlocks.length === 0) continue

        // Extract all set performances from all matching blocks
        const allSets: Array<SetPerformance> = []
        for (const block of strengthBlocks) {
          allSets.push(...extractSetPerformances(block))
        }

        if (allSets.length === 0) continue

        // Calculate aggregates
        const totalVolume = allSets.reduce((sum, set) => sum + set.kg * set.reps, 0)
        const maxWeight = Math.max(...allSets.map((s) => s.kg))
        const totalReps = allSets.reduce((sum, set) => sum + set.reps, 0)

        sessions.push({
          workoutId: workout.id,
          workoutName: workout.name,
          date: new Date(workout.completedAt),
          sets: allSets,
          totalVolume,
          maxWeight,
          totalReps,
        })
      }

      // Apply pagination
      const start = offset
      const end = limit ? offset + limit : undefined
      return sessions.slice(start, end)
    },

    async getExerciseStats(exerciseDefinitionId: string): Promise<ExerciseStats> {
      const sessions = await this.getExerciseHistory(exerciseDefinitionId)

      // Look up exercise name from the exercises table first
      const exercise = await database.customExercises.get(exerciseDefinitionId)
      let exerciseName = exercise?.name ?? ''

      // If not found in exercises table, try to find from workouts (legacy support)
      if (!exerciseName) {
        const workouts = await database.workouts.toArray()
        for (const workout of workouts) {
          for (const block of workout.blocks) {
            if (
              block.kind === 'strength' &&
              block.exerciseDefinitionId === exerciseDefinitionId
            ) {
              exerciseName = block.name
              break
            }
          }
          if (exerciseName) break
        }
      }

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

      // Sessions are sorted newest first (array is guaranteed non-empty from early return above)
      const lastPerformed = sessions[0]!.date
      const firstPerformed = sessions.at(-1)!.date

      // Calculate average volume
      const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0)
      const avgVolumePerSession = totalVolume / sessions.length

      // Calculate average frequency (days between sessions)
      let avgFrequencyDays: number | null = null
      if (sessions.length > 1) {
        const daysBetween =
          (lastPerformed.getTime() - firstPerformed.getTime()) / (1000 * 60 * 60 * 24)
        avgFrequencyDays = daysBetween / (sessions.length - 1)
      }

      return {
        exerciseDefinitionId,
        exerciseName,
        totalSessions: sessions.length,
        lastPerformed,
        firstPerformed,
        avgVolumePerSession,
        avgFrequencyDays,
      }
    },

    async getPersonalRecords(exerciseDefinitionId: string): Promise<PersonalRecords> {
      const sessions = await this.getExerciseHistory(exerciseDefinitionId)

      const result: PersonalRecords = {
        maxWeight: null,
        estimated1RM: null,
        maxVolume: null,
        maxRepsAtWeight: new Map(),
      }

      if (sessions.length === 0) {
        return result
      }

      // Track max weight, estimated 1RM, and volume
      let maxWeightRecord: { kg: number; date: Date; reps: number } | null = null
      let maxE1RMRecord: { kg: number; date: Date; fromReps: number } | null = null
      let maxVolumeRecord: { volume: number; date: Date } | null = null
      const repsAtWeight = new Map<number, { reps: number; date: Date }>()

      for (const session of sessions) {
        // Check volume PR
        if (!maxVolumeRecord || session.totalVolume > maxVolumeRecord.volume) {
          maxVolumeRecord = { volume: session.totalVolume, date: session.date }
        }

        for (const set of session.sets) {
          // Check max weight
          if (!maxWeightRecord || set.kg > maxWeightRecord.kg) {
            maxWeightRecord = { kg: set.kg, date: session.date, reps: set.reps }
          }

          // Check estimated 1RM
          if (!maxE1RMRecord || set.estimated1RM > maxE1RMRecord.kg) {
            maxE1RMRecord = {
              kg: set.estimated1RM,
              date: session.date,
              fromReps: set.reps,
            }
          }

          // Track max reps at each weight
          const currentRecord = repsAtWeight.get(set.kg)
          if (!currentRecord || set.reps > currentRecord.reps) {
            repsAtWeight.set(set.kg, { reps: set.reps, date: session.date })
          }
        }
      }

      return {
        maxWeight: maxWeightRecord,
        estimated1RM: maxE1RMRecord,
        maxVolume: maxVolumeRecord,
        maxRepsAtWeight: repsAtWeight,
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
