import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { exportWorkoutAsMarkdown } from '@/features/workout/utils/markdownExport'
import { parseWorkoutMarkdown } from '@/features/workout/utils/markdownImport'
import type { ParsedBlock } from '@/blocks'
import type { DbCompletedWorkout } from '@/db/schema'
import type { DbBlockExercise, DbWorkoutBlock } from '@/blocks'
import { EQUIPMENT_VALUES } from '@/types/exercises'
import { createDbCompletedWorkout } from '@/__tests__/factories/dbWorkout.factory'
import { cardioActivityArb, emomConfigArb, timestampArb } from '@/__tests__/factories/arbitraries'
import { assertSuccess } from './assertParseSuccess'

/**
 * Property-based round-trip tests for markdown export -> import.
 *
 * Markdown is a deliberately lossy format, so these generators are
 * constrained to the *lossless input domain* and the properties assert that
 * everything inside that domain survives the round-trip. Known-lossy edges
 * (documented, not tested as identity):
 * - set `duration`/`status`, EMOM `missedMinutes`, ForTime `splitTimes` are
 *   not exported at all
 * - AMRAP/ForTime durations are floored to whole minutes on export
 * - result durations are floored to whole seconds on export
 * - distances are rounded to 0.1 km on export
 * - strength `targetReps: 0` is skipped on export and parses back as null
 * - a fully-empty set (kg, reps AND rir all empty) is skipped on export
 *   (isSetEmpty), so the set generator guarantees at least one non-empty field
 */

// ============================================
// Lossless-domain generators
// ============================================

// Round-trip alphabet: characters that genuinely survive export -> import
// unchanged. Spaces come from joining words (never leading/trailing — the
// parsers trim line content, so outer whitespace is lossy by design).
// '@' is deliberately absent: it is the exercise-load delimiter and is
// covered by the escaping robustness property below.
const letterArb = fc.constantFrom(
  ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789äöüÄÖÜß'-",
)
const wordArb = fc.string({ unit: letterArb, minLength: 1, maxLength: 8 })
const mdNameArb = fc.array(wordArb, { minLength: 1, maxLength: 3 }).map((words) => words.join(' '))

const digitsArb = fc.integer({ min: 0, max: 999 }).map(String)
const digitsOrEmptyArb = fc.oneof(fc.constant(''), digitsArb)

// Empty rir now exports as '-' and parses back to '' (formerly the empty cell
// dropped the whole row). Fully-empty sets are excluded: the exporter skips
// them (isSetEmpty), so they are outside the lossless domain.
const mdSetArb = fc
  .record({
    id: fc.uuid(),
    kg: digitsOrEmptyArb,
    reps: digitsOrEmptyArb,
    rir: digitsOrEmptyArb,
    duration: fc.constant(''),
    status: fc.constant('completed' as const),
    completedAt: fc.constant(null),
  })
  .filter((set) => set.kg !== '' || set.reps !== '' || set.rir !== '')

const mdExerciseArb: fc.Arbitrary<DbBlockExercise> = fc.record({
  id: fc.uuid(),
  name: mdNameArb,
  prescribedReps: fc.integer({ min: 0, max: 999 }),
  load: fc.option(fc.string({ unit: letterArb, minLength: 1, maxLength: 6 }), { nil: null }),
  image: fc.constant(null),
})

const wholeMinutesArb = fc.integer({ min: 1, max: 120 }).map((minutes) => minutes * 60)
const wholeSecondsMsArb = fc.integer({ min: 0, max: 7200 }).map((seconds) => seconds * 1000)
const smallCountArb = fc.integer({ min: 0, max: 99 })

const mdAmrapConfigArb = fc.record({ durationSeconds: wholeMinutesArb })

const mdAmrapResultArb = fc.record({
  rounds: smallCountArb,
  partialReps: smallCountArb,
  actualDuration: wholeSecondsMsArb,
})

const mdEmomResultArb = fc.record({
  completedMinutes: fc.integer({ min: 0, max: 120 }),
  missedMinutes: fc.constant<ReadonlyArray<number>>([]), // not exported to markdown
})

const mdTabataConfigArb = fc.record({
  rounds: fc.integer({ min: 1, max: 99 }),
  workSeconds: fc.integer({ min: 1, max: 600 }),
  restSeconds: fc.integer({ min: 0, max: 600 }),
})

// Empty repsPerRound exports as a result line the parser cannot read back
const mdTabataResultArb = fc.record({
  repsPerRound: fc.array(smallCountArb, { minLength: 1, maxLength: 8 }),
})

const mdForTimeConfigArb = fc.record({
  timeCapSeconds: fc.option(wholeMinutesArb, { nil: null }),
})

