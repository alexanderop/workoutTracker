import type {
  DbActiveBenchmarkWorkout,
  DbActiveWorkout,
  DbBenchmark,
  DbCompletedWorkout,
  DbCustomExercise,
  DbTemplateBlock,
  DbUserSetting,
  DbWorkoutTemplate,
  ExerciseSession,
  ExerciseStats,
  PerformedExercise,
  PersonalRecords,
  UserSettingKey,
} from './schema'

// ============================================
// Subscription Types (for reactive queries)
// ============================================

/**
 * Subscription handle returned by subscribe methods.
 * Call unsubscribe() to stop receiving updates.
 */
export type Subscription = {
  unsubscribe: () => void
}

/**
 * Callback function for subscription updates.
 */
export type SubscribeCallback<T> = (data: T) => void

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
  timerSoundVolume: number
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
   * Retrieve timer sound volume setting with fallback to default (0.8).
   */
  get(key: 'timerSoundVolume'): Promise<number>
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
  /**
   * Subscribe to live updates of all settings (merged with defaults).
   * Automatically syncs across browser tabs via IndexedDB events.
   */
  subscribeAll(callback: SubscribeCallback<SettingDefaults>): Subscription
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
  /**
   * Subscribe to live updates of the active workout.
   * Automatically syncs across browser tabs via IndexedDB events.
   */
  subscribe(callback: SubscribeCallback<DbActiveWorkout | undefined>): Subscription
}

// ============================================
// Active Benchmark Workout Repository
// ============================================

export type ActiveBenchmarkWorkoutRepository = {
  /**
   * Retrieve the current active benchmark workout.
   */
  load(): Promise<DbActiveBenchmarkWorkout | undefined>
  /**
   * Save or update the active benchmark workout. Automatically updates lastModifiedAt timestamp.
   */
  save(workout: Readonly<DbActiveBenchmarkWorkout>): Promise<void>
  /**
   * Remove the active benchmark workout from the database.
   */
  delete(): Promise<void>
  /**
   * Check if an active benchmark workout is currently in progress.
   */
  exists(): Promise<boolean>
  /**
   * Complete the benchmark workout and save to history with benchmarkId.
   * Removes the active benchmark from database in a transaction.
   */
  complete(activeBenchmark: Readonly<DbActiveBenchmarkWorkout>): Promise<DbCompletedWorkout>
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
  /**
   * Subscribe to live updates of all templates (sorted by last used).
   * Automatically syncs across browser tabs via IndexedDB events.
   */
  subscribeAll(
    callback: SubscribeCallback<ReadonlyArray<DbWorkoutTemplate>>,
  ): Subscription
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
   * Add a completed workout directly to history. Used for hindsight logging (logging past workouts).
   */
  add(workout: Readonly<DbCompletedWorkout>): Promise<void>
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
  benchmarks: ReadonlyArray<DbBenchmark>
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
// Benchmarks Repository
// ============================================

export type BenchmarksRepository = {
  /**
   * Retrieve all benchmarks sorted by creation date (newest first).
   */
  getAll(): Promise<ReadonlyArray<DbBenchmark>>
  /**
   * Find benchmark by ID.
   */
  getById(id: string): Promise<DbBenchmark | undefined>
  /**
   * Create a new benchmark.
   */
  create(benchmark: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'>): Promise<DbBenchmark>
  /**
   * Update an existing benchmark.
   * @throws Error if benchmark with id not found
   */
  update(
    id: string,
    updates: Partial<Omit<DbBenchmark, 'id' | 'createdAt'>>,
  ): Promise<void>
  /**
   * Delete a benchmark by ID. Silently succeeds if ID doesn't exist.
   */
  delete(id: string): Promise<void>
  /**
   * Update last used timestamp when benchmark is performed.
   */
  updateLastUsed(id: string): Promise<void>
  /**
   * Create an active workout from a benchmark and update last used timestamp.
   * @throws Error if benchmark not found
   */
  startFromBenchmark(benchmarkId: string): Promise<DbActiveWorkout>
  /**
   * Get the personal best (fastest completion time) for a benchmark.
   * Returns the completion time in seconds, or null if no completions exist.
   */
  getPersonalBest(benchmarkId: string): Promise<number | null>
  /**
   * Get personal bests for multiple benchmarks in a single batch query.
   * Returns a Map of benchmark IDs to completion times (in seconds).
   * Benchmarks without completions are omitted from the map.
   */
  getPersonalBests(benchmarkIds: ReadonlyArray<string>): Promise<ReadonlyMap<string, number>>
  /**
   * Get all completed attempts for a benchmark, sorted by date (newest first).
   * Returns empty array if no attempts exist.
   */
  getAttemptHistory(benchmarkId: string): Promise<ReadonlyArray<BenchmarkAttempt>>
}

/**
 * Single attempt record for a benchmark workout.
 */
export type BenchmarkAttempt = {
  id: string // workout ID
  completedAt: number // timestamp (ms)
  completionTime: number // seconds
  isPersonalBest: boolean // true if this is the PB
}

// ============================================
// Exercise Progress Repository
// ============================================

/**
 * Options for filtering exercise history queries.
 */
export type GetExerciseHistoryOptions = {
  limit?: number
  offset?: number
  dateRange?: { from: Date; to: Date }
}

/**
 * Repository for querying exercise progress data from completed workouts.
 * Calculates metrics on-demand from historical workout data.
 */
export type ExerciseProgressRepository = {
  /**
   * Get all workout sessions containing a specific exercise, sorted by date (newest first).
   */
  getExerciseHistory(
    exerciseDefinitionId: string,
    options?: GetExerciseHistoryOptions,
  ): Promise<ReadonlyArray<ExerciseSession>>

  /**
   * Get aggregated statistics for an exercise across all sessions.
   */
  getExerciseStats(exerciseDefinitionId: string): Promise<ExerciseStats>

  /**
   * Get personal records for an exercise (max weight, estimated 1RM, volume PR).
   */
  getPersonalRecords(exerciseDefinitionId: string): Promise<PersonalRecords>

  /**
   * Get all exercises the user has performed, sorted by workout count (most frequent first).
   */
  getPerformedExercises(): Promise<ReadonlyArray<PerformedExercise>>
}

// ============================================
// Repository Provider (All Repositories)
// ============================================

/**
 * Unified interface providing access to all repository instances.
 */
export type RepositoryProvider = {
  activeWorkout: ActiveWorkoutRepository
  activeBenchmark: ActiveBenchmarkWorkoutRepository
  workouts: WorkoutsRepository
  templates: TemplatesRepository
  customExercises: CustomExercisesRepository
  settings: SettingsRepository
  dataManagement: DataManagementRepository
  benchmarks: BenchmarksRepository
}
