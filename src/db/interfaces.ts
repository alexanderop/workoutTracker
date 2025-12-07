import type {
  DbActiveWorkout,
  DbCompletedWorkout,
  DbCustomExercise,
  DbTemplateBlock,
  DbUserSetting,
  DbWorkoutTemplate,
  UserSettingKey,
} from './schema'

// ============================================
// Settings Repository
// ============================================

/**
 * Default values for user settings.
 */
export type SettingDefaults = {
  theme: 'light' | 'dark' | 'system'
  defaultRestTimer: number
  weightUnit: 'kg' | 'lbs'
  heightUnit: 'cm' | 'ft-in'
  autoSaveInterval: number
  screenWakeLock: boolean
  timerSoundEnabled: boolean
  language: 'en' | 'de' | undefined
}

export type SettingsRepository = {
  /**
   * Retrieve theme setting with fallback to default (system).
   */
  get(key: 'theme'): Promise<'light' | 'dark' | 'system'>
  /**
   * Retrieve default rest timer setting in seconds with fallback to default (90).
   */
  get(key: 'defaultRestTimer'): Promise<number>
  /**
   * Retrieve weight unit setting with fallback to default (kg).
   */
  get(key: 'weightUnit'): Promise<'kg' | 'lbs'>
  /**
   * Retrieve height unit setting with fallback to default (cm).
   */
  get(key: 'heightUnit'): Promise<'cm' | 'ft-in'>
  /**
   * Retrieve auto-save interval setting in milliseconds with fallback to default (1000).
   */
  get(key: 'autoSaveInterval'): Promise<number>
  /**
   * Retrieve screen wake lock setting with fallback to default (true).
   */
  get(key: 'screenWakeLock'): Promise<boolean>
  /**
   * Retrieve timer sound setting with fallback to default (true).
   */
  get(key: 'timerSoundEnabled'): Promise<boolean>
  /**
   * Retrieve language setting with fallback to default (undefined).
   */
  get(key: 'language'): Promise<'en' | 'de' | undefined>
  /**
   * Save or update a user setting in the database.
   */
  set(setting: DbUserSetting): Promise<void>
  /**
   * Retrieve all settings merged with defaults for missing keys.
   */
  getAll(): Promise<SettingDefaults>
  /**
   * Reset a single setting to its default value by removing from database.
   */
  reset(key: UserSettingKey): Promise<void>
  /**
   * Reset all settings to their defaults by clearing the database.
   */
  resetAll(): Promise<void>
}

// ============================================
// Custom Exercises Repository
// ============================================

export type CustomExercisesRepository = {
  /**
   * Retrieve all custom exercises sorted by creation date (newest first).
   */
  getAll(): Promise<ReadonlyArray<DbCustomExercise>>
  /**
   * Find custom exercise by ID.
   */
  getById(id: string): Promise<DbCustomExercise | undefined>
  /**
   * Add a new custom exercise to the database.
   */
  add(exercise: Readonly<DbCustomExercise>): Promise<void>
  /**
   * Update an existing custom exercise. Automatically sets updatedAt timestamp.
   * @throws Error if exercise with id not found
   */
  update(
    id: string,
    updates: Partial<Omit<DbCustomExercise, 'id' | 'createdAt'>>,
  ): Promise<void>
  /**
   * Delete a custom exercise by ID. Silently succeeds if ID doesn't exist.
   */
  delete(id: string): Promise<void>
  /**
   * Check if an exercise with the given name exists (case-insensitive).
   */
  existsByName(name: string): Promise<boolean>
  /**
   * Search custom exercises by name using case-insensitive substring matching.
   */
  searchByName(query: string): Promise<ReadonlyArray<DbCustomExercise>>
}

// ============================================
// Active Workout Repository
// ============================================

export type ActiveWorkoutRepository = {
  /**
   * Retrieve the current active workout.
   */
  get(): Promise<DbActiveWorkout | undefined>
  /**
   * Save or update the active workout. Automatically updates lastModifiedAt timestamp.
   */
  save(workout: Readonly<DbActiveWorkout>): Promise<void>
  /**
   * Remove the active workout from the database.
   */
  clear(): Promise<void>
  /**
   * Check if an active workout is currently in progress.
   */
  exists(): Promise<boolean>
}

// ============================================
// Templates Repository
// ============================================

/**
 * Data structure for creating a new workout template.
 */
export type CreateTemplateData = {
  name: string
  blocks: ReadonlyArray<DbTemplateBlock>
  tags?: ReadonlyArray<string>
}

