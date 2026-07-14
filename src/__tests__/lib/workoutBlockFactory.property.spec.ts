import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  createWorkoutBlockFromHistory,
  createWorkoutBlockFromTemplate,
} from '@/lib/workoutBlockFactory'
import {
  createTemplateAmrapBlock,
  createTemplateEmomBlock,
  createTemplateForTimeBlock,
  createTemplateTabataBlock,
} from '@/features/templates/lib/templateBlock'
import type { BlockExercise } from '@/types/blocks'
import type { DbTemplateBlock, DbTemplateStrengthBlock } from '@/db/schema'
import {
  amrapConfigArb,
  blockExerciseArb,
  dbTemplateBlockArb,
  emomConfigArb,
  forTimeConfigArb,
  tabataConfigArb,
} from '@/__tests__/factories/arbitraries'

/**
 * Property-based tests for template -> workout block instantiation.
 *
 * A template block must survive instantiation with every data field intact
 * across all six block kinds; only identities (block id, exercise ids without
 * a definition id) are regenerated.
 */

const blockIdArb = fc.integer({ min: 1, max: 100 })

/** The data fields of an exercise that must survive the template boundary. */
function exerciseData(exercise: {
  name: string
  prescribedReps: number
  load: string | null
  image: Blob | null
}) {
  return {
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    image: exercise.image,
  }
}

function expectExercisePreserved(
  actual: BlockExercise,
  source: { exerciseDefinitionId: string | null } & Parameters<typeof exerciseData>[0],
) {
  expect(exerciseData(actual)).toEqual(exerciseData(source))
  if (source.exerciseDefinitionId === null) {
    // No definition id: a fresh UUID is generated
    expect(actual.id.length).toBeGreaterThan(0)
    return
  }
  expect(actual.id).toBe(source.exerciseDefinitionId)
}

function expectStrengthTemplatePreserved(
  block: ReturnType<typeof createWorkoutBlockFromTemplate>,
  template: DbTemplateStrengthBlock,
): void {
  if (block.kind !== 'strength') throw new Error('kind mismatch')
  expect(block.name).toBe(template.name)
  expect(block.equipment).toBe(template.equipment)
  expect(block.exerciseDefinitionId).toBe(template.exerciseDefinitionId)
  expect(block.targetReps).toBe(template.targetReps)
  expect(block.targetDuration).toBe(template.targetDuration)
  expect(block.targetWeight).toBe(template.targetWeight)
  expect(block.sets).toHaveLength(template.defaultSetCount)
  for (const [index, set] of block.sets.entries()) {
    expect(set).toEqual({
      id: index + 1,
      kg: '',
      reps: String(template.targetReps),
      duration: '',
      rir: '',
      status: 'completed',
    })
  }
}

function expectTimedListTemplatePreserved(
  block: ReturnType<typeof createWorkoutBlockFromTemplate>,
  template: Extract<DbTemplateBlock, { kind: 'amrap' | 'emom' | 'fortime' }>,
): void {
  if (block.kind !== template.kind) throw new Error('kind mismatch')
  expect(block.config).toEqual(template.config)
  expect(block.result).toBeNull()
  expect(block.exercises).toHaveLength(template.exercises.length)
  for (const [index, exercise] of block.exercises.entries()) {
    const source = template.exercises[index]
    expect(source).toBeDefined()
    if (source) expectExercisePreserved(exercise, source)
  }
}

function expectTabataTemplatePreserved(
  block: ReturnType<typeof createWorkoutBlockFromTemplate>,
  template: Extract<DbTemplateBlock, { kind: 'tabata' }>,
): void {
  if (block.kind !== 'tabata') throw new Error('kind mismatch')
  expect(block.config).toEqual(template.config)
  expect(block.result).toBeNull()
  expectExercisePreserved(block.exercise, template.exercise)
  expect('exercises' in block).toBe(false)
}

function expectCardioTemplatePreserved(
  block: ReturnType<typeof createWorkoutBlockFromTemplate>,
  template: Extract<DbTemplateBlock, { kind: 'cardio' }>,
): void {
  if (block.kind !== 'cardio') throw new Error('kind mismatch')
  expect(block.config).toEqual(template.config)
  expect(block.result).toBeNull()
}

