/**
 * Node `unit` tier (ADR 004: brain/decisions/004-db-in-di.md). Proves two
 * things with zero Dexie: `src/db/services.ts` is Node-importable on its own
 * (it must never drag in `services.live.ts`, which reaches `@/db`), and the
 * positional layer-order contract `buildAll` relies on is real — a dependent
 * layer resolves only when it is listed after the layer it depends on.
 *
 * The `HabitRepo` -> `Repositories` shape below is exactly what Wave 3 wires
 * for real (`sync(HabitRepo, (ctx) => ctx.unsafeGet(Repositories).habits)`),
 * proven here with an in-line fake `RepositoryProvider` instead of Dexie.
 */
import { describe, expect, it } from 'vitest'
import { empty } from '@/lib/di/context'
import { succeed, sync } from '@/lib/di/layer'
import { makeRuntime } from '@/lib/di/runtime'
import type {
  ActiveBenchmarkWorkoutRepository,
  ActiveWorkoutRepository,
  BenchmarksRepository,
  CustomExercisesRepository,
  DataManagementRepository,
  DraftsRepository,
  ExerciseProgressRepository,
  NutritionRepository,
  OnboardingRepository,
  ProgressionsRepository,
  RepositoryProvider,
  SettingDefaults,
  SettingsRepository,
  TemplatesRepository,
  WeightRepository,
  WorkoutsRepository,
} from '@/db/interfaces'
import type { UserSettingKey } from '@/db/schema'
import { Repositories } from '@/db/services'
import { HabitRepo } from '@/features/habits/services'
import { createFakeHabitRepository } from '@/__tests__/fakes/habitRepository'

// ============================================
// Minimal stand-ins for the non-habits repository slots.
//
// `RepositoryProvider` bundles fifteen repositories; this spec only ever
// reads the `habits` slot back off the fake, but `Repositories` is typed as
// the whole `RepositoryProvider`, so every slot needs a structurally valid
// (never-called) implementation. `src/__tests__/helpers/mockRepositories.ts`
// would normally serve this purpose, but it imports `vi` from vitest and is
// not Node-safe, so it is not usable from this Node `unit` spec.
// ============================================

const defaultSettings: SettingDefaults = {
  theme: 'system',
  defaultRestTimer: 90,
  weightUnit: 'kg',
  heightUnit: 'cm',
  autoSaveInterval: 1000,
  screenWakeLock: true,
  timerSoundEnabled: true,
  timerSoundVolume: 0.8,
  language: undefined,
}

/** Mirrors the overload trick `src/db/implementations/dexie/settings.ts` uses
 *  for `get`, minus the database read -- required because a plain
 *  single-signature function is not assignable to `SettingsRepository['get']`'s
 *  nine key-specific overloads. */
function get(key: 'theme'): Promise<'light' | 'dark' | 'system'>
function get(key: 'defaultRestTimer'): Promise<number>
function get(key: 'weightUnit'): Promise<'kg' | 'lbs'>
function get(key: 'heightUnit'): Promise<'cm' | 'ft-in'>
function get(key: 'autoSaveInterval'): Promise<number>
function get(key: 'screenWakeLock'): Promise<boolean>
function get(key: 'timerSoundEnabled'): Promise<boolean>
function get(key: 'timerSoundVolume'): Promise<number>
function get(key: 'language'): Promise<'en' | 'de' | undefined>
function get(key: UserSettingKey) {
  return Promise.resolve(defaultSettings[key])
}

const settingsRepositoryStub: SettingsRepository = {
  get,
  set: async () => {},
  getAll: async () => defaultSettings,
  observeAll: () => ({ get: async () => [], subscribe: () => () => {} }),
  reset: async () => {},
  resetAll: async () => {},
}

const activeWorkoutRepositoryStub: ActiveWorkoutRepository = {
  get: async () => undefined,
  save: async () => {},
  clear: async () => {},
  exists: async () => false,
  observe: () => ({ get: async () => undefined, subscribe: () => () => {} }),
}

