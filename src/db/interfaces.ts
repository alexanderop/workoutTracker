import type {
  DbActiveBenchmarkWorkout,
  DbActiveWorkout,
  DbBenchmark,
  DbBenchmarkAttempt,
  DbBenchmarkPersonalBest,
  DbCompletedWorkout,
  DbExercise,
  DbNormalizedBlock,
  DbNormalizedBlockExercise,
  DbNormalizedSet,
  DbNormalizedTemplateBlock,
  DbNormalizedTemplateBlockExercise,
  DbTemplateBlock,
  DbTemplateHeader,
  DbUserSetting,
  DbWorkoutBlock,
  DbWorkoutHeader,
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
  get(key: 'theme'): Promise<'light' | 'dark' | 'system'>
  get(key: 'defaultRestTimer'): Promise<number>
  get(key: 'weightUnit'): Promise<'kg' | 'lbs'>
  get(key: 'heightUnit'): Promise<'cm' | 'ft-in'>
  get(key: 'autoSaveInterval'): Promise<number>
  get(key: 'screenWakeLock'): Promise<boolean>
  get(key: 'timerSoundEnabled'): Promise<boolean>
  get(key: 'timerSoundVolume'): Promise<number>
  get(key: 'language'): Promise<'en' | 'de' | undefined>
  set(setting: DbUserSetting): Promise<void>
  getAll(): Promise<SettingDefaults>
  reset(key: UserSettingKey): Promise<void>
  resetAll(): Promise<void>
}

// ============================================
// Exercises Repository (renamed from CustomExercises)
// ============================================

