/**
 * Shared fast-check arbitraries for property-based tests.
 *
 * Generators are constrained to the bounds enforced by the export validation
 * schemas (src/features/settings/utils/validation), so the same arbitraries
 * can drive DB converter round-trips, template conversion, and schema
 * validation properties.
 *
 * `image` fields are always `null`: Blobs can't be serialized to JSON and the
 * export schemas pin them to null.
 */

import fc from 'fast-check'
import { EQUIPMENT_VALUES } from '@/types/exercises'
import type { Workout, Set } from '@/types/workout'
import { CARDIO_ACTIVITIES } from '@/types/blocks'
import type { BlockExercise, WorkoutBlock, WorkoutMode } from '@/types/blocks'
import type {
  DbActiveWorkout,
  DbCompletedWorkout,
  DbSet,
  DbTemplateBlock,
  DbWorkoutBlock,
} from '@/db/schema'

// ============================================
// Primitives
// ============================================

/** Timestamps between epoch and year 2100. */
export const timestampArb = fc.integer({ min: 0, max: 4_102_444_800_000 })

const nameArb = fc.string({ minLength: 1, maxLength: 50 })

const setStatusArb = fc.constantFrom<Set['status']>('completed', 'active', 'planned')

const workoutModeArb = fc.constantFrom<WorkoutMode>('builder', 'active', 'completed')

const equipmentArb = fc.constantFrom(...EQUIPMENT_VALUES)

const loadArb = fc.option(fc.string({ maxLength: 50 }), { nil: null })

export const cardioActivityArb = fc.constantFrom(...CARDIO_ACTIVITIES.map((a) => a.value))

/** Fractional values on a 0.1 grid (integer tenths), so float comparisons stay trivial. */
export function tenthsArb(maxTenths: number): fc.Arbitrary<number> {
  return fc.integer({ min: 0, max: maxTenths }).map((tenths) => tenths / 10)
}

// ============================================
// Block Configs (bounds match export validation schemas)
// ============================================

export const emomConfigArb = fc.record({
  minutes: fc.integer({ min: 1, max: 120 }),
  exerciseRotation: fc.constantFrom<'each-minute' | 'full-round'>('each-minute', 'full-round'),
})

export const amrapConfigArb = fc.record({
  durationSeconds: fc.integer({ min: 1, max: 7200 }),
})

export const tabataConfigArb = fc.record({
  rounds: fc.integer({ min: 1, max: 100 }),
  workSeconds: fc.integer({ min: 1, max: 600 }),
  restSeconds: fc.integer({ min: 0, max: 600 }),
})

export const forTimeConfigArb = fc.record({
  timeCapSeconds: fc.option(fc.integer({ min: 1, max: 7200 }), { nil: null }),
})

const cardioConfigArb = fc.record({
  activity: cardioActivityArb,
  targetDurationSeconds: fc.option(fc.integer({ min: 1, max: 36_000 }), { nil: null }),
  targetDistanceMeters: fc.option(fc.integer({ min: 1, max: 1_000_000 }), { nil: null }),
})

// ============================================
// Block Results (bounds match export validation schemas)
// ============================================

const amrapResultArb = fc.record({
  rounds: fc.integer({ min: 0, max: 1000 }),
  partialReps: fc.integer({ min: 0, max: 1000 }),
  actualDuration: fc.integer({ min: 0, max: 36_000_000 }),
})

const emomResultArb = fc.record({
  completedMinutes: fc.integer({ min: 0, max: 120 }),
  missedMinutes: fc.array(fc.integer({ min: 0, max: 120 }), { maxLength: 10 }),
})

const tabataResultArb = fc.record({
  repsPerRound: fc.array(fc.integer({ min: 0, max: 100 }), { maxLength: 10 }),
})

/** Fractional split seconds at 0.1s precision (split comparison uses a 0.1s tolerance). */
const splitTimeArb = tenthsArb(360_000)

/**
 * `splitTimes` is optional in DbForTimeResult and accepted by
 * databaseForTimeResultSchema (it used to be rejected by .strict() — fixed).
 * `requiredKeys` sometimes OMITS the key entirely (not `undefined`): JSON
 * round-trip identity in the settings suite needs absent keys.
 */
const forTimeResultArb = fc.record(
  {
    completionTime: fc.integer({ min: 0, max: 36_000_000 }),
    completed: fc.boolean(),
    splitTimes: fc.array(splitTimeArb, { maxLength: 10 }),
  },
  { requiredKeys: ['completionTime', 'completed'] },
)

