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
  get<TKey extends UserSettingKey>(key: TKey): Promise<SettingDefaults[TKey]>
  set(setting: DbUserSetting): Promise<void>
  getAll(): Promise<SettingDefaults>
  reset(key: UserSettingKey): Promise<void>
  resetAll(): Promise<void>
}

// ============================================
// Custom Exercises Repository
// ============================================

export type CustomExercisesRepository = {
  getAll(): Promise<ReadonlyArray<DbCustomExercise>>
  getById(id: string): Promise<DbCustomExercise | undefined>
  add(exercise: Readonly<DbCustomExercise>): Promise<void>
  update(
    id: string,
    updates: Partial<Omit<DbCustomExercise, 'id' | 'createdAt'>>,
  ): Promise<void>
  delete(id: string): Promise<void>
  existsByName(name: string): Promise<boolean>
  searchByName(query: string): Promise<ReadonlyArray<DbCustomExercise>>
}

// ============================================
// Active Workout Repository
// ============================================

export type ActiveWorkoutRepository = {
  get(): Promise<DbActiveWorkout | undefined>
  save(workout: Readonly<DbActiveWorkout>): Promise<void>
  clear(): Promise<void>
  exists(): Promise<boolean>
}

// ============================================
// Templates Repository
// ============================================

export type CreateTemplateData = {
  name: string
  blocks: ReadonlyArray<DbTemplateBlock>
  tags?: ReadonlyArray<string>
}

export type TemplatesRepository = {
  getAll(): Promise<ReadonlyArray<DbWorkoutTemplate>>
  getById(id: string): Promise<DbWorkoutTemplate | undefined>
  createFromWorkout(
    workout: Readonly<DbActiveWorkout>,
    templateName: string,
  ): Promise<DbWorkoutTemplate>
  createFromCompletedWorkout(
    workout: Readonly<DbCompletedWorkout>,
    templateName: string,
  ): Promise<DbWorkoutTemplate>
  startFromTemplate(templateId: string): Promise<DbActiveWorkout>
  update(
    id: string,
    updates: Partial<Omit<DbWorkoutTemplate, 'id' | 'createdAt'>>,
  ): Promise<void>
  delete(id: string): Promise<void>
  rename(id: string, newName: string): Promise<void>
  create(data: CreateTemplateData): Promise<DbWorkoutTemplate>
}

// ============================================
// Workouts Repository (Completed Workouts)
// ============================================

export type GetHistoryParams = {
  limit?: number
  offset?: number
}

export type GetByDateRangeParams = {
  startDate: number
  endDate: number
}

export type WorkoutsRepository = {
  completeWorkout(
    activeWorkout: Readonly<DbActiveWorkout>,
    notes?: string,
  ): Promise<DbCompletedWorkout>
  getHistory(params?: GetHistoryParams): Promise<ReadonlyArray<DbCompletedWorkout>>
  getByDateRange(params: GetByDateRangeParams): Promise<ReadonlyArray<DbCompletedWorkout>>
  getById(id: string): Promise<DbCompletedWorkout | undefined>
  delete(id: string): Promise<void>
  count(): Promise<number>
  startFromCompleted(id: string): Promise<DbActiveWorkout>
}

// ============================================
// Data Management Repository (Export/Import)
// ============================================

export type ExportDataContents = {
  settings: ReadonlyArray<DbUserSetting>
  customExercises: ReadonlyArray<DbCustomExercise>
  templates: ReadonlyArray<DbWorkoutTemplate>
  workouts: ReadonlyArray<DbCompletedWorkout>
}

export type DataManagementRepository = {
  exportAll(): Promise<ExportDataContents>
  importAll(data: ExportDataContents): Promise<void>
  deleteAll(): Promise<void>
}

// ============================================
// Repository Provider (All Repositories)
// ============================================

export type RepositoryProvider = {
  activeWorkout: ActiveWorkoutRepository
  workouts: WorkoutsRepository
  templates: TemplatesRepository
  customExercises: CustomExercisesRepository
  settings: SettingsRepository
  dataManagement: DataManagementRepository
}