export type ExercisesRepository = {
  /**
   * Retrieve all exercises sorted by creation date (newest first).
   */
  getAll(): Promise<ReadonlyArray<DbExercise>>
  /**
   * Retrieve only custom (user-created) exercises.
   */
  getCustom(): Promise<ReadonlyArray<DbExercise>>
  /**
   * Find exercise by ID.
   */
  getById(id: string): Promise<DbExercise | undefined>
  /**
   * Add a new exercise to the database.
   */
  add(exercise: Readonly<DbExercise>): Promise<void>
  /**
   * Add multiple exercises in a single transaction.
   */
  bulkAdd(exercises: ReadonlyArray<DbExercise>): Promise<void>
  /**
   * Update an existing exercise. Automatically sets updatedAt timestamp.
   * @throws Error if exercise with id not found
   */
  update(
    id: string,
    updates: Partial<Omit<DbExercise, 'id' | 'createdAt'>>,
  ): Promise<void>
  /**
   * Delete an exercise by ID. Silently succeeds if ID doesn't exist.
   */
  delete(id: string): Promise<void>
  /**
   * Delete multiple exercises in a single transaction.
   */
  bulkDelete(ids: ReadonlyArray<string>): Promise<void>
  /**
   * Check if an exercise with the given name exists (case-insensitive).
   */
  existsByName(name: string): Promise<boolean>
  /**
   * Search exercises by name using case-insensitive substring matching.
   */
  searchByName(query: string): Promise<ReadonlyArray<DbExercise>>
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
// Active Benchmark Workout Repository
// (Standardized naming: get/save/clear)
// ============================================

export type ActiveBenchmarkWorkoutRepository = {
  /**
   * Retrieve the current active benchmark workout.
   * (Renamed from load() for consistency with ActiveWorkoutRepository)
   */
  get(): Promise<DbActiveBenchmarkWorkout | undefined>
  /**
   * Save or update the active benchmark workout. Automatically updates lastModifiedAt timestamp.
   */
  save(workout: Readonly<DbActiveBenchmarkWorkout>): Promise<void>
  /**
   * Remove the active benchmark workout from the database.
   * (Renamed from delete() for consistency with ActiveWorkoutRepository)
   */
  clear(): Promise<void>
  /**
   * Check if an active benchmark workout is currently in progress.
   */
  exists(): Promise<boolean>
  /**
   * Complete the benchmark workout and save to history.
   * Also updates benchmark attempts and personal bests tables.
   * Removes the active benchmark from database in a transaction.
   */
  complete(activeBenchmark: Readonly<DbActiveBenchmarkWorkout>): Promise<DbWorkoutHeader>
}

// ============================================
// Workout Blocks Repository (NEW)
// ============================================

export type WorkoutBlocksRepository = {
  /**
   * Get all blocks for a workout, ordered by orderIndex.
   */
  getByWorkoutId(workoutId: string): Promise<ReadonlyArray<DbNormalizedBlock>>
  /**
   * Get a single block by ID.
   */
  getById(id: string): Promise<DbNormalizedBlock | undefined>
  /**
   * Add multiple blocks in a single transaction.
   */
  bulkAdd(blocks: ReadonlyArray<DbNormalizedBlock>): Promise<void>
  /**
   * Delete all blocks for a workout.
   */
  deleteByWorkoutId(workoutId: string): Promise<void>
}

// ============================================
// Workout Sets Repository (NEW)
// ============================================

export type WorkoutSetsRepository = {
  /**
   * Get all sets for a block, ordered by orderIndex.
   */
  getByBlockId(blockId: string): Promise<ReadonlyArray<DbNormalizedSet>>
  /**
   * Get sets for multiple blocks in a single query.
   */
  getByBlockIds(blockIds: ReadonlyArray<string>): Promise<Map<string, ReadonlyArray<DbNormalizedSet>>>
  /**
   * Add multiple sets in a single transaction.
   */
  bulkAdd(sets: ReadonlyArray<DbNormalizedSet>): Promise<void>
  /**
   * Delete all sets for a block.
   */
  deleteByBlockId(blockId: string): Promise<void>
  /**
   * Delete sets for multiple blocks.
   */
  deleteByBlockIds(blockIds: ReadonlyArray<string>): Promise<void>
}

// ============================================
// Block Exercises Repository (NEW)
// ============================================

export type BlockExercisesRepository = {
  /**
   * Get all exercises for a block, ordered by orderIndex.
   */
  getByBlockId(blockId: string): Promise<ReadonlyArray<DbNormalizedBlockExercise>>
  /**
   * Get exercises for multiple blocks in a single query.
   */
  getByBlockIds(
    blockIds: ReadonlyArray<string>,
  ): Promise<Map<string, ReadonlyArray<DbNormalizedBlockExercise>>>
  /**
   * Add multiple block exercises in a single transaction.
   */
  bulkAdd(exercises: ReadonlyArray<DbNormalizedBlockExercise>): Promise<void>
  /**
   * Delete all exercises for a block.
   */
  deleteByBlockId(blockId: string): Promise<void>
  /**
   * Delete exercises for multiple blocks.
   */
  deleteByBlockIds(blockIds: ReadonlyArray<string>): Promise<void>
}

// ============================================
// Templates Repository (Updated for normalized blocks)
// ============================================

/**
 * Full template with blocks hydrated (for editing/starting).
 */
export type TemplateWithBlocks = DbTemplateHeader & {
  blocks: ReadonlyArray<DbNormalizedTemplateBlock>
  blockExercises: Map<string, ReadonlyArray<DbNormalizedTemplateBlockExercise>>
}

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
   * Retrieve all template headers sorted by last used date.
   */
  getAll(): Promise<ReadonlyArray<DbTemplateHeader>>
  /**
   * Find template header by ID.
   */
  getById(id: string): Promise<DbTemplateHeader | undefined>
  /**
   * Get template with all blocks and exercises hydrated.
   */
  getByIdWithBlocks(id: string): Promise<TemplateWithBlocks | undefined>
  /**
   * Create a new template from an active workout by extracting block structure.
   */
  createFromWorkout(
    workout: Readonly<DbActiveWorkout>,
    templateName: string,
  ): Promise<DbTemplateHeader>
  /**
   * Create a new template from a completed workout by extracting block structure.
   */
  createFromCompletedWorkout(
    workoutId: string,
    templateName: string,
  ): Promise<DbTemplateHeader>
  /**
   * Create a new active workout from a template. Updates template's last used timestamp and usage count.
   * @throws Error if template not found
   */
  startFromTemplate(templateId: string): Promise<DbActiveWorkout>
  /**
   * Update an existing template's header properties.
   * @throws Error if template with id not found
   */
  update(id: string, updates: Partial<Omit<DbTemplateHeader, 'id' | 'createdAt'>>): Promise<void>
  /**
   * Update a template's name and blocks (replaces all blocks).
   * @throws Error if template with id not found
   */
  updateWithBlocks(
    id: string,
    name: string,
    blocks: ReadonlyArray<DbTemplateBlock>,
  ): Promise<void>
  /**
   * Delete a template and all its blocks/exercises.
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
  create(data: CreateTemplateData): Promise<DbTemplateHeader>
}

// ============================================
// Template Blocks Repository (NEW)
// ============================================

export type TemplateBlocksRepository = {
  /**
   * Get all blocks for a template, ordered by orderIndex.
   */
  getByTemplateId(templateId: string): Promise<ReadonlyArray<DbNormalizedTemplateBlock>>
  /**
   * Add multiple template blocks in a single transaction.
   */
  bulkAdd(blocks: ReadonlyArray<DbNormalizedTemplateBlock>): Promise<void>
  /**
   * Delete all blocks for a template.
   */
  deleteByTemplateId(templateId: string): Promise<void>
}