export type TemplatesRepository = {
  /**
   * Retrieve all workout templates sorted by last used date (most recent first, never-used last).
   */
  getAll(): Promise<ReadonlyArray<DbWorkoutTemplate>>
  /**
   * Find workout template by ID.
   */
  getById(id: string): Promise<DbWorkoutTemplate | undefined>
  /**
   * Create a new template from an active workout by extracting block structure.
   */
  createFromWorkout(
    workout: Readonly<DbActiveWorkout>,
    templateName: string,
  ): Promise<DbWorkoutTemplate>
  /**
   * Create a new template from a completed workout by extracting block structure.
   */
  createFromCompletedWorkout(
    workout: Readonly<DbCompletedWorkout>,
    templateName: string,
  ): Promise<DbWorkoutTemplate>
  /**
   * Create a new active workout from a template. Updates template's last used timestamp.
   * @throws Error if template not found
   */
  startFromTemplate(templateId: string): Promise<DbActiveWorkout>
  /**
   * Update an existing template's properties.
   * @throws Error if template with id not found
   */
  update(
    id: string,
    updates: Partial<Omit<DbWorkoutTemplate, 'id' | 'createdAt'>>,
  ): Promise<void>
  /**
   * Delete a workout template by ID. Silently succeeds if ID doesn't exist.
   */
  delete(id: string): Promise<void>
  /**
   * Rename an existing template.
   * @throws Error if template with id not found
   */
  rename(id: string, newName: string): Promise<void>
  /**
   * Create a new workout template from structured data.
   */
  create(data: CreateTemplateData): Promise<DbWorkoutTemplate>
}

// ============================================
// Workouts Repository (Completed Workouts)
// ============================================

/**
 * Pagination parameters for workout history queries.
 */
export type GetHistoryParams = {
  limit?: number
  offset?: number
}

/**
 * Date range filter for querying completed workouts. Timestamps are in milliseconds.
 */
export type GetByDateRangeParams = {
  startDate: number
  endDate: number
}

export type WorkoutsRepository = {
  /**
   * Mark an active workout as completed and save to history. Removes active workout from database in a transaction.
   */
  completeWorkout(
    activeWorkout: Readonly<DbActiveWorkout>,
    notes?: string,
  ): Promise<DbCompletedWorkout>
  /**
   * Retrieve completed workouts sorted by completion date (most recent first). Defaults to limit=50, offset=0.
   */
  getHistory(params?: GetHistoryParams): Promise<ReadonlyArray<DbCompletedWorkout>>
  /**
   * Retrieve completed workouts within a specific date range (inclusive).
   */
  getByDateRange(params: GetByDateRangeParams): Promise<ReadonlyArray<DbCompletedWorkout>>
  /**
   * Find completed workout by ID.
   */
  getById(id: string): Promise<DbCompletedWorkout | undefined>
  /**
   * Delete a completed workout by ID. Silently succeeds if ID doesn't exist.
   */
  delete(id: string): Promise<void>
  /**
   * Count total number of completed workouts.
   */
  count(): Promise<number>
  /**
   * Create a new active workout by copying a completed workout. Resets set statuses and timed block results.
   * @throws Error if workout with id not found
   */
  startFromCompleted(id: string): Promise<DbActiveWorkout>
}

// ============================================
// Data Management Repository (Export/Import)
// ============================================

/**
 * Complete user data export format containing all database tables.
 */
export type ExportDataContents = {
  settings: ReadonlyArray<DbUserSetting>
  customExercises: ReadonlyArray<DbCustomExercise>
  templates: ReadonlyArray<DbWorkoutTemplate>
  workouts: ReadonlyArray<DbCompletedWorkout>
}

export type DataManagementRepository = {
  /**
   * Export all user data (settings, exercises, templates, workouts) for backup.
   */
  exportAll(): Promise<ExportDataContents>
  /**
   * Import user data from backup. Clears all existing data and replaces with imported data in a transaction.
   */
  importAll(data: ExportDataContents): Promise<void>
  /**
   * Permanently delete all user data including active workout. This action cannot be undone.
   */
  deleteAll(): Promise<void>
}

// ============================================
// Repository Provider (All Repositories)
// ============================================

/**
 * Unified interface providing access to all repository instances.
 */
export type RepositoryProvider = {
  activeWorkout: ActiveWorkoutRepository
  workouts: WorkoutsRepository
  templates: TemplatesRepository
  customExercises: CustomExercisesRepository
  settings: SettingsRepository
  dataManagement: DataManagementRepository
}
