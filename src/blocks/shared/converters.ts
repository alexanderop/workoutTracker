import type { BlockExercise, DbBlockExercise, DbTemplateBlockExercise } from './types'

export function blockExerciseToDatabase(exercise: Readonly<BlockExercise>): DbBlockExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    image: exercise.image,
  }
}

export function databaseToBlockExercise(
  databaseExercise: Readonly<DbBlockExercise>,
): BlockExercise {
  return {
    id: databaseExercise.id,
    name: databaseExercise.name,
    prescribedReps: databaseExercise.prescribedReps,
    load: databaseExercise.load,
    image: databaseExercise.image,
  }
}

/**
 * Convert a stored block exercise to its template counterpart. Templates drop
 * the instance id; a fresh one is generated when the template is instantiated.
 */
export function blockExerciseToTemplate(
  exercise: Readonly<DbBlockExercise>,
): DbTemplateBlockExercise {
  return {
    exerciseDefinitionId: null,
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    image: exercise.image,
  }
}

/**
 * Convert a template exercise to a stored block exercise with a generated id.
 */
export function templateExerciseToBlock(
  exercise: Readonly<DbTemplateBlockExercise>,
  generateId: () => string,
): DbBlockExercise {
  return {
    id: generateId(),
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    image: exercise.image,
  }
}

/**
 * Map template exercises to stored block exercises with generated ids.
 */
export function templateExercisesToBlocks(
  exercises: ReadonlyArray<Readonly<DbTemplateBlockExercise>>,
  generateId: () => string,
): Array<DbBlockExercise> {
  return exercises.map((exercise) => templateExerciseToBlock(exercise, generateId))
}