const cardioResultArb = fc.record({
  actualDurationSeconds: fc.integer({ min: 0, max: 36_000 }),
  distanceMeters: fc.option(fc.integer({ min: 0, max: 1_000_000 }), { nil: null }),
  avgPaceSecondsPerKm: fc.option(fc.integer({ min: 0, max: 10_000 }), { nil: null }),
  calories: fc.option(fc.integer({ min: 0, max: 10_000 }), { nil: null }),
  notes: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
})

// ============================================
// Database Shapes
// ============================================

export const dbSetArb: fc.Arbitrary<DbSet> = fc.record({
  id: fc.uuid(),
  kg: fc.string({ maxLength: 20 }),
  reps: fc.string({ maxLength: 20 }),
  duration: fc.string({ maxLength: 20 }),
  rir: fc.string({ maxLength: 20 }),
  status: setStatusArb,
  completedAt: fc.option(timestampArb, { nil: null }),
})

/** Same shape for DbBlockExercise and the in-memory BlockExercise. */
export const blockExerciseArb: fc.Arbitrary<BlockExercise> = fc.record({
  id: fc.uuid(),
  name: nameArb,
  prescribedReps: fc.integer({ min: 0, max: 1000 }),
  load: loadArb,
  image: fc.constant(null),
})

const dbBlockCommon = {
  id: fc.uuid(),
  orderIndex: fc.integer({ min: 0, max: 49 }),
}

/** Strength fields shared by DB, in-memory, and template strength blocks. */
const strengthCoreFields = {
  exerciseDefinitionId: fc.option(fc.uuid(), { nil: null }),
  name: nameArb,
  equipment: equipmentArb,
  targetReps: fc.integer({ min: 0, max: 1000 }),
  targetDuration: fc.option(fc.integer({ min: 0, max: 3600 }), { nil: null }),
  targetWeight: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
  image: fc.constant(null),
}

export const dbStrengthBlockArb = fc.record({
  kind: fc.constant('strength' as const),
  ...dbBlockCommon,
  ...strengthCoreFields,
  sets: fc.array(dbSetArb, { maxLength: 5 }),
})

const dbAmrapBlockArb = fc.record({
  kind: fc.constant('amrap' as const),
  ...dbBlockCommon,
  config: amrapConfigArb,
  exercises: fc.array(blockExerciseArb, { maxLength: 4 }),
  result: fc.option(amrapResultArb, { nil: null }),
})

const dbEmomBlockArb = fc.record({
  kind: fc.constant('emom' as const),
  ...dbBlockCommon,
  config: emomConfigArb,
  exercises: fc.array(blockExerciseArb, { maxLength: 4 }),
  result: fc.option(emomResultArb, { nil: null }),
})

const dbTabataBlockArb = fc.record({
  kind: fc.constant('tabata' as const),
  ...dbBlockCommon,
  config: tabataConfigArb,
  exercise: blockExerciseArb,
  result: fc.option(tabataResultArb, { nil: null }),
})

const dbForTimeBlockArb = fc.record({
  kind: fc.constant('fortime' as const),
  ...dbBlockCommon,
  config: forTimeConfigArb,
  exercises: fc.array(blockExerciseArb, { maxLength: 4 }),
  result: fc.option(forTimeResultArb, { nil: null }),
})

const dbCardioBlockArb = fc.record({
  kind: fc.constant('cardio' as const),
  ...dbBlockCommon,
  config: cardioConfigArb,
  result: fc.option(cardioResultArb, { nil: null }),
})

export const dbWorkoutBlockArb: fc.Arbitrary<DbWorkoutBlock> = fc.oneof(
  dbStrengthBlockArb,
  dbAmrapBlockArb,
  dbEmomBlockArb,
  dbTabataBlockArb,
  dbForTimeBlockArb,
  dbCardioBlockArb,
)

export const dbActiveWorkoutArb: fc.Arbitrary<DbActiveWorkout> = fc.record({
  id: fc.constant('current' as const),
  name: nameArb,
  blocks: fc.array(dbWorkoutBlockArb, { maxLength: 4 }),
  selectedBlockIndex: fc.integer(),
  startedAt: timestampArb,
  lastModifiedAt: timestampArb,
  mode: workoutModeArb,
  activeSetIndex: fc.option(fc.integer({ min: 0, max: 50 }), { nil: null }),
  activeExerciseIndex: fc.constant(null),
  benchmarkId: fc.constant(null),
  globalTimerStartedAt: fc.constant(null),
})

export const dbCompletedWorkoutArb: fc.Arbitrary<DbCompletedWorkout> = fc.record({
  id: fc.uuid(),
  name: nameArb,
  blocks: fc
    .array(dbWorkoutBlockArb, { maxLength: 4 })
    .map((blocks) => blocks.map((block, index) => ({ ...block, orderIndex: index }))),
  startedAt: timestampArb,
  completedAt: timestampArb,
  durationSeconds: fc.integer({ min: 0, max: 86_400 }),
  notes: fc.string({ maxLength: 200 }),
  benchmarkId: fc.option(fc.uuid(), { nil: null }),
})

