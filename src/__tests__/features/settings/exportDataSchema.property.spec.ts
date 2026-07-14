import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { exportDataSchema } from '@/features/settings/utils/validation'
import {
  dbCompletedWorkoutArb,
  dbStrengthBlockArb,
  dbSetArb,
  timestampArb,
} from '@/__tests__/factories/arbitraries'

/**
 * Property-based tests for the export -> import validation pipeline.
 *
 * This is the canonical local-first invariant: anything the app exports must
 * survive JSON serialization and re-validate on import, byte-for-byte. The
 * schemas are driven directly (no IndexedDB), so these run as fast pure tests.
 */

const exportDataArb = fc.record({
  version: fc.integer({ min: 1, max: 100 }),
  exportedAt: timestampArb.map((timestamp) => new Date(timestamp).toISOString()),
  data: fc.record({
    settings: fc.constant([]),
    customExercises: fc.constant([]),
    templates: fc.constant([]),
    workouts: fc.array(dbCompletedWorkoutArb, { maxLength: 2 }),
    benchmarks: fc.constant([]),
    weightEntries: fc.constant([]),
  }),
})

/** Export data guaranteed to contain at least one strength block with sets. */
const exportDataWithSetsArb = fc
  .tuple(
    exportDataArb,
    dbCompletedWorkoutArb,
    dbStrengthBlockArb,
    fc.array(dbSetArb, { minLength: 1, maxLength: 3 }),
  )
  .map(([exportData, workout, strengthBlock, sets]) => ({
    ...exportData,
    data: {
      ...exportData.data,
      workouts: [
        ...exportData.data.workouts,
        { ...workout, blocks: [{ ...strengthBlock, sets, orderIndex: 0 }] },
      ],
    },
  }))

/**
 * Serialize through JSON. The export file format IS JSON, so this exact
 * boundary (not structuredClone) is what the properties must exercise.
 */
function throughJson(value: unknown): unknown {
  // eslint-disable-next-line unicorn/prefer-structured-clone -- JSON serialization is the behavior under test
  return JSON.parse(JSON.stringify(value))
}

function parseOrThrow(input: unknown) {
  const result = exportDataSchema.safeParse(input)
  if (!result.success) {
    throw new Error(`Expected valid export data: ${result.error.message}`)
  }
  return result.data
}

describe('export data schema (property-based)', () => {
  it('validates its own export after a JSON round-trip, preserving every field', () => {
    fc.assert(
      fc.property(exportDataArb, (exportData) => {
        const parsed = parseOrThrow(throughJson(exportData))
        expect(parsed).toEqual(exportData)
      }),
    )
  })

  it('parsing is idempotent: re-validating parsed output changes nothing', () => {
    fc.assert(
      fc.property(exportDataArb, (exportData) => {
        const once = parseOrThrow(exportData)
        const twice = parseOrThrow(throughJson(once))
        expect(twice).toEqual(once)
      }),
    )
  })

  it('defaults a missing set duration to the empty string (pre-isometric backward compat)', () => {
    fc.assert(
      fc.property(exportDataWithSetsArb, (exportData) => {
        const withoutDurations: unknown = JSON.parse(
          JSON.stringify(exportData, (key, value: unknown) =>
            key === 'duration' ? undefined : value,
          ),
        )

        const parsed = parseOrThrow(withoutDurations)

        const sets = parsed.data.workouts.flatMap((workout) =>
          workout.blocks.flatMap((block) => (block.kind === 'strength' ? [...block.sets] : [])),
        )
        expect(sets.length).toBeGreaterThan(0)
        for (const set of sets) {
          expect(set.duration).toBe('')
        }
      }),
    )
  })

  // Strict-mode rejection doesn't depend on generated values or key spelling,
  // so one deterministic fixture per level is enough.
  it('rejects unknown keys at every level (strict mode)', () => {
    const block = {
      kind: 'strength' as const,
      id: 'block-1',
      exerciseDefinitionId: null,
      name: 'Squat',
      equipment: 'barbell',
      targetReps: 5,
      targetDuration: null,
      targetWeight: null,
      sets: [
        {
          id: 'set-1',
          kg: '100',
          reps: '5',
          duration: '',
          rir: '2',
          status: 'completed',
          completedAt: null,
        },
      ],
      orderIndex: 0,
      image: null,
    }
    const workout = {
      id: 'workout-1',
      name: 'Strict mode fixture',
      blocks: [block],
      startedAt: 0,
      completedAt: 0,
      durationSeconds: 3600,
      notes: '',
      benchmarkId: null,
    }
    const exportData = {
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      data: {
        settings: [],
        customExercises: [],
        templates: [],
        workouts: [workout],
        benchmarks: [],
        weightEntries: [],
      },
    }

    expect(exportDataSchema.safeParse(exportData).success).toBe(true)

    const atRoot = { ...exportData, unexpectedKey: 'junk' }
    expect(exportDataSchema.safeParse(atRoot).success).toBe(false)

    const atData = { ...exportData, data: { ...exportData.data, unexpectedCollection: [] } }
    expect(exportDataSchema.safeParse(atData).success).toBe(false)

    const atBlock = {
      ...exportData,
      data: {
        ...exportData.data,
        workouts: [{ ...workout, blocks: [{ ...block, unexpectedField: true }] }],
      },
    }
    expect(exportDataSchema.safeParse(atBlock).success).toBe(false)
  })
})