const mdForTimeResultArb = fc.record({
  completionTime: wholeSecondsMsArb,
  completed: fc.boolean(),
})

const mdCardioConfigArb = fc.record({
  activity: cardioActivityArb,
  // Config targets are not exported to markdown at all (lossy by design)
  targetDurationSeconds: fc.constant(null),
  targetDistanceMeters: fc.constant(null),
})

// Exported at 0.1 km precision, so whole hundreds of meters only
const mdDistanceMetersArb = fc.integer({ min: 1, max: 10_000 }).map((hm) => hm * 100)

const mdCardioResultArb = fc.record({
  // 0 would be skipped as falsy on export; >=1 guarantees a result section
  actualDurationSeconds: fc.integer({ min: 1, max: 36_000 }),
  distanceMeters: fc.option(mdDistanceMetersArb, { nil: null }),
  avgPaceSecondsPerKm: fc.option(fc.integer({ min: 1, max: 3599 }), { nil: null }),
  calories: fc.option(fc.integer({ min: 1, max: 9999 }), { nil: null }),
  notes: fc.option(mdNameArb, { nil: null }),
})

const mdStrengthBlockArb = fc.record({
  kind: fc.constant('strength' as const),
  id: fc.uuid(),
  exerciseDefinitionId: fc.constant(null),
  name: mdNameArb,
  equipment: fc.constantFrom(...EQUIPMENT_VALUES),
  targetReps: fc.integer({ min: 0, max: 999 }),
  targetDuration: fc.constant(null),
  targetWeight: fc.constant(null),
  sets: fc.array(mdSetArb, { maxLength: 4 }),
  orderIndex: fc.constant(0),
  image: fc.constant(null),
})

const mdAmrapBlockArb = fc.record({
  kind: fc.constant('amrap' as const),
  id: fc.uuid(),
  config: mdAmrapConfigArb,
  exercises: fc.array(mdExerciseArb, { maxLength: 3 }),
  result: fc.option(mdAmrapResultArb, { nil: null }),
  orderIndex: fc.constant(0),
})

const mdEmomBlockArb = fc.record({
  kind: fc.constant('emom' as const),
  id: fc.uuid(),
  config: emomConfigArb,
  exercises: fc.array(mdExerciseArb, { maxLength: 3 }),
  result: fc.option(mdEmomResultArb, { nil: null }),
  orderIndex: fc.constant(0),
})

const mdTabataBlockArb = fc.record({
  kind: fc.constant('tabata' as const),
  id: fc.uuid(),
  config: mdTabataConfigArb,
  exercise: mdExerciseArb,
  result: fc.option(mdTabataResultArb, { nil: null }),
  orderIndex: fc.constant(0),
})

const mdForTimeBlockArb = fc.record({
  kind: fc.constant('fortime' as const),
  id: fc.uuid(),
  config: mdForTimeConfigArb,
  exercises: fc.array(mdExerciseArb, { maxLength: 3 }),
  result: fc.option(mdForTimeResultArb, { nil: null }),
  orderIndex: fc.constant(0),
})

const mdCardioBlockArb = fc.record({
  kind: fc.constant('cardio' as const),
  id: fc.uuid(),
  config: mdCardioConfigArb,
  result: fc.option(mdCardioResultArb, { nil: null }),
  orderIndex: fc.constant(0),
})

const mdBlockArb: fc.Arbitrary<DbWorkoutBlock> = fc.oneof(
  mdStrengthBlockArb,
  mdAmrapBlockArb,
  mdEmomBlockArb,
  mdTabataBlockArb,
  mdForTimeBlockArb,
  mdCardioBlockArb,
)

const mdWorkoutArb: fc.Arbitrary<DbCompletedWorkout> = fc.record({
  id: fc.uuid(),
  name: mdNameArb,
  blocks: fc
    .array(mdBlockArb, { maxLength: 3 })
    .map((blocks) => blocks.map((block, index) => ({ ...block, orderIndex: index }))),
  startedAt: timestampArb,
  // Stay within sane locale-formattable dates (1973..2100)
  completedAt: fc.integer({ min: 100_000_000_000, max: 4_102_444_800_000 }),
  durationSeconds: fc.integer({ min: 0, max: 86_400 }),
  notes: fc.oneof(fc.constant(''), mdNameArb),
  benchmarkId: fc.constant(null),
})

// ============================================
// Expected-value helpers
// ============================================

function exerciseData(exercise: DbBlockExercise) {
  return { name: exercise.name, prescribedReps: exercise.prescribedReps, load: exercise.load }
}

/** Mirrors the export naming rule for multi-exercise blocks. */
function displayName(exercises: ReadonlyArray<DbBlockExercise>, fallback: string): string {
  const first = exercises[0]
  return exercises.length === 1 && first ? first.name : fallback
}

