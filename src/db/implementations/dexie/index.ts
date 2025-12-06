import type { RepositoryProvider } from '@/db/interfaces'
import { db } from './database'
import { createDexieActiveWorkoutRepository } from './activeWorkout'
import { createDexieCustomExercisesRepository } from './customExercises'
import { createDexieDataManagementRepository } from './dataManagement'
import { createDexieSettingsRepository } from './settings'
import { createDexieTemplatesRepository } from './templates'
import { createDexieWorkoutsRepository } from './workouts'

export function createDexieRepositoryProvider(): RepositoryProvider {
  return {
    activeWorkout: createDexieActiveWorkoutRepository(db),
    workouts: createDexieWorkoutsRepository(db),
    templates: createDexieTemplatesRepository(db),
    customExercises: createDexieCustomExercisesRepository(db),
    settings: createDexieSettingsRepository(db),
    dataManagement: createDexieDataManagementRepository(db),
  }
}

