import { getWorkoutsRepository } from '@/db'
import type { DbCompletedWorkout, DbStrengthBlock } from '@/db/schema'
import { isDbStrengthBlock } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'

// ============================================
// Types
// ============================================

export type LastSessionSetData = {
  kg: string
  reps: string
}

export type LastSessionData = {
  workoutId: string
  workoutName: string
  completedAt: number
  sets: ReadonlyArray<LastSessionSetData>
}

// ============================================
// Session Cache
// ============================================

const sessionCache = new Map<string, LastSessionData | null>()

export function clearLastSessionCache(): void {
  sessionCache.clear()
}

// ============================================
// Pure Functions (Functional Core)
// ============================================

function findExerciseBlock(
  workout: DbCompletedWorkout,
  exerciseDefinitionId: string,
): DbStrengthBlock | undefined {
  // Search blocks in reverse order to find the last occurrence
  // if the exercise appears multiple times in the same workout
  const blocks = [...workout.blocks].toReversed()

  for (const block of blocks) {
    if (isDbStrengthBlock(block) && block.exerciseDefinitionId === exerciseDefinitionId) {
      return block
    }
  }

  return undefined
}

function extractCompletedSets(block: DbStrengthBlock): ReadonlyArray<LastSessionSetData> {
  return block.sets
    .filter((set) => set.status === 'completed' && (set.kg !== '' || set.reps !== ''))
    .map((set) => ({
      kg: set.kg,
      reps: set.reps,
    }))
}

function createLastSessionData(
  workout: DbCompletedWorkout,
  sets: ReadonlyArray<LastSessionSetData>,
): LastSessionData {
  return {
    workoutId: workout.id,
    workoutName: workout.name,
    completedAt: workout.completedAt,
    sets,
  }
}

// ============================================
// Exported Functions
// ============================================

/**
 * Fetches the last session data for a specific exercise from workout history.
 * Results are cached to avoid repeated database queries within the same session.
 *
 * @param exerciseDefinitionId - The ID of the exercise to look up
 * @returns LastSessionData if found, null if no history exists
 */
export async function fetchLastExerciseSession(
  exerciseDefinitionId: string,
): Promise<LastSessionData | null> {
  // Check cache first
  if (sessionCache.has(exerciseDefinitionId)) {
    return sessionCache.get(exerciseDefinitionId) ?? null
  }

  // Fetch recent workout history (last 50 workouts should be enough)
  const [error, workouts] = await tryCatch(getWorkoutsRepository().getHistory({ limit: 50 }))

  if (error || !workouts) {
    sessionCache.set(exerciseDefinitionId, null)
    return null
  }

  // Find the most recent workout containing this exercise
  for (const workout of workouts) {
    const block = findExerciseBlock(workout, exerciseDefinitionId)

    if (block) {
      const completedSets = extractCompletedSets(block)

      // Only return if there are completed sets with data
      if (completedSets.length > 0) {
        const sessionData = createLastSessionData(workout, completedSets)
        sessionCache.set(exerciseDefinitionId, sessionData)
        return sessionData
      }
    }
  }

  // No history found
  sessionCache.set(exerciseDefinitionId, null)
  return null
}
