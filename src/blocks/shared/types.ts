/**
 * Building blocks shared by multiple block kinds.
 */

/**
 * Simplified exercise for timed blocks.
 * Unlike strength exercises, these don't track individual sets.
 */
export type BlockExercise = {
  id: string
  name: string
  prescribedReps: number
  load: string | null // "24kg", "bodyweight", "light band"
  image: Blob | null
}

/**
 * Database counterpart of BlockExercise (embedded in timed blocks).
 */
export type DbBlockExercise = {
  id: string
  name: string
  prescribedReps: number
  load: string | null
  image: Blob | null
}

/**
 * Template counterpart of DbBlockExercise: no instance id; carries the
 * exercise-catalog link instead so instantiation can resolve or regenerate ids.
 */
export type DbTemplateBlockExercise = {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  load: string | null
  image: Blob | null
}
