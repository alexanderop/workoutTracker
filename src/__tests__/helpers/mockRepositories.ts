import { vi } from 'vitest'
import type { RepositoryProvider, SettingDefaults } from '@/db/interfaces'
import type { DbActiveWorkout } from '@/db/schema'

/**
 * Create a mock DbActiveWorkout with sensible defaults.
 * Ensures type safety by enforcing the complete DbActiveWorkout shape.
 */
function createMockActiveWorkout(overrides?: Partial<DbActiveWorkout>): DbActiveWorkout {
  return {
    id: 'current',
    name: 'Test Workout',
    blocks: [],
    selectedBlockIndex: 0,
    startedAt: Date.now(),
    lastModifiedAt: Date.now(),
    mode: 'builder',
    activeSetIndex: null,
    activeExerciseIndex: null,
    benchmarkId: null,
    globalTimerStartedAt: null,
    ...overrides,
  }
}

/**
 * Create a mock repository provider for unit tests.
 * All methods return resolved promises with sensible defaults.
 */
export function createMockRepositoryProvider(): RepositoryProvider {
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

  return {
    activeWorkout: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
    },
    activeBenchmark: {
      load: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
      complete: vi.fn().mockResolvedValue({
        id: 'completed-1',
        name: 'Test Benchmark',
        blocks: [],
        startedAt: Date.now(),
        completedAt: Date.now(),
        durationSeconds: 180,
        notes: '',
        benchmarkId: 'benchmark-1',
      }),
    },
    workouts: {
      completeWorkout: vi.fn().mockResolvedValue({
        id: 'completed-1',
        name: 'Test Workout',
        blocks: [],
        startedAt: Date.now(),
        completedAt: Date.now(),
        durationSeconds: 3600,
        notes: '',
      }),
      getHistory: vi.fn().mockResolvedValue([]),
      observeHistory: vi.fn(() => ({ get: vi.fn(), subscribe: vi.fn(() => vi.fn()) })),
      getByDateRange: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(0),
      startFromCompleted: vi
        .fn()
        .mockResolvedValue(createMockActiveWorkout({ name: 'Test Workout' })),
      add: vi.fn().mockResolvedValue(undefined),
    },
    templates: {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      createFromWorkout: vi.fn().mockResolvedValue({
        id: 'template-1',
        name: 'Test Template',
        blocks: [],
        createdAt: Date.now(),
        lastUsedAt: null,
        tags: [],
      }),
      startFromTemplate: vi
        .fn()
        .mockResolvedValue(createMockActiveWorkout({ name: 'From Template' })),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      rename: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue({
        id: 'template-1',
        name: 'New Template',
        blocks: [],
        createdAt: Date.now(),
        lastUsedAt: null,
        tags: [],
      }),
    },
    customExercises: {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      existsByName: vi.fn().mockResolvedValue(false),
      searchByName: vi.fn().mockResolvedValue([]),
    },
    settings: {
      get: vi.fn().mockImplementation((key: keyof SettingDefaults) => {
        return Promise.resolve(defaultSettings[key])
      }),
      set: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn().mockResolvedValue(defaultSettings),
      reset: vi.fn().mockResolvedValue(undefined),
      resetAll: vi.fn().mockResolvedValue(undefined),
    },
    dataManagement: {
      exportAll: vi.fn().mockResolvedValue({
        settings: [],
        customExercises: [],
        templates: [],
        workouts: [],
        benchmarks: [],
      }),
      importAll: vi.fn().mockResolvedValue(undefined),
      deleteAll: vi.fn().mockResolvedValue(undefined),
    },
    benchmarks: {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue({
        id: 'benchmark-1',
        name: 'Test Benchmark',
        type: 'fortime',
        rounds: [{ orderKey: 'a0', exercises: [] }],
        structureHash: '',
        createdAt: Date.now(),
        lastUsedAt: null,
      }),
      update: vi.fn().mockResolvedValue({
        id: 'benchmark-1',
        name: 'Test Benchmark',
        type: 'fortime',
        rounds: [{ orderKey: 'a0', exercises: [] }],
        structureHash: '',
        createdAt: Date.now(),
        lastUsedAt: null,
      }),
      delete: vi.fn().mockResolvedValue(undefined),
      updateLastUsed: vi.fn().mockResolvedValue(undefined),
      startFromBenchmark: vi.fn().mockResolvedValue(
        createMockActiveWorkout({
          name: 'Test Benchmark',
          benchmarkId: 'benchmark-1',
        }),
      ),
      getPersonalBest: vi.fn().mockResolvedValue(null),
      getPersonalBests: vi.fn().mockResolvedValue(new Map()),
      getAttemptHistory: vi.fn().mockResolvedValue([]),
      hasResults: vi.fn().mockResolvedValue(false),
    },
    exerciseProgress: {
      getExerciseHistory: vi.fn().mockResolvedValue([]),
      getExerciseStats: vi.fn().mockResolvedValue({
        exerciseDefinitionId: 'exercise-1',
        exerciseName: 'Test Exercise',
        totalSessions: 0,
        lastPerformed: null,
        firstPerformed: null,
        avgVolumePerSession: 0,
        avgFrequencyDays: null,
      }),
      getPersonalRecords: vi.fn().mockResolvedValue({
        maxWeight: null,
        estimated1RM: null,
        maxVolume: null,
        maxRepsAtWeight: new Map(),
      }),
      getPerformedExercises: vi.fn().mockResolvedValue([]),
    },
    weight: {
      add: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn().mockResolvedValue([]),
      getByDateRange: vi.fn().mockResolvedValue([]),
      getLatest: vi.fn().mockResolvedValue(undefined),
      getByDate: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    drafts: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    progressions: {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue({
        id: 'progression-1',
        name: 'Test Progression',
        availableWeights: [16, 20, 24],
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
        createdAt: Date.now(),
        lastSessionAt: null,
      }),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      recordSession: vi.fn().mockResolvedValue({
        id: 'session-1',
        progressionId: 'progression-1',
        weight: 16,
        reps: 10,
        minutes: 10,
        completed: true,
        completedAt: Date.now(),
      }),
      getSessionHistory: vi.fn().mockResolvedValue([]),
    },
    onboarding: {
      get: vi.fn().mockResolvedValue({ completed: false, currentStep: 0 }),
      save: vi.fn().mockResolvedValue(undefined),
      markComplete: vi.fn().mockResolvedValue(undefined),
    },
  }
}
