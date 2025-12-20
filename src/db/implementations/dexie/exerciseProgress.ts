import { differenceInDays } from 'date-fns'
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
import type { WorkoutTrackerDb } from './database'

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
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
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
 * Check if a workout falls within the given date range.
 */
function isWithinDateRange(
  workout: DbCompletedWorkout,
  dateRange?: { from: Date; to: Date },
): boolean {
  if (!dateRange) return true
  const workoutDate = new Date(workout.completedAt)
  return workoutDate >= dateRange.from && workoutDate <= dateRange.to
}

/**
 * Build an ExerciseSession from a workout for a specific exercise.
 * Returns null if the workout has no completed sets for this exercise.
 */
function buildExerciseSession(
  workout: DbCompletedWorkout,
  exerciseDefinitionId: string,
): ExerciseSession | null {
  const strengthBlocks = getStrengthBlocksForExercise(workout, exerciseDefinitionId)
  if (strengthBlocks.length === 0) return null

  const allSets = strengthBlocks.flatMap(extractSetPerformances)
  if (allSets.length === 0) return null

  const totalVolume = allSets.reduce((sum, set) => sum + set.kg * set.reps, 0)
  const maxWeight = Math.max(...allSets.map((s) => s.kg))
  const totalReps = allSets.reduce((sum, set) => sum + set.reps, 0)

  return {
    workoutId: workout.id,
    workoutName: workout.name,
    date: new Date(workout.completedAt),
    sets: allSets,
    totalVolume,
    maxWeight,
    totalReps,
  }
}

/**
 * Find exercise name from workout history (legacy support for exercises
 * that don't exist in the custom exercises table).
 */
function findExerciseNameFromWorkouts(
  workouts: ReadonlyArray<DbCompletedWorkout>,
  exerciseDefinitionId: string,
): string {
  for (const workout of workouts) {
    const block = workout.blocks.find(
      (b): b is DbStrengthBlock =>
        b.kind === 'strength' && b.exerciseDefinitionId === exerciseDefinitionId,
    )
    if (block) return block.name
  }
  return ''
}

/**
 * Calculate average frequency in days between sessions.
 */
function calculateFrequencyDays(
  lastPerformed: Date,
  firstPerformed: Date,
  sessionCount: number,
): number | null {
  if (sessionCount <= 1) return null
  const daysBetween = differenceInDays(lastPerformed, firstPerformed)
  return daysBetween / (sessionCount - 1)
}

// --- Personal Records Helper Types & Functions ---

type MaxWeightRecord = { kg: number; date: Date; reps: number }
type MaxE1RMRecord = { kg: number; date: Date; fromReps: number }
type MaxVolumeRecord = { volume: number; date: Date }
type RepsRecord = { reps: number; date: Date }

function updateMaxWeightRecord(
  current: MaxWeightRecord | null,
  set: SetPerformance,
  date: Date,
): MaxWeightRecord | null {
  if (!current || set.kg > current.kg) {
    return { kg: set.kg, date, reps: set.reps }
  }
  return current
}

function updateMaxE1RMRecord(
  current: MaxE1RMRecord | null,
  set: SetPerformance,
  date: Date,
): MaxE1RMRecord | null {
  if (!current || set.estimated1RM > current.kg) {
    return { kg: set.estimated1RM, date, fromReps: set.reps }
  }
  return current
}

function updateMaxVolumeRecord(
  current: MaxVolumeRecord | null,
  session: ExerciseSession,
): MaxVolumeRecord | null {
  if (!current || session.totalVolume > current.volume) {
    return { volume: session.totalVolume, date: session.date }
  }
  return current
}

function updateRepsAtWeight(
  map: Map<number, RepsRecord>,
  set: SetPerformance,
  date: Date,
): void {
  const current = map.get(set.kg)
  if (!current || set.reps > current.reps) {
    map.set(set.kg, { reps: set.reps, date })
  }
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
  db: WorkoutTrackerDb,
): ExerciseProgressRepository {
  return {
    async getExerciseHistory(
      exerciseDefinitionId: string,
      options?: GetExerciseHistoryOptions,
    ): Promise<ReadonlyArray<ExerciseSession>> {
      const { limit, offset = 0, dateRange } = options ?? {}

      const workouts = await db.workouts.orderBy('completedAt').reverse().toArray()

      const sessions = workouts
        .filter((workout) => isWithinDateRange(workout, dateRange))
        .map((workout) => buildExerciseSession(workout, exerciseDefinitionId))
        .filter((session): session is ExerciseSession => session !== null)

      const end = limit ? offset + limit : undefined
      return sessions.slice(offset, end)
    },

    async getExerciseStats(exerciseDefinitionId: string): Promise<ExerciseStats> {
      const sessions = await this.getExerciseHistory(exerciseDefinitionId)

      // Look up exercise name (custom exercises table, then legacy workout fallback)
      const exercise = await db.customExercises.get(exerciseDefinitionId)
      const exerciseName =
        exercise?.name ||
        findExerciseNameFromWorkouts(await db.workouts.toArray(), exerciseDefinitionId)

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
      const firstPerformed = sessions[sessions.length - 1]!.date
      const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0)

      return {
        exerciseDefinitionId,
        exerciseName,
        totalSessions: sessions.length,
        lastPerformed,
        firstPerformed,
        avgVolumePerSession: totalVolume / sessions.length,
        avgFrequencyDays: calculateFrequencyDays(lastPerformed, firstPerformed, sessions.length),
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

      let maxWeight: MaxWeightRecord | null = null
      let estimated1RM: MaxE1RMRecord | null = null
      let maxVolume: MaxVolumeRecord | null = null
      const maxRepsAtWeight = new Map<number, RepsRecord>()

      for (const session of sessions) {
        maxVolume = updateMaxVolumeRecord(maxVolume, session)
        for (const set of session.sets) {
          maxWeight = updateMaxWeightRecord(maxWeight, set, session.date)
          estimated1RM = updateMaxE1RMRecord(estimated1RM, set, session.date)
          updateRepsAtWeight(maxRepsAtWeight, set, session.date)
        }
      }

      return { maxWeight, estimated1RM, maxVolume, maxRepsAtWeight }
    },

    async getPerformedExercises(): Promise<ReadonlyArray<PerformedExercise>> {
      const workouts = await db.workouts.toArray()

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
      return Array.from(exerciseMap.entries())
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