// ============================================
// Template Block Exercises Repository (NEW)
// ============================================

export type TemplateBlockExercisesRepository = {
  /**
   * Get exercises for multiple template blocks.
   */
  getByBlockIds(
    blockIds: ReadonlyArray<string>,
  ): Promise<Map<string, ReadonlyArray<DbNormalizedTemplateBlockExercise>>>
  /**
   * Add multiple template block exercises in a single transaction.
   */
  bulkAdd(exercises: ReadonlyArray<DbNormalizedTemplateBlockExercise>): Promise<void>
  /**
   * Delete exercises for a template block.
   */
  deleteByBlockIds(blockIds: ReadonlyArray<string>): Promise<void>
}

// ============================================
// Workouts Repository (Updated for normalized structure)
// ============================================

/**
 * Pagination parameters for workout history queries.
 */
export type GetHistoryParams = {
  limit?: number
  offset?: number
}

/**
 * Date range filter for querying completed workouts.
 */
export type GetByDateRangeParams = {
  startDate: number
  endDate: number
}

/**
 * Full workout with blocks and sets hydrated.
 */
export type WorkoutWithBlocks = DbWorkoutHeader & {
  blocks: ReadonlyArray<DbWorkoutBlock>
}

export type WorkoutsRepository = {
  /**
   * Mark an active workout as completed and save to history.
   * Stores normalized blocks and sets, computes stats.
   * Removes active workout from database in a transaction.
   */
  completeWorkout(activeWorkout: Readonly<DbActiveWorkout>, notes?: string): Promise<DbWorkoutHeader>
  /**
   * Add a completed workout directly to history (for hindsight logging).
   * Accepts embedded blocks and normalizes them during save.
   */
  add(workout: Readonly<DbCompletedWorkout>): Promise<void>
  /**
   * Retrieve workout headers sorted by completion date (most recent first).
   * Does NOT include blocks - use getById for full workout.
   */
  getHistory(params?: GetHistoryParams): Promise<ReadonlyArray<DbWorkoutHeader>>
  /**
   * Retrieve workout headers within a date range.
   */
  getByDateRange(params: GetByDateRangeParams): Promise<ReadonlyArray<DbWorkoutHeader>>
  /**
   * Get workout header by ID.
   */
  getHeaderById(id: string): Promise<DbWorkoutHeader | undefined>
  /**
   * Get full workout with blocks and sets hydrated.
   */
  getById(id: string): Promise<WorkoutWithBlocks | undefined>
  /**
   * Delete a completed workout and all associated blocks/sets.
   */
  delete(id: string): Promise<void>
  /**
   * Delete multiple workouts in a single transaction.
   */
  bulkDelete(ids: ReadonlyArray<string>): Promise<void>
  /**
   * Count total number of completed workouts.
   */
  count(): Promise<number>
  /**
   * Create a new active workout by copying a completed workout.
   * Resets set statuses and timed block results.
   */
  startFromCompleted(id: string): Promise<DbActiveWorkout>
}

// ============================================
// Benchmark Attempts Repository (NEW)
// ============================================

export type BenchmarkAttemptsRepository = {
  /**
   * Get all attempts for a benchmark, sorted by completedAt (newest first).
   */
  getByBenchmarkId(benchmarkId: string): Promise<ReadonlyArray<DbBenchmarkAttempt>>
  /**
   * Add a new attempt.
   */
  add(attempt: Readonly<DbBenchmarkAttempt>): Promise<void>
  /**
   * Delete all attempts for a benchmark.
   */
  deleteByBenchmarkId(benchmarkId: string): Promise<void>
  /**
   * Delete attempts for a specific workout.
   */
  deleteByWorkoutId(workoutId: string): Promise<void>
}

// ============================================
// Benchmark Personal Bests Repository (NEW)
// ============================================

