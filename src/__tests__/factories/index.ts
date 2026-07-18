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
export {
  createDbTemplate,
  createDbTemplateStrengthBlock,
  createDbTemplateBlockExercise,
  createDbTemplateAmrapBlock,
  createDbTemplateEmomBlock,
  createDbTemplateTabataBlock,
  createDbTemplateForTimeBlock,
  createDbTemplateCardioBlock,
} from './template.factory'

// Benchmark factories
export {
  createDbBenchmark,
  createDbBenchmarkRound,
  createDbBenchmarkRoundExercise,
  createDbForTimeBenchmark,
  createDbPyramidBenchmark,
} from './benchmark.factory'

// Benchmark types
export type { DbBenchmarkRound, DbBenchmarkRoundExercise } from './benchmark.factory'

// Timed block factories
export {
  createDbAmrapBlock,
  createDbAmrapResult,
  createDbBlockExercise,
  createDbForTimeBlock,
  createDbForTimeResult,
} from './timedBlock.factory'

// Image factories
export { createTestImageBlob, createTestImageFile } from './image'

// Habit factories
export {
  createDbHabit,
  createDbHabitEntry,
  createDbHabitEntryForDate,
  createDbHabitEntriesForDays,
} from './dbHabit.factory'

// Utility
export { generateId } from '@/db'
