import { describe, expect, it } from 'vitest'

import {
  dbCompletedWorkoutSchema,
  dbCustomExerciseSchema,
  dbUserSettingSchema,
  dbWorkoutBlockSchema,
  dbWorkoutTemplateSchema,
  exportDataSchema,
} from '@/features/settings/utils/validation'

/**
 * Creates a valid export data structure for testing.
 */
function createValidExportData(overrides: {
  settings?: Array<unknown>
  customExercises?: Array<unknown>
  templates?: Array<unknown>
  workouts?: Array<unknown>
} = {}) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      settings: overrides.settings ?? [],
      customExercises: overrides.customExercises ?? [],
      templates: overrides.templates ?? [],
      workouts: overrides.workouts ?? [],
    },
  }
}

/**
 * Creates a valid custom exercise for testing.
 */
function createValidExercise(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exercise-1',
    icon: '🏋️',
    name: 'Squat',
    equipment: 'barbell',
    muscle: 'legs',
    type: 'compound',
    metrics: 'weight-reps',
    createdAt: Date.now(),
    updatedAt: Date.now(),
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
    thumbnail: '🏋️',
    sets: [
      {
        id: 'set-1',
        kg: '100',
        reps: '8',
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
    startedAt: Date.now() - 3600000,
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
        thumbnail: '🏋️',
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

    it('rejects missing version', () => {
      const invalid = {
        exportedAt: new Date().toISOString(),
        data: { settings: [], customExercises: [], templates: [], workouts: [] },
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
        createValidExercise({ equipment: 'lightsaber' })
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
        exercises: [
          { id: 'ex-1', name: 'Burpee', prescribedReps: 10, load: null, thumbnail: '🏃' },
        ],
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
          { id: 'ex-1', name: 'Kettlebell Swing', prescribedReps: 15, load: '24kg', thumbnail: '🔔' },
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
        exercise: { id: 'ex-1', name: 'Squat Jump', prescribedReps: 0, load: null, thumbnail: '🦵' },
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
        exercises: [
          { id: 'ex-1', name: 'Row', prescribedReps: 1000, load: null, thumbnail: '🚣' },
        ],
        result: null,
        orderIndex: 0,
      }
      const result = dbWorkoutBlockSchema.safeParse(forTimeBlock)
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
        thumbnail: '',
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
      const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag-${i}`)
      const result = dbWorkoutTemplateSchema.safeParse(createValidTemplate({ tags: tooManyTags }))
      expect(result.success).toBe(false)
    })

    it('rejects template with tag exceeding max length', () => {
      const longTag = 'a'.repeat(51)
      const result = dbWorkoutTemplateSchema.safeParse(createValidTemplate({ tags: [longTag] }))
      expect(result.success).toBe(false)
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
        createValidWorkout({ durationSeconds: 86401 })
      )
      expect(result.success).toBe(false)
    })

    it('rejects workout with notes exceeding max length', () => {
      const longNotes = 'a'.repeat(10001)
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
    const customExercises = Array.from({ length: 501 }, (_, i) =>
      createValidExercise({ id: `exercise-${i}` })
    )
    const result = exportDataSchema.safeParse(createValidExportData({ customExercises }))
    expect(result.success).toBe(false)
  })

  it('rejects templates array exceeding max (100)', () => {
    const templates = Array.from({ length: 101 }, (_, i) =>
      createValidTemplate({ id: `template-${i}` })
    )
    const result = exportDataSchema.safeParse(createValidExportData({ templates }))
    expect(result.success).toBe(false)
  })

  it('rejects workouts array exceeding max (5000)', () => {
    const workouts = Array.from({ length: 5001 }, (_, i) =>
      createValidWorkout({ id: `workout-${i}` })
    )
    const result = exportDataSchema.safeParse(createValidExportData({ workouts }))
    expect(result.success).toBe(false)
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
