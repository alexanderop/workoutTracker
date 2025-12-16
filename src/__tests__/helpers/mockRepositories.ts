import { vi } from 'vitest'
import type { RepositoryProvider, SettingDefaults } from '@/db/interfaces'
import type { DbActiveWorkout } from '@/db/schema'

/**
 * Create a mock DbActiveWorkout with sensible defaults.
 * Ensures type safety by enforcing the complete DbActiveWorkout shape.
 */
function createMockActiveWorkout(
  overrides?: Partial<DbActiveWorkout>
): DbActiveWorkout {
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
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
      complete: vi.fn().mockResolvedValue({
        id: 'completed-1',
        name: 'Test Benchmark',
        startedAt: Date.now(),
        completedAt: Date.now(),
        durationSeconds: 180,
        notes: '',
        benchmarkId: 'benchmark-1',
        stats: {
          blockCount: 0,
          setCount: 0,
          completedSetCount: 0,
          totalVolume: 0,
          timedBlockCount: 0,
          totalRounds: 0,
        },
      }),
    },
    workouts: {
      completeWorkout: vi.fn().mockResolvedValue({
        id: 'completed-1',
        name: 'Test Workout',
        startedAt: Date.now(),
        completedAt: Date.now(),
        durationSeconds: 3600,
        notes: '',
        benchmarkId: null,
        stats: {
          blockCount: 0,
          setCount: 0,
          completedSetCount: 0,
          totalVolume: 0,
          timedBlockCount: 0,
          totalRounds: 0,
        },
      }),
      getHistory: vi.fn().mockResolvedValue([]),
      getByDateRange: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      getHeaderById: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      bulkDelete: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(0),
      startFromCompleted: vi
        .fn()
        .mockResolvedValue(createMockActiveWorkout({ name: 'Test Workout' })),
      add: vi.fn().mockResolvedValue(undefined),
    },
    templates: {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      getByIdWithBlocks: vi.fn().mockResolvedValue(undefined),
      createFromWorkout: vi.fn().mockResolvedValue({
        id: 'template-1',
        name: 'Test Template',
        createdAt: Date.now(),
        lastUsedAt: null,
        usageCount: 0,
        tags: [],
      }),
      createFromCompletedWorkout: vi.fn().mockResolvedValue({
        id: 'template-1',
        name: 'Test Template',
        createdAt: Date.now(),
        lastUsedAt: null,
        usageCount: 0,
        tags: [],
      }),
      startFromTemplate: vi
        .fn()
        .mockResolvedValue(createMockActiveWorkout({ name: 'From Template' })),
      update: vi.fn().mockResolvedValue(undefined),
      updateWithBlocks: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      rename: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue({
        id: 'template-1',
        name: 'New Template',
        createdAt: Date.now(),
        lastUsedAt: null,
        usageCount: 0,
        tags: [],
      }),
    },
    exercises: {
      getAll: vi.fn().mockResolvedValue([]),
      getCustom: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockResolvedValue(undefined),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      bulkDelete: vi.fn().mockResolvedValue(undefined),
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
        benchmarkAttempts: [],
        benchmarkPersonalBests: [],
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
        rounds: 5,
        timeCapSeconds: null,
        exercises: [],
        createdAt: Date.now(),
        lastUsedAt: null,
      }),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      updateLastUsed: vi.fn().mockResolvedValue(undefined),
      startFromBenchmark: vi.fn().mockResolvedValue(
        createMockActiveWorkout({
          name: 'Test Benchmark',
          benchmarkId: 'benchmark-1',
        })
      ),
      getPersonalBest: vi.fn().mockResolvedValue(null),
      getPersonalBests: vi.fn().mockResolvedValue(new Map()),
      getAttemptHistory: vi.fn().mockResolvedValue([]),
      recordAttempt: vi.fn().mockResolvedValue(undefined),
    },
    // Normalized data repositories (minimal mocks)
    workoutBlocks: {
      getByWorkoutId: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
      deleteByWorkoutId: vi.fn().mockResolvedValue(undefined),
    },
    workoutSets: {
      getByBlockId: vi.fn().mockResolvedValue([]),
      getByBlockIds: vi.fn().mockResolvedValue(new Map()),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
      deleteByBlockId: vi.fn().mockResolvedValue(undefined),
      deleteByBlockIds: vi.fn().mockResolvedValue(undefined),
    },
    blockExercises: {
      getByBlockId: vi.fn().mockResolvedValue([]),
      getByBlockIds: vi.fn().mockResolvedValue(new Map()),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
      deleteByBlockId: vi.fn().mockResolvedValue(undefined),
      deleteByBlockIds: vi.fn().mockResolvedValue(undefined),
    },
    templateBlocks: {
      getByTemplateId: vi.fn().mockResolvedValue([]),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
      deleteByTemplateId: vi.fn().mockResolvedValue(undefined),
    },
    templateBlockExercises: {
      getByBlockIds: vi.fn().mockResolvedValue(new Map()),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
      deleteByBlockIds: vi.fn().mockResolvedValue(undefined),
    },
    benchmarkAttempts: {
      getByBenchmarkId: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue(undefined),
      deleteByBenchmarkId: vi.fn().mockResolvedValue(undefined),
      deleteByWorkoutId: vi.fn().mockResolvedValue(undefined),
    },
    benchmarkPersonalBests: {
      get: vi.fn().mockResolvedValue(undefined),
      getMany: vi.fn().mockResolvedValue(new Map()),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  }
}