const activeWorkoutStub = {
  id: 'current' as const,
  name: 'stub',
  blocks: [],
  selectedBlockIndex: 0,
  startedAt: 0,
  lastModifiedAt: 0,
  mode: 'builder' as const,
  activeSetIndex: null,
  activeExerciseIndex: null,
  benchmarkId: null,
  globalTimerStartedAt: null,
}

const completedWorkoutStub = {
  id: 'stub-completed',
  name: 'stub',
  blocks: [],
  startedAt: 0,
  completedAt: 0,
  durationSeconds: 0,
  notes: '',
  benchmarkId: null,
}

const activeBenchmarkRepositoryStub: ActiveBenchmarkWorkoutRepository = {
  load: async () => undefined,
  save: async () => {},
  delete: async () => {},
  exists: async () => false,
  complete: async () => completedWorkoutStub,
}

const workoutsRepositoryStub: WorkoutsRepository = {
  completeWorkout: async () => completedWorkoutStub,
  add: async () => {},
  getHistory: async () => [],
  observeHistory: () => ({ get: async () => [], subscribe: () => () => {} }),
  getByDateRange: async () => [],
  getById: async () => undefined,
  delete: async () => {},
  count: async () => 0,
  startFromCompleted: async () => activeWorkoutStub,
}

const templateStub = {
  id: 'stub-template',
  name: 'stub',
  blocks: [],
  createdAt: 0,
  lastUsedAt: null,
  tags: [],
}

const templatesRepositoryStub: TemplatesRepository = {
  getAll: async () => [],
  getById: async () => undefined,
  createFromWorkout: async () => templateStub,
  startFromTemplate: async () => activeWorkoutStub,
  update: async () => {},
  delete: async () => {},
  rename: async () => {},
  create: async () => templateStub,
  observeAll: () => ({ get: async () => [], subscribe: () => () => {} }),
}

const customExercisesRepositoryStub: CustomExercisesRepository = {
  getAll: async () => [],
  getById: async () => undefined,
  add: async () => {},
  update: async () => {},
  delete: async () => {},
  existsByName: async () => false,
  searchByName: async () => [],
}

const dataManagementRepositoryStub: DataManagementRepository = {
  exportAll: async () => ({
    settings: [],
    customExercises: [],
    templates: [],
    workouts: [],
    benchmarks: [],
    weightEntries: [],
    habits: [],
    habitEntries: [],
    nutritionGoals: [],
    foods: [],
    nutritionDiaryEntries: [],
    progressions: [],
    progressionSessions: [],
  }),
  importAll: async () => {},
  deleteAll: async () => {},
}

const benchmarkStub = {
  id: 'stub-benchmark',
  name: 'stub',
  type: 'fortime' as const,
  rounds: [],
  structureHash: '',
  createdAt: 0,
  lastUsedAt: null,
}

const benchmarksRepositoryStub: BenchmarksRepository = {
  getAll: async () => [],
  getById: async () => undefined,
  create: async () => benchmarkStub,
  update: async () => benchmarkStub,
  delete: async () => {},
  updateLastUsed: async () => {},
  startFromBenchmark: async () => activeWorkoutStub,
  getPersonalBest: async () => null,
  getPersonalBests: async () => new Map(),
  getAttemptHistory: async () => [],
  hasResults: async () => false,
}

const exerciseProgressRepositoryStub: ExerciseProgressRepository = {
  getExerciseHistory: async () => [],
  getExerciseStats: async () => ({
    exerciseDefinitionId: 'stub',
    exerciseName: 'stub',
    totalSessions: 0,
    lastPerformed: null,
    firstPerformed: null,
    avgVolumePerSession: 0,
    avgFrequencyDays: null,
  }),
  getPersonalRecords: async () => ({
    maxWeight: null,
    estimated1RM: null,
    maxVolume: null,
    maxRepsAtWeight: new Map(),
  }),
  getPerformedExercises: async () => [],
}

