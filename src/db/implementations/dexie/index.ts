import type { RepositoryProvider } from '@/db/interfaces'
import { db } from './database'
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
    activeWorkout: createDexieActiveWorkoutRepository(db),
    activeBenchmark: createDexieActiveBenchmarkWorkoutRepository(db),
    workouts: createDexieWorkoutsRepository(db),
    templates: createDexieTemplatesRepository(db),
    customExercises: createDexieCustomExercisesRepository(db),
    settings: createDexieSettingsRepository(db),
    dataManagement: createDexieDataManagementRepository(db),
    benchmarks: createDexieBenchmarksRepository(db),
    weight: createDexieWeightRepository(db),
    drafts: createDexieDraftsRepository(db),
    progressions: createDexieProgressionsRepository(db),
    onboarding: createDexieOnboardingRepository(db),
  }
}

