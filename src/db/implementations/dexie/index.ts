import type { RepositoryProvider } from '@/db/interfaces'
import { db as database } from './database'
import { createDexieActiveBenchmarkWorkoutRepository as createDexieActiveBenchmarkWorkoutRepo } from './activeBenchmarkWorkout'
import { createDexieActiveWorkoutRepository as createDexieActiveWorkoutRepo } from './activeWorkout'
import { createDexieBenchmarksRepository as createDexieBenchmarksRepo } from './benchmarks'
import { createDexieCustomExercisesRepository as createDexieCustomExercisesRepo } from './customExercises'
import { createDexieDataManagementRepository as createDexieDataManagementRepo } from './dataManagement'
import { createDexieDraftsRepository as createDexieDraftsRepo } from './drafts'
import { createDexieOnboardingRepository as createDexieOnboardingRepo } from './onboarding'
import { createDexieProgressionsRepository as createDexieProgressionsRepo } from './progressions'
import { createDexieSettingsRepository as createDexieSettingsRepo } from './settings'
import { createDexieTemplatesRepository } from './templates'
import { createDexieWeightRepository } from './weight'
import { createDexieWorkoutsRepository } from './workouts'

export function createDexieRepositoryProvider(): RepositoryProvider {
  return {
    activeWorkout: createDexieActiveWorkoutRepo(database),
    activeBenchmark: createDexieActiveBenchmarkWorkoutRepo(database),
    workouts: createDexieWorkoutsRepository(database),
    templates: createDexieTemplatesRepository(database),
    customExercises: createDexieCustomExercisesRepo(database),
    settings: createDexieSettingsRepo(database),
    dataManagement: createDexieDataManagementRepo(database),
    benchmarks: createDexieBenchmarksRepo(database),
    weight: createDexieWeightRepository(database),
    drafts: createDexieDraftsRepo(database),
    progressions: createDexieProgressionsRepo(database),
    onboarding: createDexieOnboardingRepo(database),
  }
}

