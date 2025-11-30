// In-memory workout factories (for useWorkout composable)
export { createCompletedSet, createEmptySet, createRandomSet, createSet } from './set.factory'
export { createStrengthBlock, createStrengthBlockWithSets } from './block.factory'
export { createExercise, createExerciseWithSets, createRandomExercise } from './exercise.factory'
export { createWorkout } from './workout.factory'
export { WorkoutBuilder, workoutBuilder } from './workout.builder'
export { createCustomExercise, createRandomCustomExercise } from './customExercise.factory'

// Database factories (for integration tests with IndexedDB)
export { createDbSet, createDbPlannedSet } from './dbSet.factory'
export { createDbStrengthBlock, createDbStrengthBlockWithSets } from './dbBlock.factory'
export { createDbExercise, createDbExerciseWithSets } from './dbExercise.factory'
export { createDbCompletedWorkout, DbWorkoutBuilder, dbWorkoutBuilder } from './dbWorkout.factory'
