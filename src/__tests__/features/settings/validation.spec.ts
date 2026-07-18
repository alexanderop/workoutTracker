import { describe, expect, it } from 'vitest'

import {
  dbCompletedWorkoutSchema,
  dbCustomExerciseSchema,
  dbHabitEntrySchema,
  dbHabitSchema,
  dbUserSettingSchema,
  dbWorkoutBlockSchema,
  dbWorkoutTemplateSchema,
  exportDataSchema,
} from '@/features/settings/utils/validation'
import { createDbTemplateCardioBlock as createDatabaseTemplateCardioBlock } from '@/__tests__/factories'

/**
 * Creates a valid export data structure for testing.
 */
function createValidExportData(
  overrides: {
    settings?: Array<unknown>
    customExercises?: Array<unknown>
    templates?: Array<unknown>
    workouts?: Array<unknown>
    benchmarks?: Array<unknown>
  } = {},
) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      settings: overrides.settings ?? [],
      customExercises: overrides.customExercises ?? [],
      templates: overrides.templates ?? [],
      workouts: overrides.workouts ?? [],
      benchmarks: overrides.benchmarks ?? [],
    },
  }
}

/**
 * Creates a valid custom exercise for testing.
 */
function createValidExercise(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exercise-1',
    name: 'Squat',
    equipment: 'barbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    image: null,
    ...overrides,
  }
}

/**
 * Creates a valid strength block for testing.
 */
function createValidStrengthBlock(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'strength',
    id: 'block-1',
    exerciseDefinitionId: 'exercise-1',
    name: 'Squat',
    equipment: 'barbell',
    targetReps: 8,
    targetDuration: null,
    targetWeight: null,
    image: null,
    sets: [
      {
        id: 'set-1',
        kg: '100',
        reps: '8',
        duration: '',
        rir: '2',
        status: 'completed',
        completedAt: Date.now(),
      },
    ],
    orderIndex: 0,
    ...overrides,
  }
}

/**
 * Creates a valid completed workout for testing.
 */
function createValidWorkout(overrides: Record<string, unknown> = {}) {
  return {
    id: 'workout-1',
    name: 'Morning Workout',
    blocks: [createValidStrengthBlock()],
    startedAt: Date.now() - 3_600_000,
    completedAt: Date.now(),
    durationSeconds: 3600,
    notes: '',
    benchmarkId: null,
    ...overrides,
  }
}

/**
 * Creates a valid workout template for testing.
 */
function createValidTemplate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'template-1',
    name: 'Push Day',
    blocks: [
      {
        kind: 'strength',
        exerciseDefinitionId: 'exercise-1',
        name: 'Bench Press',
        equipment: 'barbell',
        targetReps: 8,
        targetDuration: null,
        targetWeight: null,
        image: null,
        defaultSetCount: 3,
      },
    ],
    createdAt: Date.now(),
    lastUsedAt: null,
    tags: ['push', 'chest'],
    ...overrides,
  }
}

