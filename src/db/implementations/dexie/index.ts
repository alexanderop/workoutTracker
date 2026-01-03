import type { RepositoryProvider } from '@/db/interfaces'
import { db as database } from './database'
import { createDexieActiveBenchmarkWorkoutRepository } from './activeBenchmarkWorkout'
import { createDexieActiveWorkoutRepository } from './activeWorkout'
import { createDexieBenchmarksRepository } from './benchmarks'
import { createDexieCustomExercisesRepository } from './customExercises'
import { createDexieDataManagementRepository } from './dataManagement'
import { createDexieDraftsRepository } from './drafts'
import { createDexieOnboardingRepository } from './onboarding'
import { createDexieProgressionsRepository } from './progressions'
import { createDexieSettingsRepository } from './settings'
import { createDexieTemplatesRepository } from './templates'
import { createDexieWeightRepository } from './weight'
import { createDexieWorkoutsRepository } from './workouts'

export function createDexieRepositoryProvider(): RepositoryProvider {
  return {
    activeWorkout: createDexieActiveWorkoutRepository(database),
    activeBenchmark: createDexieActiveBenchmarkWorkoutRepository(database),
    workouts: createDexieWorkoutsRepository(database),
    templates: createDexieTemplatesRepository(database),
    customExercises: createDexieCustomExercisesRepository(database),
    settings: createDexieSettingsRepository(database),
    dataManagement: createDexieDataManagementRepository(database),
    benchmarks: createDexieBenchmarksRepository(database),
    weight: createDexieWeightRepository(database),
    drafts: createDexieDraftsRepository(database),
    progressions: createDexieProgressionsRepository(database),
    onboarding: createDexieOnboardingRepository(database),
  }
}
