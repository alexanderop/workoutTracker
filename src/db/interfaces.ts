import type {
  DbActiveBenchmarkWorkout as DatabaseActiveBenchmarkWorkout,
  DbActiveWorkout as DatabaseActiveWorkout,
  DbBenchmark as DatabaseBenchmark,
  DbCompletedWorkout as DatabaseCompletedWorkout,
  DbCustomExercise as DatabaseCustomExercise,
  DbFormDraft as DatabaseFormDraft,
  DbProgression as DatabaseProgression,
  DbProgressionSession as DatabaseProgressionSession,
  DbTemplateBlock as DatabaseTemplateBlock,
  DbUserSetting as DatabaseUserSetting,
  DbWeightEntry as DatabaseWeightEntry,
  DbWorkoutTemplate as DatabaseWorkoutTemplate,
  DraftKey,
  ExerciseSession,
  ExerciseStats,
  PerformedExercise,
  PersonalRecords,
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
  set(setting: DatabaseUserSetting): Promise<void>
  /**
   * Retrieve all settings merged with defaults for missing keys.
   */
  getAll(): Promise<SettingDefaults>
  /**
   * Reactive read of all stored user settings (raw rows, no defaults applied).
   * Fires again whenever the underlying data changes, including from other tabs.
   */
  observeAll(): LiveQuery<ReadonlyArray<DatabaseUserSetting>>
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
  getAll(): Promise<ReadonlyArray<DatabaseCustomExercise>>
  /**
   * Find custom exercise by ID.
   */
  getById(id: string): Promise<DatabaseCustomExercise | undefined>
  /**
   * Add a new custom exercise to the database.
   */
  add(exercise: Readonly<DatabaseCustomExercise>): Promise<void>
  /**
   * Update an existing custom exercise. Automatically sets updatedAt timestamp.
   * @throws Error if exercise with id not found
   */
  update(
    id: string,
    updates: Partial<Omit<DatabaseCustomExercise, 'id' | 'createdAt'>>,
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
  searchByName(query: string): Promise<ReadonlyArray<DatabaseCustomExercise>>
}

// ============================================
// Active Workout Repository
// ============================================

export type ActiveWorkoutRepository = {
  /**
   * Retrieve the current active workout.
   */
  get(): Promise<DatabaseActiveWorkout | undefined>
  /**
   * Save or update the active workout. Automatically updates lastModifiedAt timestamp.
   */
  save(workout: Readonly<DatabaseActiveWorkout>): Promise<void>
  /**
   * Remove the active workout from the database.
   */
  clear(): Promise<void>
  /**
   * Check if an active workout is currently in progress.
   */
  exists(): Promise<boolean>
  /**
   * A live view of the current active workout (or `undefined` if none exists).
   * `get()` resolves the same snapshot as {@link ActiveWorkoutRepository.get},
   * `subscribe()` fires on every underlying change (including other tabs).
   *
   * The active workout is mutated on nearly every keystroke while a workout is
   * in progress, and the in-memory working copy is the source of truth during
   * that window (see `useWorkoutPersistence`/`createPersistenceCore`, which
   * debounce writes to this repository). Consumers must not blindly apply
   * every emission onto an in-progress working copy -- that would clobber
   * newer local edits with a stale, already-superseded snapshot. This live
   * query is intended for reads that happen outside active editing: the
   * initial load, and detecting an active workout appearing/disappearing in
   * another tab while this tab hasn't started editing it yet.
   */
  observe(): LiveQuery<DatabaseActiveWorkout | undefined>
}

// ============================================
// Active Benchmark Workout Repository
// ============================================

export type ActiveBenchmarkWorkoutRepository = {
  /**
   * Retrieve the current active benchmark workout.
   */
  load(): Promise<DatabaseActiveBenchmarkWorkout | undefined>
  /**
   * Save or update the active benchmark workout. Automatically updates lastModifiedAt timestamp.
   */
  save(workout: Readonly<DatabaseActiveBenchmarkWorkout>): Promise<void>
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
  complete(
    activeBenchmark: Readonly<DatabaseActiveBenchmarkWorkout>,
  ): Promise<DatabaseCompletedWorkout>
}

// ============================================
// Templates Repository
// ============================================

/**
 * Data structure for creating a new workout template.
 */
export type CreateTemplateData = {
  name: string
  blocks: ReadonlyArray<DatabaseTemplateBlock>
  tags?: ReadonlyArray<string>
}

export type TemplatesRepository = {
  /**
   * Retrieve all workout templates sorted by last used date (most recent first, never-used last).
   */
  getAll(): Promise<ReadonlyArray<DatabaseWorkoutTemplate>>
  /**
   * Find workout template by ID.
   */
  getById(id: string): Promise<DatabaseWorkoutTemplate | undefined>
  /**
   * Create a new template from a workout by extracting block structure.
   * Accepts either an active or completed workout.
   */
  createFromWorkout(
    workout: Readonly<DatabaseActiveWorkout | DatabaseCompletedWorkout>,
    templateName: string,
  ): Promise<DatabaseWorkoutTemplate>
  /**
   * Create a new active workout from a template. Updates template's last used timestamp.
   * @throws Error if template not found
   */
  startFromTemplate(templateId: string): Promise<DatabaseActiveWorkout>
  /**
   * Update an existing template's properties.
   * @throws Error if template with id not found
   */
  update(
    id: string,
    updates: Partial<Omit<DatabaseWorkoutTemplate, 'id' | 'createdAt'>>,
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
  create(data: CreateTemplateData): Promise<DatabaseWorkoutTemplate>
  /**
   * Reactive read of all workout templates (same ordering as {@link TemplatesRepository.getAll}).
   * Fires again whenever the underlying data changes, including from other tabs.
   */
  observeAll(): LiveQuery<ReadonlyArray<DatabaseWorkoutTemplate>>
}

// ============================================
// Live Query Reactivity Port
// ============================================

/** A reactive read. `get()` resolves from local storage immediately;
 *  `subscribe()` fires with a fresh snapshot on every change (including
 *  changes from other tabs — and, with a sync backend, other devices). */
export interface LiveQuery<T> {
  get(): Promise<T>
  subscribe(onChange: (value: T) => void): () => void
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
   * @param durationOverrideSeconds - Optional duration override in seconds. If provided, completedAt is back-calculated.
   */
  completeWorkout(
    activeWorkout: Readonly<DatabaseActiveWorkout>,
    notes?: string,
    durationOverrideSeconds?: number,
  ): Promise<DatabaseCompletedWorkout>
  /**
   * Add a completed workout directly to history. Used for hindsight logging (logging past workouts).
   */
  add(workout: Readonly<DatabaseCompletedWorkout>): Promise<void>
  /**
   * Retrieve completed workouts sorted by completion date (most recent first). Defaults to limit=50, offset=0.
   */
  getHistory(parameters?: GetHistoryParams): Promise<ReadonlyArray<DatabaseCompletedWorkout>>
  /**
   * Reactive read of the completed workout history (most recent first). Fires again whenever
   * the underlying data changes, including from other tabs.
   */
  observeHistory(limit?: number): LiveQuery<ReadonlyArray<DatabaseCompletedWorkout>>
  /**
   * Retrieve completed workouts within a specific date range (inclusive).
   */
  getByDateRange(parameters: GetByDateRangeParams): Promise<ReadonlyArray<DatabaseCompletedWorkout>>
  /**
   * Find completed workout by ID.
   */
  getById(id: string): Promise<DatabaseCompletedWorkout | undefined>
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
  startFromCompleted(id: string): Promise<DatabaseActiveWorkout>
}

// ============================================
// Data Management Repository (Export/Import)
// ============================================

/**
 * Complete user data export format containing all database tables.
 */
export type ExportDataContents = {
  settings: ReadonlyArray<DatabaseUserSetting>
  customExercises: ReadonlyArray<DatabaseCustomExercise>
  templates: ReadonlyArray<DatabaseWorkoutTemplate>
  workouts: ReadonlyArray<DatabaseCompletedWorkout>
  benchmarks: ReadonlyArray<DatabaseBenchmark>
  weightEntries: ReadonlyArray<DatabaseWeightEntry>
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
   * @param options.preserveOnboarding - If true, onboarding completion state is preserved (default: true)
   */
  deleteAll(options?: { preserveOnboarding?: boolean }): Promise<void>
}

// ============================================
// Benchmarks Repository
// ============================================

export type BenchmarksRepository = {
  /**
   * Retrieve all benchmarks sorted by creation date (newest first).
   */
  getAll(): Promise<ReadonlyArray<DatabaseBenchmark>>
  /**
   * Find benchmark by ID.
   */
  getById(id: string): Promise<DatabaseBenchmark | undefined>
  /**
   * Create a new benchmark.
   * structureHash is automatically generated from rounds.
   */
  create(
    benchmark: Omit<DatabaseBenchmark, 'id' | 'createdAt' | 'lastUsedAt' | 'structureHash'>,
  ): Promise<DatabaseBenchmark>
  /**
   * Update an existing benchmark.
   * structureHash is automatically recalculated if rounds change.
   * @throws Error if benchmark with id not found
   */
  update(
    id: string,
    updates: Partial<Omit<DatabaseBenchmark, 'id' | 'createdAt'>>,
  ): Promise<DatabaseBenchmark>
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
  startFromBenchmark(benchmarkId: string): Promise<DatabaseActiveWorkout>
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
  /**
   * Check if a benchmark has any completed workout results.
   * Used to determine if structure change warning should be shown.
   */
  hasResults(benchmarkId: string): Promise<boolean>
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
// Weight Repository
// ============================================

/**
 * Repository for tracking daily body weight entries.
 */
export type WeightRepository = {
  /**
   * Add a new weight entry. If an entry for the same date exists, it will be replaced.
   */
  add(entry: Readonly<DatabaseWeightEntry>): Promise<void>

  /**
   * Retrieve all weight entries sorted by date (newest first).
   */
  getAll(): Promise<ReadonlyArray<DatabaseWeightEntry>>

  /**
   * Reactive read of all weight entries (same ordering as {@link WeightRepository.getAll}).
   * Fires again whenever the underlying data changes, including from other tabs.
   */
  observeEntries(): LiveQuery<ReadonlyArray<DatabaseWeightEntry>>

  /**
   * Get weight entries within a specific date range (inclusive).
   */
  getByDateRange(startDate: Date, endDate: Date): Promise<ReadonlyArray<DatabaseWeightEntry>>

  /**
   * Get the most recent weight entry.
   */
  getLatest(): Promise<DatabaseWeightEntry | undefined>

  /**
   * Get a weight entry for a specific date.
   */
  getByDate(date: Date): Promise<DatabaseWeightEntry | undefined>

  /**
   * Delete a weight entry by ID.
   */
  delete(id: string): Promise<void>
}

// ============================================
// Drafts Repository
// ============================================

/**
 * Repository for managing form drafts (auto-save during creation flows).
 */
export type DraftsRepository = {
  /**
   * Get a draft by key.
   */
  get(key: DraftKey): Promise<DatabaseFormDraft | undefined>
  /**
   * Save or update a draft.
   */
  save(key: DraftKey, data: unknown): Promise<void>
  /**
   * Delete a draft by key.
   */
  delete(key: DraftKey): Promise<void>
}

// ============================================
// Progressions Repository
// ============================================

/**
 * Data for creating a new progression plan.
 */
export type CreateProgressionData = {
  name: string
  availableWeights: ReadonlyArray<number>
  startingWeightIndex?: number // Defaults to 0
  startReps?: number // Defaults to 10
  maxReps?: number // Defaults to 20
  repIncrement?: number // Defaults to 2
  startMinutes?: number // Defaults to 10
  maxMinutes?: number // Defaults to 20
  minuteIncrement?: number // Defaults to 2
}

/**
 * Repository for kettlebell swing progression plans.
 */
export type ProgressionsRepository = {
  /**
   * Retrieve all progressions sorted by last session date (most recent first).
   */
  getAll(): Promise<ReadonlyArray<DatabaseProgression>>

  /**
   * Find progression by ID.
   */
  getById(id: string): Promise<DatabaseProgression | undefined>

  /**
   * Create a new progression plan.
   */
  create(data: CreateProgressionData): Promise<DatabaseProgression>

  /**
   * Update an existing progression.
   * @throws Error if progression with id not found
   */
  update(id: string, updates: Partial<Omit<DatabaseProgression, 'id' | 'createdAt'>>): Promise<void>

  /**
   * Delete a progression and all its sessions by ID.
   */
  delete(id: string): Promise<void>

  /**
   * Record a completed session and update progression state.
   * When completed is true, nextLevel must be provided to advance the progression.
   */
  recordSession(
    progressionId: string,
    completed: boolean,
    nextLevel?: { reps: number; minutes: number; weightIndex: number; isComplete: boolean },
  ): Promise<DatabaseProgressionSession>

  /**
   * Get all sessions for a progression, sorted by date (newest first).
   */
  getSessionHistory(progressionId: string): Promise<ReadonlyArray<DatabaseProgressionSession>>
}

// ============================================
// Onboarding Repository
// ============================================

/**
 * Repository for managing onboarding state.
 * Uses singleton pattern (always id: 'onboarding').
 */
export type OnboardingRepository = {
  /**
   * Retrieve the current onboarding state.
   * Returns default state if no record exists.
   */
  get(): Promise<{ completed: boolean; currentStep: number }>
  /**
   * Save or update the onboarding state.
   */
  save(data: { completed?: boolean; currentStep?: number }): Promise<void>
  /**
   * Mark onboarding as complete.
   */
  markComplete(): Promise<void>
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
  exerciseProgress: ExerciseProgressRepository
  weight: WeightRepository
  drafts: DraftsRepository
  progressions: ProgressionsRepository
  onboarding: OnboardingRepository
}
