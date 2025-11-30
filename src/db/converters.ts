import type { Exercise, Set, Workout } from '@/composables/useWorkout'
import type { CustomExercise } from '@/stores/exercises'
import type { DbActiveWorkout, DbCustomExercise, DbSet, DbWorkoutExercise } from './schema'
import { generateId } from './index'

// ============================================
// Workout Converters
// ============================================

/**
 * Convert in-memory Set to database format.
 */
function setToDb(set: Readonly<Set>): DbSet {
  return {
    id: String(set.id),
    kg: set.kg,
    reps: set.reps,
    rir: set.rir,
    status: set.status,
    completedAt: set.status === 'completed' ? Date.now() : null,
  }
}

/**
 * Convert database Set to in-memory format.
 */
function dbToSet(dbSet: Readonly<DbSet>, index: number): Set {
  return {
    id: index + 1,
    kg: dbSet.kg,
    reps: dbSet.reps,
    rir: dbSet.rir,
    status: dbSet.status,
  }
}

/**
 * Convert in-memory Exercise to database format.
 */
function exerciseToDb(exercise: Readonly<Exercise>, orderIndex: number): DbWorkoutExercise {
  return {
    id: String(exercise.id),
    exerciseDefinitionId: null,
    name: exercise.name,
    equipment: exercise.equipment,
    targetReps: exercise.targetReps,
    thumbnail: exercise.thumbnail,
    orderIndex,
    sets: exercise.sets.map(setToDb),
  }
}

/**
 * Convert database Exercise to in-memory format.
 */
function dbToExercise(dbExercise: Readonly<DbWorkoutExercise>, index: number): Exercise {
  return {
    id: index + 1,
    name: dbExercise.name,
    equipment: dbExercise.equipment,
    targetReps: dbExercise.targetReps,
    thumbnail: dbExercise.thumbnail,
    sets: dbExercise.sets.map(dbToSet),
  }
}

/**
 * Convert in-memory Workout to database ActiveWorkout format.
 */
export function workoutToDb(
  workout: Readonly<Workout>,
  existingStartedAt?: number,
): DbActiveWorkout {
  // Find selected exercise's string ID
  const selectedExerciseIndex = workout.exercises.findIndex(
    (ex) => ex.id === workout.selectedExerciseId,
  )
  const selectedExerciseDbId = selectedExerciseIndex >= 0 ? String(workout.selectedExerciseId) : ''

  return {
    id: 'current',
    name: workout.name,
    selectedExerciseId: selectedExerciseDbId,
    startedAt: existingStartedAt ?? Date.now(),
    lastModifiedAt: Date.now(),
    exercises: workout.exercises.map((ex, index) => exerciseToDb(ex, index)),
  }
}

/**
 * Convert database ActiveWorkout to in-memory Workout format.
 */
export function dbToWorkout(dbWorkout: Readonly<DbActiveWorkout>): Workout {
  const sortedExercises = [...dbWorkout.exercises]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(dbToExercise)

  // Find selected exercise ID from db string ID
  const selectedIndex = dbWorkout.exercises.findIndex(
    (ex) => ex.id === dbWorkout.selectedExerciseId,
  )
  const selectedExerciseId =
    selectedIndex >= 0 ? (sortedExercises[selectedIndex]?.id ?? 0) : (sortedExercises[0]?.id ?? 0)

  return {
    id: 1,
    name: dbWorkout.name,
    selectedExerciseId,
    exercises: sortedExercises,
  }
}

// ============================================
// Custom Exercise Converters
// ============================================

/**
 * Convert in-memory CustomExercise to database format.
 */
export function customExerciseToDb(exercise: Readonly<CustomExercise>): DbCustomExercise {
  return {
    id: exercise.id,
    icon: exercise.icon,
    name: exercise.name,
    equipment: exercise.equipment ?? null,
    muscle: exercise.muscle ?? null,
    type: exercise.type,
    metrics: exercise.metrics,
    createdAt: exercise.createdAt,
    updatedAt: Date.now(),
  }
}

/**
 * Convert database CustomExercise to in-memory format.
 */
export function dbToCustomExercise(dbExercise: Readonly<DbCustomExercise>): CustomExercise {
  return {
    id: dbExercise.id,
    icon: dbExercise.icon,
    name: dbExercise.name,
    equipment: dbExercise.equipment ?? undefined,
    muscle: dbExercise.muscle ?? undefined,
    type: dbExercise.type,
    metrics: dbExercise.metrics,
    createdAt: dbExercise.createdAt,
  }
}

/**
 * Create a new CustomExercise for database storage.
 */
export function createDbCustomExercise(
  exercise: Omit<CustomExercise, 'id' | 'createdAt'>,
): DbCustomExercise {
  const now = Date.now()
  return {
    id: generateId(),
    icon: exercise.icon,
    name: exercise.name,
    equipment: exercise.equipment ?? null,
    muscle: exercise.muscle ?? null,
    type: exercise.type,
    metrics: exercise.metrics,
    createdAt: now,
    updatedAt: now,
  }
}