function expectStrengthRoundTrip(
  parsed: ParsedBlock,
  original: Extract<DbWorkoutBlock, { kind: 'strength' }>,
): void {
  if (parsed.kind !== 'strength') throw new Error('kind mismatch')
  expect(parsed.name).toBe(original.name)
  expect(parsed.equipment).toBe(original.equipment)
  expect(parsed.targetReps).toBe(original.targetReps > 0 ? original.targetReps : null)
  expect(parsed.sets).toEqual(
    original.sets.map((set) => ({ kg: set.kg, reps: set.reps, rir: set.rir })),
  )
}

function expectAmrapRoundTrip(
  parsed: ParsedBlock,
  original: Extract<DbWorkoutBlock, { kind: 'amrap' }>,
): void {
  if (parsed.kind !== 'amrap') throw new Error('kind mismatch')
  expect(parsed.name).toBe(displayName(original.exercises, 'AMRAP'))
  expect(parsed.durationSeconds).toBe(original.config.durationSeconds)
  expect(parsed.exercises).toEqual(original.exercises.map(exerciseData))
  expect(parsed.result).toEqual(original.result)
}

function expectEmomRoundTrip(
  parsed: ParsedBlock,
  original: Extract<DbWorkoutBlock, { kind: 'emom' }>,
): void {
  if (parsed.kind !== 'emom') throw new Error('kind mismatch')
  expect(parsed.name).toBe(displayName(original.exercises, 'EMOM'))
  expect(parsed.minutes).toBe(original.config.minutes)
  expect(parsed.rotation).toBe(original.config.exerciseRotation)
  expect(parsed.exercises).toEqual(original.exercises.map(exerciseData))
  expect(parsed.result).toEqual(original.result)
}

function expectTabataRoundTrip(
  parsed: ParsedBlock,
  original: Extract<DbWorkoutBlock, { kind: 'tabata' }>,
): void {
  if (parsed.kind !== 'tabata') throw new Error('kind mismatch')
  expect(parsed.name).toBe(original.exercise.name)
  expect(parsed.rounds).toBe(original.config.rounds)
  expect(parsed.workSeconds).toBe(original.config.workSeconds)
  expect(parsed.restSeconds).toBe(original.config.restSeconds)
  expect(parsed.exercise).toEqual(exerciseData(original.exercise))
  expect(parsed.result).toEqual(original.result)
}

function expectForTimeRoundTrip(
  parsed: ParsedBlock,
  original: Extract<DbWorkoutBlock, { kind: 'fortime' }>,
): void {
  if (parsed.kind !== 'fortime') throw new Error('kind mismatch')
  expect(parsed.name).toBe(displayName(original.exercises, 'For Time'))
  expect(parsed.timeCapSeconds).toBe(original.config.timeCapSeconds)
  expect(parsed.exercises).toEqual(original.exercises.map(exerciseData))
  expect(parsed.result).toEqual(
    original.result
      ? { completionTime: original.result.completionTime, completed: original.result.completed }
      : null,
  )
}

function expectCardioRoundTrip(
  parsed: ParsedBlock,
  original: Extract<DbWorkoutBlock, { kind: 'cardio' }>,
): void {
  if (parsed.kind !== 'cardio') throw new Error('kind mismatch')
  expect(parsed.activity).toBe(original.config.activity)
  if (original.result === null) {
    expect(parsed.result).toBeNull()
    return
  }
  expect(parsed.result).not.toBeNull()
  if (!parsed.result) throw new Error('missing cardio result')
  expect(parsed.result.actualDurationSeconds).toBe(original.result.actualDurationSeconds)
  expect(parsed.result.avgPaceSecondsPerKm).toBe(original.result.avgPaceSecondsPerKm)
  expect(parsed.result.calories).toBe(original.result.calories)
  expect(parsed.result.notes).toBe(original.result.notes)
  // Distance is exported at 0.1 km precision; 5.3 * 1000 reintroduces
  // float noise, so compare after rounding
  const parsedDistance =
    parsed.result.distanceMeters === null ? null : Math.round(parsed.result.distanceMeters)
  expect(parsedDistance).toBe(original.result.distanceMeters)
}

function expectBlockRoundTrip(parsed: ParsedBlock, original: DbWorkoutBlock): void {
  expect(parsed.kind).toBe(original.kind)

  switch (original.kind) {
    case 'strength': {
      expectStrengthRoundTrip(parsed, original)
      return
    }
    case 'amrap': {
      expectAmrapRoundTrip(parsed, original)
      return
    }
    case 'emom': {
      expectEmomRoundTrip(parsed, original)
      return
    }
    case 'tabata': {
      expectTabataRoundTrip(parsed, original)
      return
    }
    case 'fortime': {
      expectForTimeRoundTrip(parsed, original)
      return
    }
    case 'cardio': {
      expectCardioRoundTrip(parsed, original)
    }
  }
}