describe('workoutBlockFactory (property-based)', () => {
  it('preserves structure across all template block kinds', () => {
    fc.assert(
      fc.property(dbTemplateBlockArb, blockIdArb, (template, id) => {
        const block = createWorkoutBlockFromTemplate(template, id)

        expect(block.kind).toBe(template.kind)
        expect(block.id).toBe(id)

        switch (template.kind) {
          case 'strength': {
            expectStrengthTemplatePreserved(block, template)
            break
          }
          case 'amrap':
          case 'emom':
          case 'fortime': {
            expectTimedListTemplatePreserved(block, template)
            break
          }
          case 'tabata': {
            expectTabataTemplatePreserved(block, template)
            break
          }
          case 'cardio': {
            expectCardioTemplatePreserved(block, template)
            break
          }
        }
      }),
    )
  })

  it('round-trips exercise data through template creation and instantiation', () => {
    function exerciseListCaseArb<C>(
      configArb: fc.Arbitrary<C>,
      createTemplate: (config: C, exercises: ReadonlyArray<BlockExercise>) => DbTemplateBlock,
    ) {
      return fc
        .tuple(configArb, fc.array(blockExerciseArb, { maxLength: 4 }))
        .map(([config, exercises]) => ({
          config,
          exercises,
          template: createTemplate(config, exercises),
        }))
    }

    const casesArb = fc.oneof(
      exerciseListCaseArb(amrapConfigArb, createTemplateAmrapBlock),
      exerciseListCaseArb(emomConfigArb, createTemplateEmomBlock),
      exerciseListCaseArb(forTimeConfigArb, createTemplateForTimeBlock),
      fc.tuple(tabataConfigArb, blockExerciseArb).map(([config, exercise]) => ({
        config,
        exercises: [exercise],
        template: createTemplateTabataBlock(config, exercise),
      })),
    )

    fc.assert(
      fc.property(casesArb, blockIdArb, ({ config, exercises, template }, id) => {
        const block = createWorkoutBlockFromTemplate(template, id)

        if (block.kind === 'strength' || block.kind === 'cardio') {
          throw new Error('unexpected kind')
        }
        expect(block.config).toEqual(config)

        const actualExercises = block.kind === 'tabata' ? [block.exercise] : [...block.exercises]
        expect(actualExercises.map(exerciseData)).toEqual(exercises.map(exerciseData))
      }),
    )
  })

  it('preserves exercise ids and set values when instantiating from history', () => {
    const historySetArb = fc.record({
      kg: fc.string({ maxLength: 10 }),
      reps: fc.string({ maxLength: 10 }),
      rir: fc.string({ maxLength: 10 }),
    })

    function historyCaseArb<K extends string, C>(kind: K, configArb: fc.Arbitrary<C>) {
      return fc.record({
        kind: fc.constant(kind),
        config: configArb,
        exercises: fc.array(blockExerciseArb, { maxLength: 4 }),
      })
    }

    const historyBlockArb = fc.oneof(
      historyCaseArb('amrap' as const, amrapConfigArb),
      historyCaseArb('emom' as const, emomConfigArb),
      historyCaseArb('fortime' as const, forTimeConfigArb),
    )

    fc.assert(
      fc.property(historyBlockArb, blockIdArb, (history, id) => {
        const block = createWorkoutBlockFromHistory(history, id)

        if (block.kind === 'strength' || block.kind === 'tabata' || block.kind === 'cardio') {
          throw new Error('unexpected kind')
        }
        // History exercises keep their original ids verbatim
        expect([...block.exercises]).toEqual([...history.exercises])
        expect(block.result).toBeNull()
      }),
    )

    const historyStrengthArb = fc.record({
      kind: fc.constant('strength' as const),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      equipment: fc.constant('barbell' as const),
      sets: fc.array(historySetArb, { maxLength: 5 }),
      image: fc.constant(null),
    })

    fc.assert(
      fc.property(historyStrengthArb, blockIdArb, (history, id) => {
        const block = createWorkoutBlockFromHistory(history, id)

        if (block.kind !== 'strength') throw new Error('unexpected kind')
        expect(block.sets).toHaveLength(history.sets.length)
        for (const [index, set] of block.sets.entries()) {
          const source = history.sets[index]
          expect(source).toBeDefined()
          if (!source) return
          expect(set).toEqual({
            id: index + 1,
            kg: source.kg,
            reps: source.reps,
            duration: '',
            rir: source.rir,
            status: 'completed',
          })
        }
      }),
    )
  })
})