const weightRepositoryStub: WeightRepository = {
  add: async () => {},
  getAll: async () => [],
  observeEntries: () => ({ get: async () => [], subscribe: () => () => {} }),
  getByDateRange: async () => [],
  getLatest: async () => undefined,
  getByDate: async () => undefined,
  delete: async () => {},
}

const draftsRepositoryStub: DraftsRepository = {
  get: async () => undefined,
  save: async () => {},
  delete: async () => {},
}

const progressionStub = {
  id: 'stub-progression',
  name: 'stub',
  availableWeights: [],
  currentWeightIndex: 0,
  currentReps: 10,
  currentMinutes: 10,
  startReps: 10,
  maxReps: 20,
  repIncrement: 2,
  startMinutes: 10,
  maxMinutes: 20,
  minuteIncrement: 2,
  sessionsCompleted: 0,
  isComplete: false,
  createdAt: 0,
  lastSessionAt: null,
}

const progressionsRepositoryStub: ProgressionsRepository = {
  getAll: async () => [],
  getById: async () => undefined,
  create: async () => progressionStub,
  update: async () => {},
  delete: async () => {},
  recordSession: async () => ({
    id: 'stub-session',
    progressionId: progressionStub.id,
    weight: 0,
    reps: 0,
    minutes: 0,
    completed: false,
    completedAt: 0,
  }),
  getSessionHistory: async () => [],
}

const onboardingRepositoryStub: OnboardingRepository = {
  get: async () => ({ completed: false, currentStep: 0 }),
  save: async () => {},
  markComplete: async () => {},
}

const nutritionRepositoryStub: NutritionRepository = {
  observeDay: () => ({
    get: async () => ({ goal: undefined, foods: [], diaryEntries: [] }),
    subscribe: () => () => {},
  }),
  observeRange: () => ({ get: async () => [], subscribe: () => () => {} }),
  saveGoal: async () => {},
  addFood: async () => {},
  addFoodAndDiaryEntry: async () => {},
  updateFood: async () => {},
  addDiaryEntry: async () => {},
  deleteDiaryEntry: async () => {},
}

/** A fresh fake `RepositoryProvider` per call, so tests never share the
 *  in-memory `habits` fake's mutable state. */
function createFakeRepositoryProvider(): RepositoryProvider {
  return {
    activeWorkout: activeWorkoutRepositoryStub,
    activeBenchmark: activeBenchmarkRepositoryStub,
    workouts: workoutsRepositoryStub,
    templates: templatesRepositoryStub,
    customExercises: customExercisesRepositoryStub,
    settings: settingsRepositoryStub,
    dataManagement: dataManagementRepositoryStub,
    benchmarks: benchmarksRepositoryStub,
    exerciseProgress: exerciseProgressRepositoryStub,
    weight: weightRepositoryStub,
    drafts: draftsRepositoryStub,
    progressions: progressionsRepositoryStub,
    onboarding: onboardingRepositoryStub,
    habits: createFakeHabitRepository(),
    nutrition: nutritionRepositoryStub,
  }
}

describe('Repositories', () => {
  it('round-trips a provided RepositoryProvider through a context', () => {
    const fake = createFakeRepositoryProvider()
    const context = empty().add(Repositories, fake)

    expect(context.get(Repositories)).toBe(fake)
  })
})

describe('layer order for a dependent service (the Repositories -> HabitRepo shape)', () => {
  it('resolves the dependent layer when it is positioned after its dependency', () => {
    const fake = createFakeRepositoryProvider()
    const runtime = makeRuntime([
      succeed(Repositories, fake),
      sync(HabitRepo, (ctx) => ctx.unsafeGet(Repositories).habits),
    ])

    expect(runtime.get(HabitRepo)).toBe(fake.habits)
  })

  it('throws Service not found when the dependent layer is positioned before its dependency', () => {
    const fake = createFakeRepositoryProvider()

    expect(() =>
      makeRuntime([
        sync(HabitRepo, (ctx) => ctx.unsafeGet(Repositories).habits),
        succeed(Repositories, fake),
      ]),
    ).toThrow('Service not found: Repositories')
  })
})
