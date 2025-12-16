import type { RepositoryProvider } from '@/db/interfaces'
import { createDexieActiveBenchmarkWorkoutRepository } from './activeBenchmarkWorkout'
import { createDexieActiveWorkoutRepository } from './activeWorkout'
import { createDexieBenchmarkAttemptsRepository } from './benchmarkAttempts'
import { createDexieBenchmarkPersonalBestsRepository } from './benchmarkPersonalBests'
import { createDexieBenchmarksRepository } from './benchmarks'
import { createDexieBlockExercisesRepository } from './blockExercises'
import { createDexieDataManagementRepository } from './dataManagement'
import { createDexieExercisesRepository } from './exercises'
import { createDexieSettingsRepository } from './settings'
import { createDexieTemplateBlockExercisesRepository } from './templateBlockExercises'
import { createDexieTemplateBlocksRepository } from './templateBlocks'
import { createDexieTemplatesRepository } from './templates'
import { createDexieWorkoutBlocksRepository } from './workoutBlocks'
import { createDexieWorkoutSetsRepository } from './workoutSets'
import { createDexieWorkoutsRepository } from './workouts'

export function createDexieRepositoryProvider(): RepositoryProvider {
  return {
    // Singletons
    activeWorkout: createDexieActiveWorkoutRepository(),
    activeBenchmark: createDexieActiveBenchmarkWorkoutRepository(),
    settings: createDexieSettingsRepository(),

    // Core entities
    exercises: createDexieExercisesRepository(),
    benchmarks: createDexieBenchmarksRepository(),
    templates: createDexieTemplatesRepository(),
    workouts: createDexieWorkoutsRepository(),

    // Normalized data (internal use)
    workoutBlocks: createDexieWorkoutBlocksRepository(),
    workoutSets: createDexieWorkoutSetsRepository(),
    blockExercises: createDexieBlockExercisesRepository(),
    templateBlocks: createDexieTemplateBlocksRepository(),
    templateBlockExercises: createDexieTemplateBlockExercisesRepository(),
    benchmarkAttempts: createDexieBenchmarkAttemptsRepository(),
    benchmarkPersonalBests: createDexieBenchmarkPersonalBestsRepository(),

    // Data management
    dataManagement: createDexieDataManagementRepository(),
  }
}