describe('Export Data Validation', () => {
  describe('exportDataSchema', () => {
    it('accepts valid export data with empty arrays', () => {
      const result = exportDataSchema.safeParse(createValidExportData())
      expect(result.success).toBe(true)
    })

    it('accepts valid export data with populated arrays', () => {
      const exportData = createValidExportData({
        settings: [{ key: 'theme', value: 'dark' }],
        customExercises: [createValidExercise()],
        templates: [createValidTemplate()],
        workouts: [createValidWorkout()],
      })

      const result = exportDataSchema.safeParse(exportData)
      expect(result.success).toBe(true)
    })

    it('accepts a completed benchmark workout whose fortime result includes splitTimes', () => {
      const forTimeBlock = {
        kind: 'fortime',
        id: 'block-1',
        config: { timeCapSeconds: null },
        exercises: [{ id: 'ex-1', name: 'Row', prescribedReps: 1000, load: null, image: null }],
        result: { completionTime: 46, completed: true, splitTimes: [8, 38] },
        orderIndex: 0,
      }
      const exportData = createValidExportData({
        workouts: [createValidWorkout({ blocks: [forTimeBlock] })],
      })

      const result = exportDataSchema.safeParse(exportData)

      expect(result.success).toBe(true)
    })

    it('rejects missing version', () => {
      const invalid = {
        exportedAt: new Date().toISOString(),
        data: { settings: [], customExercises: [], templates: [], workouts: [], benchmarks: [] },
      }
      const result = exportDataSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects invalid exportedAt format', () => {
      const invalid = createValidExportData()
      // Replace with invalid date format
      const withInvalidDate = { ...invalid, exportedAt: 'not-a-date' }
      const result = exportDataSchema.safeParse(withInvalidDate)
      expect(result.success).toBe(false)
    })
  })

  describe('prototype pollution prevention', () => {
    it('rejects __proto__ as exercise ID', () => {
      const malicious = createValidExportData({
        customExercises: [createValidExercise({ id: '__proto__' })],
      })
      const result = exportDataSchema.safeParse(malicious)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('reserved keyword')
      }
    })

    it('rejects constructor as exercise ID', () => {
      const malicious = createValidExportData({
        customExercises: [createValidExercise({ id: 'constructor' })],
      })
      const result = exportDataSchema.safeParse(malicious)
      expect(result.success).toBe(false)
    })

    it('rejects prototype as exercise ID', () => {
      const malicious = createValidExportData({
        customExercises: [createValidExercise({ id: 'prototype' })],
      })
      const result = exportDataSchema.safeParse(malicious)
      expect(result.success).toBe(false)
    })

    it('rejects __proto__ as workout ID', () => {
      const malicious = createValidExportData({
        workouts: [createValidWorkout({ id: '__proto__' })],
      })
      const result = exportDataSchema.safeParse(malicious)
      expect(result.success).toBe(false)
    })

    it('rejects __proto__ as template ID', () => {
      const malicious = createValidExportData({
        templates: [createValidTemplate({ id: '__proto__' })],
      })
      const result = exportDataSchema.safeParse(malicious)
      expect(result.success).toBe(false)
    })
  })

  describe('strict mode (unknown properties)', () => {
    it('rejects extra properties on root object', () => {
      const invalid = {
        ...createValidExportData(),
        maliciousField: 'injected',
      }
      const result = exportDataSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects extra properties on data object', () => {
      const exportData = createValidExportData()
      const invalid = {
        ...exportData,
        data: {
          ...exportData.data,
          extraField: 'malicious',
        },
      }
      const result = exportDataSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects extra properties on custom exercise', () => {
      const malicious = createValidExportData({
        customExercises: [
          {
            ...createValidExercise(),
            maliciousField: 'injected',
          },
        ],
      })
      const result = exportDataSchema.safeParse(malicious)
      expect(result.success).toBe(false)
    })

    it('rejects extra properties on workout', () => {
      const malicious = createValidExportData({
        workouts: [
          {
            ...createValidWorkout(),
            extraField: 'should fail',
          },
        ],
      })
      const result = exportDataSchema.safeParse(malicious)
      expect(result.success).toBe(false)
    })
  })
})