// ============================================
// In-Memory Shapes (normalized: ids re-derived from array position)
// ============================================

const setArb: fc.Arbitrary<Set> = fc.record({
  id: fc.constant(0), // normalized to index + 1 at assembly
  kg: fc.string({ maxLength: 20 }),
  reps: fc.string({ maxLength: 20 }),
  duration: fc.string({ maxLength: 20 }),
  rir: fc.string({ maxLength: 20 }),
  status: setStatusArb,
})

const strengthBlockArb = fc.record({
  kind: fc.constant('strength' as const),
  id: fc.constant(0), // normalized to index + 1 at assembly
  ...strengthCoreFields,
  sets: fc
    .array(setArb, { maxLength: 5 })
    .map((sets) => sets.map((set, index) => ({ ...set, id: index + 1 }))),
})

/**
 * In-memory variant of a DB block arbitrary: drop `orderIndex` (derived from
 * array position) and replace the uuid `id` with 0 (normalized to index + 1
 * at assembly).
 */
function toInMemoryBlockArb<T extends { id: string; orderIndex: number }>(
  dbBlockArb: fc.Arbitrary<T>,
): fc.Arbitrary<Omit<T, 'id' | 'orderIndex'> & { id: number }> {
  return dbBlockArb.map(({ id: _id, orderIndex: _orderIndex, ...rest }) => ({ ...rest, id: 0 }))
}

const workoutBlockArb: fc.Arbitrary<WorkoutBlock> = fc.oneof(
  strengthBlockArb,
  toInMemoryBlockArb(dbAmrapBlockArb),
  toInMemoryBlockArb(dbEmomBlockArb),
  toInMemoryBlockArb(dbTabataBlockArb),
  toInMemoryBlockArb(dbForTimeBlockArb),
  toInMemoryBlockArb(dbCardioBlockArb),
)

/**
 * In-memory Workout already in normalized form (block/set ids are 1-based
 * array positions, selectedBlockIndex in bounds, builder mode when empty) —
 * the fixed-point domain of dbToWorkout ∘ workoutToDb.
 */
export const normalizedWorkoutArb: fc.Arbitrary<Workout> = fc
  .record({
    name: nameArb,
    blocks: fc
      .array(workoutBlockArb, { maxLength: 4 })
      .map((blocks) => blocks.map((block, index) => ({ ...block, id: index + 1 }))),
    startedAt: timestampArb,
    activeSetIndex: fc.option(fc.integer({ min: 0, max: 50 }), { nil: null }),
  })
  .chain((base) =>
    fc
      .record({
        selectedBlockIndex:
          base.blocks.length === 0
            ? fc.constant(-1)
            : fc.integer({ min: 0, max: base.blocks.length - 1 }),
        mode: base.blocks.length === 0 ? fc.constant('builder' as const) : workoutModeArb,
      })
      .map((rest) => ({ id: 1, ...base, ...rest })),
  )

// ============================================
// Template Shapes
// ============================================

const dbTemplateBlockExerciseArb = fc.record({
  exerciseDefinitionId: fc.option(fc.uuid(), { nil: null }),
  name: nameArb,
  prescribedReps: fc.integer({ min: 0, max: 1000 }),
  load: loadArb,
  image: fc.constant(null),
})

const dbTemplateStrengthBlockArb = fc.record({
  kind: fc.constant('strength' as const),
  ...strengthCoreFields,
  defaultSetCount: fc.integer({ min: 1, max: 10 }),
})

export const dbTemplateBlockArb: fc.Arbitrary<DbTemplateBlock> = fc.oneof(
  dbTemplateStrengthBlockArb,
  fc.record({
    kind: fc.constant('amrap' as const),
    config: amrapConfigArb,
    exercises: fc.array(dbTemplateBlockExerciseArb, { maxLength: 4 }),
  }),
  fc.record({
    kind: fc.constant('emom' as const),
    config: emomConfigArb,
    exercises: fc.array(dbTemplateBlockExerciseArb, { maxLength: 4 }),
  }),
  fc.record({
    kind: fc.constant('tabata' as const),
    config: tabataConfigArb,
    exercise: dbTemplateBlockExerciseArb,
  }),
  fc.record({
    kind: fc.constant('fortime' as const),
    config: forTimeConfigArb,
    exercises: fc.array(dbTemplateBlockExerciseArb, { maxLength: 4 }),
  }),
  fc.record({
    kind: fc.constant('cardio' as const),
    config: cardioConfigArb,
  }),
)