// ============================================
// Properties
// ============================================

describe('markdown round-trip (property-based)', () => {
  it('round-trips any workout in the lossless domain', () => {
    fc.assert(
      fc.property(mdWorkoutArb, (workout) => {
        const markdown = exportWorkoutAsMarkdown(workout)
        const result = parseWorkoutMarkdown(markdown)

        assertSuccess(result)

        // Metadata
        expect(result.data.metadata.name).toBe(workout.name)
        expect(result.data.metadata.durationSeconds).toBe(workout.durationSeconds)
        expect(result.data.metadata.notes).toBe(workout.notes === '' ? null : workout.notes)

        const originalDate = new Date(workout.completedAt)
        const parsedDate = result.data.metadata.date
        expect(parsedDate).not.toBeNull()
        if (!parsedDate) return
        expect(parsedDate.getFullYear()).toBe(originalDate.getFullYear())
        expect(parsedDate.getMonth()).toBe(originalDate.getMonth())
        expect(parsedDate.getDate()).toBe(originalDate.getDate())

        // Blocks
        expect(result.data.blocks).toHaveLength(workout.blocks.length)
        for (const [index, block] of workout.blocks.entries()) {
          const parsedBlock = result.data.blocks[index]
          expect(parsedBlock).toBeDefined()
          if (parsedBlock) expectBlockRoundTrip(parsedBlock, block)
        }
      }),
    )
  })

  // Robustness over a much broader alphabet (pipes, hashes, at-signs,
  // parens, quotes, ...): export -> parse must either round-trip every name
  // exactly or fail with `success: false`. A silently different name is data
  // corruption in a local-first app. Newlines are excluded: names and notes
  // come from single-line inputs, and a newline could never survive a
  // line-oriented format. Leading/trailing whitespace is excluded because the
  // line parsers trim it by design (same lossy class as the header comment).
  it('never silently corrupts names, even outside the lossless domain', () => {
    const broadCharArb = fc.constantFrom(...'abcXYZ0189äöü |#@()[]{}*_\'"`:;.,!?/\\×+=~%&$-')
    const broadNameArb = fc
      .string({ unit: broadCharArb, minLength: 1, maxLength: 24 })
      .filter((s) => s.trim() === s)

    fc.assert(
      fc.property(
        broadNameArb,
        broadNameArb,
        broadNameArb,
        (workoutName, strengthName, exerciseName) => {
          const workout = createDbCompletedWorkout({
            name: workoutName,
            notes: '',
            blocks: [
              {
                kind: 'strength',
                id: 'block-1',
                exerciseDefinitionId: null,
                name: strengthName,
                equipment: 'barbell',
                targetReps: 5,
                targetDuration: null,
                targetWeight: null,
                sets: [],
                orderIndex: 0,
                image: null,
              },
              {
                kind: 'amrap',
                id: 'block-2',
                config: { durationSeconds: 600 },
                exercises: [
                  {
                    id: 'exercise-1',
                    name: exerciseName,
                    prescribedReps: 10,
                    load: null,
                    image: null,
                  },
                ],
                result: null,
                orderIndex: 1,
              },
            ],
          })

          const result = parseWorkoutMarkdown(exportWorkoutAsMarkdown(workout))
          // Failing loudly is acceptable; silently changing a name is not.
          if (!result.success) return

          expect(result.data.metadata.name).toBe(workoutName)

          const [strengthBlock, amrapBlock] = result.data.blocks
          if (strengthBlock?.kind !== 'strength') throw new Error('strength block lost')
          expect(strengthBlock.name).toBe(strengthName)

          if (amrapBlock?.kind !== 'amrap') throw new Error('amrap block lost')
          // Single-exercise blocks export the exercise name as the header name
          expect(amrapBlock.name).toBe(exerciseName)
          expect(amrapBlock.exercises).toHaveLength(1)
          expect(amrapBlock.exercises[0]?.name).toBe(exerciseName)
        },
      ),
    )
  })

  // The round-trip property above already covers arbitrary workouts
  // (including zero blocks); this pins the fully-empty edge deterministically.
  it('produces parseable markdown for an empty workout', () => {
    const workout = createDbCompletedWorkout({ blocks: [], name: 'Empty', notes: '' })
    const result = parseWorkoutMarkdown(exportWorkoutAsMarkdown(workout))
    expect(result.success).toBe(true)
  })
})