export type BenchmarkPersonalBestsRepository = {
  /**
   * Get personal best for a benchmark. O(1) lookup.
   */
  get(benchmarkId: string): Promise<DbBenchmarkPersonalBest | undefined>
  /**
   * Get personal bests for multiple benchmarks in a single query.
   */
  getMany(benchmarkIds: ReadonlyArray<string>): Promise<Map<string, DbBenchmarkPersonalBest>>
  /**
   * Set or update personal best for a benchmark.
   */
  set(pb: Readonly<DbBenchmarkPersonalBest>): Promise<void>
  /**
   * Delete personal best for a benchmark.
   */
  delete(benchmarkId: string): Promise<void>
}

// ============================================
// Benchmarks Repository
// ============================================

/**
 * Single attempt record for a benchmark workout (returned from getAttemptHistory).
 */
export type BenchmarkAttempt = {
  id: string // attempt ID
  workoutId: string
  completedAt: number // timestamp (ms)
  completionTime: number // seconds
  isPersonalBest: boolean
}

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
  update(id: string, updates: Partial<Omit<DbBenchmark, 'id' | 'createdAt'>>): Promise<void>
  /**
   * Delete a benchmark and all its attempts/personal bests.
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
   * Get the personal best completion time for a benchmark. O(1) lookup.
   */
  getPersonalBest(benchmarkId: string): Promise<DbBenchmarkPersonalBest | null>
  /**
   * Get personal bests for multiple benchmarks. O(n) where n = benchmarkIds.length.
   */
  getPersonalBests(
    benchmarkIds: ReadonlyArray<string>,
  ): Promise<ReadonlyMap<string, DbBenchmarkPersonalBest>>
  /**
   * Get all attempts for a benchmark with isPersonalBest computed.
   */
  getAttemptHistory(benchmarkId: string): Promise<ReadonlyArray<BenchmarkAttempt>>
  /**
   * Record a new benchmark attempt. Updates personal best if applicable.
   */
  recordAttempt(params: {
    benchmarkId: string
    workoutId: string
    completionTimeSeconds: number
  }): Promise<void>
}

// ============================================
// Data Management Repository
// ============================================

/**
 * Complete user data export format (legacy format for backward compatibility).
 */
export type ExportDataContents = {
  settings: ReadonlyArray<DbUserSetting>
  customExercises: ReadonlyArray<DbExercise>
  templates: ReadonlyArray<{
    header: DbTemplateHeader
    blocks: ReadonlyArray<DbNormalizedTemplateBlock>
    blockExercises: ReadonlyArray<DbNormalizedTemplateBlockExercise>
  }>
  workouts: ReadonlyArray<{
    header: DbWorkoutHeader
    blocks: ReadonlyArray<DbNormalizedBlock>
    sets: ReadonlyArray<DbNormalizedSet>
    blockExercises: ReadonlyArray<DbNormalizedBlockExercise>
  }>
  benchmarks: ReadonlyArray<DbBenchmark>
  benchmarkAttempts: ReadonlyArray<DbBenchmarkAttempt>
  benchmarkPersonalBests: ReadonlyArray<DbBenchmarkPersonalBest>
}

export type DataManagementRepository = {
  /**
   * Export all user data for backup.
   */
  exportAll(): Promise<ExportDataContents>
  /**
   * Import user data from backup. Clears all existing data and replaces with imported data in a transaction.
   */
  importAll(data: ExportDataContents): Promise<void>
  /**
   * Permanently delete all user data including active workouts.
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
  // Singletons
  activeWorkout: ActiveWorkoutRepository
  activeBenchmark: ActiveBenchmarkWorkoutRepository
  settings: SettingsRepository

  // Core entities
  exercises: ExercisesRepository
  benchmarks: BenchmarksRepository
  templates: TemplatesRepository
  workouts: WorkoutsRepository

  // Normalized data (internal use)
  workoutBlocks: WorkoutBlocksRepository
  workoutSets: WorkoutSetsRepository
  blockExercises: BlockExercisesRepository
  templateBlocks: TemplateBlocksRepository
  templateBlockExercises: TemplateBlockExercisesRepository
  benchmarkAttempts: BenchmarkAttemptsRepository
  benchmarkPersonalBests: BenchmarkPersonalBestsRepository

  // Data management
  dataManagement: DataManagementRepository
}

// ============================================
// Legacy type aliases (for backward compatibility)
// ============================================

/**
 * @deprecated Use ExercisesRepository instead
 */
export type CustomExercisesRepository = ExercisesRepository
