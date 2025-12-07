import { vi } from 'vitest'
import type { RepositoryProvider, SettingDefaults } from '@/db/interfaces'

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
    language: undefined,
  }

  return {
    activeWorkout: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
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
      getByDateRange: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(0),
      startFromCompleted: vi.fn().mockResolvedValue({
        id: 'current',
        name: 'Test Workout',
        blocks: [],
        selectedBlockIndex: 0,
        startedAt: Date.now(),
        lastModifiedAt: Date.now(),
        mode: 'builder',
        activeSetIndex: null,
      }),
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
      createFromCompletedWorkout: vi.fn().mockResolvedValue({
        id: 'template-1',
        name: 'Test Template',
        blocks: [],
        createdAt: Date.now(),
        lastUsedAt: null,
        tags: [],
      }),
      startFromTemplate: vi.fn().mockResolvedValue({
        id: 'current',
        name: 'From Template',
        blocks: [],
        selectedBlockIndex: 0,
        startedAt: Date.now(),
        lastModifiedAt: Date.now(),
        mode: 'builder',
        activeSetIndex: null,
      }),
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
        rounds: 5,
        exercises: [],
        createdAt: Date.now(),
        lastUsedAt: null,
      }),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      updateLastUsed: vi.fn().mockResolvedValue(undefined),
      startFromBenchmark: vi.fn().mockResolvedValue({
        id: 'current',
        name: 'Test Benchmark',
        blocks: [],
        selectedBlockIndex: 0,
        startedAt: Date.now(),
        lastModifiedAt: Date.now(),
        mode: 'builder',
        activeSetIndex: null,
      }),
    },
  }
}