describe('Settings Schema Validation', () => {
  describe('dbUserSettingSchema', () => {
    it('accepts valid theme setting', () => {
      const result = dbUserSettingSchema.safeParse({ key: 'theme', value: 'dark' })
      expect(result.success).toBe(true)
    })

    it('accepts all valid theme values', () => {
      for (const value of ['light', 'dark', 'system']) {
        const result = dbUserSettingSchema.safeParse({ key: 'theme', value })
        expect(result.success).toBe(true)
      }
    })

    it('rejects invalid theme value', () => {
      const result = dbUserSettingSchema.safeParse({ key: 'theme', value: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('accepts valid weight unit setting', () => {
      const result = dbUserSettingSchema.safeParse({ key: 'weightUnit', value: 'kg' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid weight unit', () => {
      const result = dbUserSettingSchema.safeParse({ key: 'weightUnit', value: 'stones' })
      expect(result.success).toBe(false)
    })

    it('accepts valid language setting', () => {
      const result = dbUserSettingSchema.safeParse({ key: 'language', value: 'de' })
      expect(result.success).toBe(true)
    })

    it('rejects unsupported language', () => {
      const result = dbUserSettingSchema.safeParse({ key: 'language', value: 'fr' })
      expect(result.success).toBe(false)
    })

    it('accepts valid defaultRestTimer', () => {
      const result = dbUserSettingSchema.safeParse({ key: 'defaultRestTimer', value: 90 })
      expect(result.success).toBe(true)
    })

    it('rejects defaultRestTimer exceeding max', () => {
      const result = dbUserSettingSchema.safeParse({ key: 'defaultRestTimer', value: 3601 })
      expect(result.success).toBe(false)
    })

    it('accepts all 8 setting types', () => {
      const allSettings = [
        { key: 'theme', value: 'dark' },
        { key: 'defaultRestTimer', value: 90 },
        { key: 'weightUnit', value: 'kg' },
        { key: 'heightUnit', value: 'cm' },
        { key: 'autoSaveInterval', value: 5000 },
        { key: 'screenWakeLock', value: true },
        { key: 'timerSoundEnabled', value: false },
        { key: 'language', value: 'en' },
      ]

      for (const setting of allSettings) {
        const result = dbUserSettingSchema.safeParse(setting)
        expect(result.success, `Setting ${setting.key} should be valid`).toBe(true)
      }
    })

    it('rejects unknown setting key', () => {
      const result = dbUserSettingSchema.safeParse({ key: 'unknownKey', value: 'test' })
      expect(result.success).toBe(false)
    })
  })
})

describe('Exercise Schema Validation', () => {
  describe('dbCustomExerciseSchema', () => {
    it('accepts valid exercise', () => {
      const result = dbCustomExerciseSchema.safeParse(createValidExercise())
      expect(result.success).toBe(true)
    })

    it('accepts valid equipment values', () => {
      const equipment = [
        'barbell',
        'dumbbell',
        'machine',
        'cable',
        'bodyweight',
        'kettlebell',
        'band',
        'ez-bar',
        'hex-bar',
        'club',
      ]

      for (const eq of equipment) {
        const result = dbCustomExerciseSchema.safeParse(createValidExercise({ equipment: eq }))
        expect(result.success, `Equipment ${eq} should be valid`).toBe(true)
      }
    })

    it('rejects invalid equipment', () => {
      const result = dbCustomExerciseSchema.safeParse(
        createValidExercise({ equipment: 'lightsaber' }),
      )
      expect(result.success).toBe(false)
    })

    it('accepts null equipment', () => {
      const result = dbCustomExerciseSchema.safeParse(createValidExercise({ equipment: null }))
      expect(result.success).toBe(true)
    })

    it('accepts valid muscle groups', () => {
      const muscles = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

      for (const muscle of muscles) {
        const result = dbCustomExerciseSchema.safeParse(createValidExercise({ muscle }))
        expect(result.success, `Muscle ${muscle} should be valid`).toBe(true)
      }
    })

    it('rejects invalid muscle group', () => {
      const result = dbCustomExerciseSchema.safeParse(createValidExercise({ muscle: 'biceps' }))
      expect(result.success).toBe(false)
    })

    it('accepts valid exercise types', () => {
      const types = ['compound', 'isolation', 'stability', 'cardio']

      for (const type of types) {
        const result = dbCustomExerciseSchema.safeParse(createValidExercise({ type }))
        expect(result.success, `Type ${type} should be valid`).toBe(true)
      }
    })

    it('rejects name exceeding max length', () => {
      const longName = 'a'.repeat(201)
      const result = dbCustomExerciseSchema.safeParse(createValidExercise({ name: longName }))
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const result = dbCustomExerciseSchema.safeParse(createValidExercise({ name: '' }))
      expect(result.success).toBe(false)
    })
  })
})

describe('Block Schema Validation', () => {
  describe('dbWorkoutBlockSchema', () => {
    it('accepts valid strength block', () => {
      const result = dbWorkoutBlockSchema.safeParse(createValidStrengthBlock())
      expect(result.success).toBe(true)
    })

    it('accepts valid AMRAP block', () => {
      const amrapBlock = {
        kind: 'amrap',
        id: 'block-1',
        config: { durationSeconds: 600 },
        exercises: [{ id: 'ex-1', name: 'Burpee', prescribedReps: 10, load: null, image: null }],
        result: null,
        orderIndex: 0,
      }
      const result = dbWorkoutBlockSchema.safeParse(amrapBlock)
      expect(result.success).toBe(true)
    })

    it('accepts valid EMOM block', () => {
      const emomBlock = {
        kind: 'emom',
        id: 'block-1',
        config: { minutes: 10, exerciseRotation: 'each-minute' },
        exercises: [
          { id: 'ex-1', name: 'Kettlebell Swing', prescribedReps: 15, load: '24kg', image: null },
        ],
        result: null,
        orderIndex: 0,
      }
      const result = dbWorkoutBlockSchema.safeParse(emomBlock)
      expect(result.success).toBe(true)
    })

    it('accepts valid Tabata block', () => {
      const tabataBlock = {
        kind: 'tabata',
        id: 'block-1',
        config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
        exercise: { id: 'ex-1', name: 'Squat Jump', prescribedReps: 0, load: null, image: null },
        result: null,
        orderIndex: 0,
      }
      const result = dbWorkoutBlockSchema.safeParse(tabataBlock)
      expect(result.success).toBe(true)
    })

    it('accepts valid ForTime block', () => {
      const forTimeBlock = {
        kind: 'fortime',
        id: 'block-1',
        config: { timeCapSeconds: 1200 },
        exercises: [{ id: 'ex-1', name: 'Row', prescribedReps: 1000, load: null, image: null }],
        result: null,
        orderIndex: 0,
      }
      const result = dbWorkoutBlockSchema.safeParse(forTimeBlock)
      expect(result.success).toBe(true)
    })

    it('accepts valid cardio block', () => {
      const cardioBlock = {
        kind: 'cardio',
        id: 'block-1',
        config: {
          activity: 'running',
          targetDurationSeconds: 1800,
          targetDistanceMeters: 5000,
        },
        result: null,
        orderIndex: 0,
      }
      const result = dbWorkoutBlockSchema.safeParse(cardioBlock)
      expect(result.success).toBe(true)
    })

    it('rejects block with invalid kind', () => {
      const invalidBlock = {
        kind: 'invalid',
        id: 'block-1',
        exerciseDefinitionId: null,
        name: 'Test',
        equipment: '',
        targetReps: 8,
        image: null,
        sets: [],
        orderIndex: 0,
      }
      const result = dbWorkoutBlockSchema.safeParse(invalidBlock)
      expect(result.success).toBe(false)
    })

    it('rejects strength block with invalid set status', () => {
      const invalidBlock = createValidStrengthBlock({
        sets: [
          {
            id: 'set-1',
            kg: '100',
            reps: '8',
            rir: '2',
            status: 'invalid-status',
            completedAt: null,
          },
        ],
      })
      const result = dbWorkoutBlockSchema.safeParse(invalidBlock)
      expect(result.success).toBe(false)
    })
  })
})

describe('Template Schema Validation', () => {
  describe('dbWorkoutTemplateSchema', () => {
    it('accepts valid template', () => {
      const result = dbWorkoutTemplateSchema.safeParse(createValidTemplate())
      expect(result.success).toBe(true)
    })

    it('rejects template with too many tags', () => {
      const tooManyTags = Array.from({ length: 21 }, (_, index) => `tag-${index}`)
      const result = dbWorkoutTemplateSchema.safeParse(createValidTemplate({ tags: tooManyTags }))
      expect(result.success).toBe(false)
    })

    it('rejects template with tag exceeding max length', () => {
      const longTag = 'a'.repeat(51)
      const result = dbWorkoutTemplateSchema.safeParse(createValidTemplate({ tags: [longTag] }))
      expect(result.success).toBe(false)
    })

    it('accepts template with cardio block', () => {
      const result = dbWorkoutTemplateSchema.safeParse(
        createValidTemplate({
          blocks: [
            createDatabaseTemplateCardioBlock({
              config: {
                activity: 'running',
                targetDurationSeconds: 1800,
                targetDistanceMeters: 5000,
              },
            }),
          ],
        }),
      )

      expect(result.success).toBe(true)
    })
  })
})

describe('Workout Schema Validation', () => {
  describe('dbCompletedWorkoutSchema', () => {
    it('accepts valid workout', () => {
      const result = dbCompletedWorkoutSchema.safeParse(createValidWorkout())
      expect(result.success).toBe(true)
    })

    it('rejects workout with duration exceeding max', () => {
      const result = dbCompletedWorkoutSchema.safeParse(
        createValidWorkout({ durationSeconds: 86_401 }),
      )
      expect(result.success).toBe(false)
    })

    it('rejects workout with notes exceeding max length', () => {
      const longNotes = 'a'.repeat(10_001)
      const result = dbCompletedWorkoutSchema.safeParse(createValidWorkout({ notes: longNotes }))
      expect(result.success).toBe(false)
    })
  })
})

describe('Size Limits', () => {
  it('accepts array at maximum size', () => {
    const settings = Array.from({ length: 20 }, () => ({ key: 'theme', value: 'dark' }))
    const result = exportDataSchema.safeParse(createValidExportData({ settings }))
    expect(result.success).toBe(true)
  })

  it('rejects settings array exceeding max (20)', () => {
    const settings = Array.from({ length: 21 }, () => ({ key: 'theme', value: 'dark' }))
    const result = exportDataSchema.safeParse(createValidExportData({ settings }))
    expect(result.success).toBe(false)
  })

  it('rejects exercises array exceeding max (500)', () => {
    const customExercises = Array.from({ length: 501 }, (_, index) =>
      createValidExercise({ id: `exercise-${index}` }),
    )
    const result = exportDataSchema.safeParse(createValidExportData({ customExercises }))
    expect(result.success).toBe(false)
  })

  it('rejects templates array exceeding max (100)', () => {
    const templates = Array.from({ length: 101 }, (_, index) =>
      createValidTemplate({ id: `template-${index}` }),
    )
    const result = exportDataSchema.safeParse(createValidExportData({ templates }))
    expect(result.success).toBe(false)
  })

  it('rejects workouts array exceeding max (5000)', () => {
    const workouts = Array.from({ length: 5001 }, (_, index) =>
      createValidWorkout({ id: `workout-${index}` }),
    )
    const result = exportDataSchema.safeParse(createValidExportData({ workouts }))
    expect(result.success).toBe(false)
  })
})

describe('Habit Schema Validation', () => {
  function createValidHabit(overrides: Record<string, unknown> = {}) {
    return {
      id: 'habit-1',
      name: 'Drink water',
      icon: '💧',
      schedule: { type: 'daily' },
      kind: { type: 'binary' },
      autoLink: null,
      archivedAt: null,
      orderIndex: 0,
      createdAt: Date.now(),
      ...overrides,
    }
  }

  function createValidHabitEntry(overrides: Record<string, unknown> = {}) {
    return {
      id: 'entry-1',
      habitId: 'habit-1',
      date: Date.now(),
      value: 1,
      recordedAt: Date.now(),
      ...overrides,
    }
  }

  describe('dbHabitSchema', () => {
    it('accepts a valid daily binary habit', () => {
      const result = dbHabitSchema.safeParse(createValidHabit())
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data).toMatchObject({ description: null, accent: 'purple' })
    })

    it('normalizes invalid legacy appearance fields', () => {
      const result = dbHabitSchema.safeParse(
        createValidHabit({ description: 42, accent: 'orange' }),
      )

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data).toMatchObject({ description: null, accent: 'purple' })
    })

    it('accepts a valid weekly quantity habit', () => {
      const result = dbHabitSchema.safeParse(
        createValidHabit({
          schedule: { type: 'weekly', targetDaysPerWeek: 3 },
          kind: { type: 'quantity', target: 2, unit: 'L' },
        }),
      )
      expect(result.success).toBe(true)
    })

    it('accepts autoLink set to completed-workout and null', () => {
      expect(
        dbHabitSchema.safeParse(createValidHabit({ autoLink: 'completed-workout' })).success,
      ).toBe(true)
      expect(dbHabitSchema.safeParse(createValidHabit({ autoLink: null })).success).toBe(true)
    })

    it('accepts a null icon and a null archivedAt', () => {
      const result = dbHabitSchema.safeParse(createValidHabit({ icon: null, archivedAt: null }))
      expect(result.success).toBe(true)
    })

    it('rejects an unrecognized schedule type instead of defaulting it', () => {
      const result = dbHabitSchema.safeParse(createValidHabit({ schedule: { type: 'monthly' } }))
      expect(result.success).toBe(false)
    })

    it('rejects a weekly schedule with targetDaysPerWeek out of the 1-7 range', () => {
      expect(
        dbHabitSchema.safeParse(
          createValidHabit({ schedule: { type: 'weekly', targetDaysPerWeek: 0 } }),
        ).success,
      ).toBe(false)
      expect(
        dbHabitSchema.safeParse(
          createValidHabit({ schedule: { type: 'weekly', targetDaysPerWeek: 8 } }),
        ).success,
      ).toBe(false)
    })

    it('rejects an unrecognized kind type instead of defaulting it', () => {
      const result = dbHabitSchema.safeParse(createValidHabit({ kind: { type: 'timed' } }))
      expect(result.success).toBe(false)
    })

    it('rejects a quantity kind with a non-positive target', () => {
      const result = dbHabitSchema.safeParse(
        createValidHabit({ kind: { type: 'quantity', target: 0, unit: 'L' } }),
      )
      expect(result.success).toBe(false)
    })

    it('rejects an invalid autoLink value', () => {
      const result = dbHabitSchema.safeParse(createValidHabit({ autoLink: 'started-workout' }))
      expect(result.success).toBe(false)
    })

    it('rejects an empty name', () => {
      const result = dbHabitSchema.safeParse(createValidHabit({ name: '' }))
      expect(result.success).toBe(false)
    })

    it('rejects extra properties (strict mode)', () => {
      const result = dbHabitSchema.safeParse({ ...createValidHabit(), maliciousField: 'x' })
      expect(result.success).toBe(false)
    })

    it('rejects __proto__ as habit ID', () => {
      const result = dbHabitSchema.safeParse(createValidHabit({ id: '__proto__' }))
      expect(result.success).toBe(false)
    })
  })

  describe('dbHabitEntrySchema', () => {
    it('accepts a valid entry', () => {
      const result = dbHabitEntrySchema.safeParse(createValidHabitEntry())
      expect(result.success).toBe(true)
    })

    it('rejects a negative value', () => {
      const result = dbHabitEntrySchema.safeParse(createValidHabitEntry({ value: -1 }))
      expect(result.success).toBe(false)
    })

    it('rejects a negative timestamp', () => {
      const result = dbHabitEntrySchema.safeParse(createValidHabitEntry({ date: -1 }))
      expect(result.success).toBe(false)
    })

    it('rejects extra properties (strict mode)', () => {
      const result = dbHabitEntrySchema.safeParse({
        ...createValidHabitEntry(),
        maliciousField: 'x',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('exportDataSchema with habits', () => {
    it('accepts export data that includes habits and habitEntries', () => {
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          settings: [],
          customExercises: [],
          templates: [],
          workouts: [],
          benchmarks: [],
          habits: [createValidHabit()],
          habitEntries: [createValidHabitEntry()],
        },
      }
      const result = exportDataSchema.safeParse(exportData)
      expect(result.success).toBe(true)
    })

    it('accepts export data omitting habits entirely (backward compat)', () => {
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          settings: [],
          customExercises: [],
          templates: [],
          workouts: [],
          benchmarks: [],
        },
      }
      const result = exportDataSchema.safeParse(exportData)
      expect(result.success).toBe(true)
    })
  })
})

describe('Error Message Quality', () => {
  it('provides path to invalid field', () => {
    const invalid = createValidExportData({
      customExercises: [createValidExercise({ equipment: 'invalid' })],
    })
    const result = exportDataSchema.safeParse(invalid)

    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      expect(issue?.path).toContain('data')
      expect(issue?.path).toContain('customExercises')
    }
  })

  it('identifies nested block validation errors', () => {
    const invalid = createValidExportData({
      workouts: [
        createValidWorkout({
          blocks: [createValidStrengthBlock({ kind: 'invalid' })],
        }),
      ],
    })
    const result = exportDataSchema.safeParse(invalid)

    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      expect(issue?.path.join('.')).toContain('blocks')
    }
  })
})
