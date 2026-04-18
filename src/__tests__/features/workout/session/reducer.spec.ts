import { describe, expect, it } from 'vitest'
import type {
  AmrapBlock,
  CardioBlock,
  CardioResult,
  StrengthBlock,
} from '@/types/blocks'
import type { Set, Workout } from '@/types/workout'
import {
  bucketFor,
  emptyWorkout,
  isBlockComplete,
  reduce,
} from '@/features/workout/session/reducer'
import type { SessionState } from '@/features/workout/session/types'

function makeSet(overrides: Partial<Set> = {}): Set {
  return { id: 1, kg: '100', reps: '8', duration: '', rir: '2', status: 'active', ...overrides }
}
function makePlannedSet(overrides: Partial<Set> = {}): Set {
  return makeSet({ kg: '', reps: '', duration: '', rir: '', status: 'planned', ...overrides })
}
function makeCompletedSet(overrides: Partial<Set> = {}): Set {
  return makeSet({ status: 'completed', ...overrides })
}

function makeStrengthBlock(overrides: Partial<StrengthBlock> = {}): StrengthBlock {
  return {
    kind: 'strength',
    id: 1,
    exerciseDefinitionId: 'ex-1',
    name: 'Bench Press',
    equipment: 'barbell',
    targetReps: 8,
    targetDuration: null,
    targetWeight: null,
    image: null,
    sets: [makeSet(), makePlannedSet({ id: 2 }), makePlannedSet({ id: 3 })],
    ...overrides,
  }
}

function makeAmrapBlock(result: AmrapBlock['result'] = null): AmrapBlock {
  return {
    kind: 'amrap',
    id: 10,
    config: { durationSeconds: 600 },
    exercises: [],
    result,
  }
}
function makeCardioBlock(result: CardioBlock['result'] = null): CardioBlock {
  return {
    kind: 'cardio',
    id: 14,
    config: { activity: 'running', targetDurationSeconds: null, targetDistanceMeters: null },
    result,
  }
}

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 1,
    name: 'Test Workout',
    blocks: [makeStrengthBlock()],
    selectedBlockIndex: 0,
    startedAt: 0,
    mode: 'builder',
    activeSetIndex: null,
    ...overrides,
  }
}

function makeDraft(overrides: Partial<Workout> = {}): Extract<SessionState, { status: 'draft' }> {
  return { status: 'draft', workout: makeWorkout({ mode: 'builder', ...overrides }) }
}
function makeRunning(
  overrides: Partial<Workout> = {},
): Extract<SessionState, { status: 'running' }> {
  return {
    status: 'running',
    workout: makeWorkout({ mode: 'active', startedAt: 1000, ...overrides }),
    lastOutcome: null,
  }
}

describe('reduce — lifecycle', () => {
  it('empty → NewDraft → draft with zero blocks', () => {
    const { next, effects } = reduce({ status: 'empty' }, { type: 'NewDraft' })
    expect(next.status).toBe('draft')
    if (next.status !== 'draft') throw new Error('unreachable')
    expect(next.workout.blocks).toHaveLength(0)
    expect(next.workout.startedAt).toBe(0)
    expect(effects).toHaveLength(0)
  })

  it('empty → LoadActive(active workout) → running', () => {
    const loaded = makeWorkout({ mode: 'active', startedAt: 1234 })
    const { next } = reduce({ status: 'empty' }, { type: 'LoadActive', workout: loaded })
    expect(next.status).toBe('running')
  })

  it('empty → LoadActive(completed workout) → completed', () => {
    const loaded = makeWorkout({ mode: 'completed' })
    const { next } = reduce({ status: 'empty' }, { type: 'LoadActive', workout: loaded })
    expect(next.status).toBe('completed')
  })

  it('StartWorkout stamps startedAt from cmd.now, never Date.now', () => {
    const { next } = reduce(makeDraft(), { type: 'StartWorkout', now: 42 })
    if (next.status !== 'running') throw new Error('expected running')
    expect(next.workout.startedAt).toBe(42)
    expect(next.workout.mode).toBe('active')
    expect(next.workout.selectedBlockIndex).toBe(0)
  })

  it('StartWorkout activates the first set on a strength-first workout', () => {
    const { next } = reduce(makeDraft(), { type: 'StartWorkout', now: 100 })
    if (next.status !== 'running') throw new Error('expected running')
    const first = next.workout.blocks[0]
    if (!first || first.kind !== 'strength') throw new Error('expected strength')
    expect(first.sets[0]?.status).toBe('active')
    expect(next.workout.activeSetIndex).toBe(0)
  })

  it('StartWorkout from non-draft status is a no-op', () => {
    const running = makeRunning()
    const { next, effects } = reduce(running, { type: 'StartWorkout', now: 999 })
    expect(next).toBe(running)
    expect(effects).toHaveLength(0)
  })

  it('StartWorkout with empty blocks is a no-op', () => {
    const { next, effects } = reduce(
      makeDraft({ blocks: [] }),
      { type: 'StartWorkout', now: 100 },
    )
    expect(next.status).toBe('draft')
    expect(effects).toHaveLength(0)
  })

  it('StartWorkout preserves existing startedAt when resuming from builder', () => {
    // Simulates: start workout (startedAt=500) → ReturnToBuilder → Resume (StartWorkout@now=9000)
    const resumed = makeDraft({ startedAt: 500 })
    const { next } = reduce(resumed, { type: 'StartWorkout', now: 9000 })
    if (next.status !== 'running') throw new Error('expected running')
    expect(next.workout.startedAt).toBe(500)
  })

  it('FinishWorkout from running → completed emits no effects (runner handles I/O)', () => {
    const { next, effects } = reduce(makeRunning(), { type: 'FinishWorkout' })
    expect(next.status).toBe('completed')
    if (next.status !== 'completed') throw new Error('unreachable')
    expect(next.workout.mode).toBe('completed')
    expect(effects).toEqual([])
  })

  it('Discard → empty emits clearPersisted', () => {
    const { next, effects } = reduce(makeRunning(), { type: 'Discard' })
    expect(next).toEqual({ status: 'empty' })
    expect(effects).toEqual([{ kind: 'clearPersisted' }])
  })

  it('ReturnToBuilder from running → draft, keeps blocks, clears activeSetIndex', () => {
    const { next } = reduce(makeRunning({ activeSetIndex: 1 }), { type: 'ReturnToBuilder' })
    expect(next.status).toBe('draft')
    if (next.status !== 'draft') throw new Error('unreachable')
    expect(next.workout.mode).toBe('builder')
    expect(next.workout.activeSetIndex).toBeNull()
  })

  it('ReturnToBuilder from draft is a no-op', () => {
    const draft = makeDraft()
    const { next } = reduce(draft, { type: 'ReturnToBuilder' })
    expect(next).toBe(draft)
  })
})

describe('reduce — CompleteSet cascade', () => {
  const active = makeSet({ id: 1, status: 'active' })
  const planned2 = makePlannedSet({ id: 2 })
  const planned3 = makePlannedSet({ id: 3 })

  it('next-set: activates next planned set in same block with prefill', () => {
    const state = makeRunning({
      blocks: [makeStrengthBlock({ sets: [active, planned2, planned3] })],
      selectedBlockIndex: 0,
      activeSetIndex: 0,
    })
    const { next } = reduce(state, {
      type: 'CompleteSet',
      set: active,
      useDurationValidation: false,
    })
    if (next.status !== 'running') throw new Error('expected running')
    expect(next.lastOutcome).toEqual({
      kind: 'completed',
      nextAction: 'next-set',
      blockIndex: 0,
      setId: 2,
    })
    const block = next.workout.blocks[0]
    if (!block || block.kind !== 'strength') throw new Error('expected strength')
    expect(block.sets[0]?.status).toBe('completed')
    expect(block.sets[1]?.status).toBe('active')
    expect(block.sets[1]?.kg).toBe('100') // prefilled from completed set
    expect(next.workout.activeSetIndex).toBe(1)
  })

  it('next-block: all sets in current block complete, advances to next block', () => {
    const state = makeRunning({
      blocks: [
        makeStrengthBlock({
          sets: [makeCompletedSet({ id: 1 }), active],
        }),
        makeStrengthBlock({ id: 2, sets: [makePlannedSet({ id: 1 })] }),
      ],
      selectedBlockIndex: 0,
    })
    const { next } = reduce(state, {
      type: 'CompleteSet',
      set: active,
      useDurationValidation: false,
    })
    if (next.status !== 'running') throw new Error('expected running')
    expect(next.lastOutcome).toEqual({
      kind: 'completed',
      nextAction: 'next-block',
      blockIndex: 1,
    })
    expect(next.workout.selectedBlockIndex).toBe(1)
  })

  it('next-block skip-ahead: next is already complete, jumps to first incomplete', () => {
    const state = makeRunning({
      blocks: [
        makeStrengthBlock({ id: 1, sets: [active] }),
        makeStrengthBlock({ id: 2, sets: [makeCompletedSet({ id: 1 })] }),
        makeStrengthBlock({ id: 3, sets: [makePlannedSet({ id: 1 })] }),
      ],
      selectedBlockIndex: 0,
    })
    const { next } = reduce(state, {
      type: 'CompleteSet',
      set: active,
      useDurationValidation: false,
    })
    if (next.status !== 'running') throw new Error('expected running')
    // Goes to next block (index 1) — findFirstIncompleteBlockIndex would skip completed
    // but sequential comes first, and block 1 IS already complete, so sequential still fires.
    // The cascade goes: try next-set (none), try next-block sequential (found at 1), success.
    expect(next.lastOutcome?.kind).toBe('completed')
  })

  it('workout-complete: final set of final block', () => {
    const onlyBlock = makeStrengthBlock({ sets: [active] })
    const state = makeRunning({ blocks: [onlyBlock], selectedBlockIndex: 0 })
    const { next } = reduce(state, {
      type: 'CompleteSet',
      set: active,
      useDurationValidation: false,
    })
    if (next.status !== 'running') throw new Error('expected running')
    expect(next.lastOutcome).toEqual({ kind: 'completed', nextAction: 'workout-complete' })
  })

  it('invalid: set with empty fields returns { kind: "invalid" } and does not mutate', () => {
    const badSet = makeSet({ kg: '', reps: '', rir: '', status: 'active' })
    const state = makeRunning({ blocks: [makeStrengthBlock({ sets: [badSet] })] })
    const { next, effects } = reduce(state, {
      type: 'CompleteSet',
      set: badSet,
      useDurationValidation: false,
    })
    if (next.status !== 'running') throw new Error('expected running')
    expect(next.lastOutcome).toEqual({ kind: 'invalid' })
    expect(effects).toHaveLength(0)
    // workout itself is unchanged
    expect(next.workout).toEqual(state.workout)
  })

  it('uncompleted: toggling completed set back to active', () => {
    const completed = makeCompletedSet({ id: 1 })
    const state = makeRunning({
      blocks: [makeStrengthBlock({ sets: [completed] })],
      selectedBlockIndex: 0,
    })
    const { next } = reduce(state, {
      type: 'CompleteSet',
      set: completed,
      useDurationValidation: false,
    })
    if (next.status !== 'running') throw new Error('expected running')
    expect(next.lastOutcome).toEqual({ kind: 'uncompleted' })
    const block = next.workout.blocks[0]
    if (!block || block.kind !== 'strength') throw new Error('expected strength')
    expect(block.sets[0]?.status).toBe('active')
  })

  it('duration validation: uses isSetReadyForDuration when flag set', () => {
    const durationSet = makeSet({ kg: '', reps: '', duration: '30', rir: '', status: 'active' })
    const state = makeRunning({
      blocks: [makeStrengthBlock({ sets: [durationSet, makePlannedSet({ id: 2 })] })],
    })
    const { next } = reduce(state, {
      type: 'CompleteSet',
      set: durationSet,
      useDurationValidation: true,
    })
    if (next.status !== 'running') throw new Error('expected running')
    expect(next.lastOutcome?.kind).toBe('completed')
  })
})

describe('isBlockComplete — cardio fix', () => {
  it('strength: all sets completed → true', () => {
    expect(isBlockComplete(makeStrengthBlock({ sets: [makeCompletedSet({ id: 1 })] }))).toBe(true)
  })
  it('strength: any planned/active → false', () => {
    expect(isBlockComplete(makeStrengthBlock())).toBe(false)
  })
  it('cardio with result → true (regression: was false before fix)', () => {
    const result: CardioResult = {
      actualDurationSeconds: 1800,
      distanceMeters: 5000,
      avgPaceSecondsPerKm: 360,
      calories: 300,
      notes: null,
    }
    expect(isBlockComplete(makeCardioBlock(result))).toBe(true)
  })
  it('cardio without result → false', () => {
    expect(isBlockComplete(makeCardioBlock(null))).toBe(false)
  })
  it('timed (amrap) with result → true', () => {
    expect(
      isBlockComplete(makeAmrapBlock({ rounds: 5, partialReps: 3, actualDuration: 600 })),
    ).toBe(true)
  })
  it('timed (amrap) without result → false', () => {
    expect(isBlockComplete(makeAmrapBlock(null))).toBe(false)
  })
})

describe('reduce — builder commands', () => {
  it('AddAmrapBlock appends and selects', () => {
    const { next, effects } = reduce(makeDraft({ blocks: [] }), {
      type: 'AddAmrapBlock',
      config: { durationSeconds: 600 },
      exercises: [],
    })
    if (next.status !== 'draft') throw new Error('expected draft')
    expect(next.workout.blocks).toHaveLength(1)
    expect(next.workout.blocks[0]?.kind).toBe('amrap')
    expect(next.workout.selectedBlockIndex).toBe(0)
    expect(effects).toEqual([{ kind: 'persist' }])
  })

  it('AddCardioBlock works', () => {
    const { next } = reduce(makeDraft({ blocks: [] }), {
      type: 'AddCardioBlock',
      config: { activity: 'running', targetDurationSeconds: null, targetDistanceMeters: null },
    })
    if (next.status !== 'draft') throw new Error('expected draft')
    expect(next.workout.blocks[0]?.kind).toBe('cardio')
  })

  it('RemoveBlock out-of-range is a no-op', () => {
    const state = makeDraft()
    const { next, effects } = reduce(state, { type: 'RemoveBlock', blockIndex: 99 })
    expect(next).toBe(state)
    expect(effects).toHaveLength(0)
  })

  it('RemoveBlock recalculates selected index when removing selected', () => {
    const state = makeDraft({
      blocks: [makeStrengthBlock({ id: 1 }), makeStrengthBlock({ id: 2 })],
      selectedBlockIndex: 0,
    })
    const { next } = reduce(state, { type: 'RemoveBlock', blockIndex: 0 })
    if (next.status !== 'draft') throw new Error('expected draft')
    expect(next.workout.blocks).toHaveLength(1)
    expect(next.workout.selectedBlockIndex).toBe(0)
  })

  it('RemoveBlock to empty → selectedBlockIndex = -1', () => {
    const { next } = reduce(makeDraft(), { type: 'RemoveBlock', blockIndex: 0 })
    if (next.status !== 'draft') throw new Error('expected draft')
    expect(next.workout.selectedBlockIndex).toBe(-1)
  })

  it('ReorderBlocks: moves selected block and tracks index', () => {
    const state = makeDraft({
      blocks: [
        makeStrengthBlock({ id: 1, name: 'A' }),
        makeStrengthBlock({ id: 2, name: 'B' }),
        makeStrengthBlock({ id: 3, name: 'C' }),
      ],
      selectedBlockIndex: 0,
    })
    const { next } = reduce(state, { type: 'ReorderBlocks', fromIndex: 0, toIndex: 2 })
    if (next.status !== 'draft') throw new Error('expected draft')
    expect(next.workout.blocks.map((b) => b.id)).toEqual([2, 3, 1])
    expect(next.workout.selectedBlockIndex).toBe(2)
  })

  it('AddSet appends a planned set', () => {
    const state = makeDraft({
      blocks: [makeStrengthBlock({ sets: [makeSet({ id: 1 })] })],
    })
    const { next } = reduce(state, { type: 'AddSet', blockIndex: 0 })
    if (next.status !== 'draft') throw new Error('expected draft')
    const block = next.workout.blocks[0]
    if (!block || block.kind !== 'strength') throw new Error('expected strength')
    expect(block.sets).toHaveLength(2)
    expect(block.sets[1]?.status).toBe('planned')
    expect(block.sets[1]?.id).toBe(2)
  })

  it('RemoveSet on single-set block is a no-op', () => {
    const state = makeDraft({
      blocks: [makeStrengthBlock({ sets: [makeSet({ id: 1 })] })],
    })
    const { next } = reduce(state, { type: 'RemoveSet', blockIndex: 0, setId: 1 })
    expect(next).toBe(state)
  })

  it('DuplicateSet inserts copy with new id and planned status', () => {
    const original = makeSet({ id: 1, kg: '80', reps: '5', rir: '1' })
    const state = makeDraft({
      blocks: [makeStrengthBlock({ sets: [original, makePlannedSet({ id: 2 })] })],
    })
    const { next } = reduce(state, { type: 'DuplicateSet', blockIndex: 0, setId: 1 })
    if (next.status !== 'draft') throw new Error('expected draft')
    const block = next.workout.blocks[0]
    if (!block || block.kind !== 'strength') throw new Error('expected strength')
    expect(block.sets).toHaveLength(3)
    expect(block.sets[1]?.kg).toBe('80')
    expect(block.sets[1]?.reps).toBe('5')
    expect(block.sets[1]?.status).toBe('planned')
  })

  it('SetSetCount grows and shrinks', () => {
    const stateWith1 = makeDraft({
      blocks: [makeStrengthBlock({ sets: [makeSet({ id: 1 })] })],
    })
    const { next: grown } = reduce(stateWith1, { type: 'SetSetCount', blockIndex: 0, count: 3 })
    if (grown.status !== 'draft') throw new Error('expected draft')
    const grownBlock = grown.workout.blocks[0]
    if (!grownBlock || grownBlock.kind !== 'strength') throw new Error('expected strength')
    expect(grownBlock.sets).toHaveLength(3)

    const { next: shrunk } = reduce(grown, { type: 'SetSetCount', blockIndex: 0, count: 1 })
    if (shrunk.status !== 'draft') throw new Error('expected draft')
    const shrunkBlock = shrunk.workout.blocks[0]
    if (!shrunkBlock || shrunkBlock.kind !== 'strength') throw new Error('expected strength')
    expect(shrunkBlock.sets).toHaveLength(1)
  })

  it('UpdateSetValue sets and clears (undefined → empty string)', () => {
    const state = makeDraft({
      blocks: [makeStrengthBlock({ sets: [makeSet({ id: 1, kg: '50' })] })],
    })
    const { next: set } = reduce(state, {
      type: 'UpdateSetValue',
      blockIndex: 0,
      setId: 1,
      field: 'kg',
      value: 90,
    })
    if (set.status !== 'draft') throw new Error('expected draft')
    const block = set.workout.blocks[0]
    if (!block || block.kind !== 'strength') throw new Error('expected strength')
    expect(block.sets[0]?.kg).toBe('90')

    const { next: cleared } = reduce(set, {
      type: 'UpdateSetValue',
      blockIndex: 0,
      setId: 1,
      field: 'kg',
      value: undefined,
    })
    if (cleared.status !== 'draft') throw new Error('expected draft')
    const clearedBlock = cleared.workout.blocks[0]
    if (!clearedBlock || clearedBlock.kind !== 'strength') throw new Error('expected strength')
    expect(clearedBlock.sets[0]?.kg).toBe('')
  })
})

describe('reduce — running commands', () => {
  it('SetBlockResult: amrap result lands on amrap block', () => {
    const state = makeRunning({
      blocks: [makeAmrapBlock()],
      selectedBlockIndex: 0,
    })
    const { next } = reduce(state, {
      type: 'SetBlockResult',
      blockIndex: 0,
      result: { rounds: 5, partialReps: 3, actualDuration: 600 },
    })
    if (next.status !== 'running') throw new Error('expected running')
    const block = next.workout.blocks[0]
    if (!block || block.kind !== 'amrap') throw new Error('expected amrap')
    expect(block.result).toEqual({ rounds: 5, partialReps: 3, actualDuration: 600 })
  })

  it('SetBlockResult: mismatched shape (emom on amrap block) is a no-op', () => {
    const state = makeRunning({ blocks: [makeAmrapBlock()], selectedBlockIndex: 0 })
    const { next, effects } = reduce(state, {
      type: 'SetBlockResult',
      blockIndex: 0,
      result: { completedMinutes: 8, missedMinutes: [] },
    })
    expect(next).toBe(state)
    expect(effects).toHaveLength(0)
  })

  it('SetCardioResult: writes to cardio block', () => {
    const result: CardioResult = {
      actualDurationSeconds: 1200,
      distanceMeters: 3000,
      avgPaceSecondsPerKm: 400,
      calories: 200,
      notes: null,
    }
    const state = makeRunning({ blocks: [makeCardioBlock()], selectedBlockIndex: 0 })
    const { next } = reduce(state, { type: 'SetCardioResult', blockIndex: 0, result })
    if (next.status !== 'running') throw new Error('expected running')
    const block = next.workout.blocks[0]
    if (!block || block.kind !== 'cardio') throw new Error('expected cardio')
    expect(block.result).toEqual(result)
  })

  it('ActivateSet only acts on planned sets', () => {
    const completed = makeCompletedSet({ id: 1 })
    const state = makeRunning({
      blocks: [makeStrengthBlock({ sets: [completed, makePlannedSet({ id: 2 })] })],
    })
    const { next: noop } = reduce(state, { type: 'ActivateSet', blockIndex: 0, setIndex: 0 })
    expect(noop).toBe(state) // completed set ignored

    const { next: activated } = reduce(state, {
      type: 'ActivateSet',
      blockIndex: 0,
      setIndex: 1,
    })
    if (activated.status !== 'running') throw new Error('expected running')
    expect(activated.workout.activeSetIndex).toBe(1)
    const block = activated.workout.blocks[0]
    if (!block || block.kind !== 'strength') throw new Error('expected strength')
    expect(block.sets[1]?.status).toBe('active')
  })

  it('JumpTo on strength block finds first incomplete set and activates it', () => {
    const state = makeRunning({
      blocks: [
        makeStrengthBlock({ id: 1 }),
        makeStrengthBlock({
          id: 2,
          sets: [makeCompletedSet({ id: 1 }), makePlannedSet({ id: 2 })],
        }),
      ],
      selectedBlockIndex: 0,
    })
    const { next } = reduce(state, { type: 'JumpTo', blockIndex: 1 })
    if (next.status !== 'running') throw new Error('expected running')
    expect(next.workout.selectedBlockIndex).toBe(1)
    expect(next.workout.activeSetIndex).toBe(1)
    const landed = next.workout.blocks[1]
    if (!landed || landed.kind !== 'strength') throw new Error('expected strength')
    expect(landed.sets[1]?.status).toBe('active')
  })

  it('JumpTo onto a fully-complete strength block leaves statuses untouched', () => {
    const state = makeRunning({
      blocks: [
        makeStrengthBlock({ id: 1 }),
        makeStrengthBlock({ id: 2, sets: [makeCompletedSet({ id: 1 })] }),
      ],
      selectedBlockIndex: 0,
    })
    const { next } = reduce(state, { type: 'JumpTo', blockIndex: 1 })
    if (next.status !== 'running') throw new Error('expected running')
    expect(next.workout.selectedBlockIndex).toBe(1)
    expect(next.workout.activeSetIndex).toBeNull()
    const landed = next.workout.blocks[1]
    if (!landed || landed.kind !== 'strength') throw new Error('expected strength')
    expect(landed.sets[0]?.status).toBe('completed')
  })
})

describe('reduce — illegal commands are no-ops', () => {
  it('CompleteSet in draft is a no-op', () => {
    const state = makeDraft()
    const { next, effects } = reduce(state, {
      type: 'CompleteSet',
      set: makeSet(),
      useDurationValidation: false,
    })
    expect(next).toBe(state)
    expect(effects).toHaveLength(0)
  })

  it('AddBlock in empty state is a no-op', () => {
    const { next, effects } = reduce(
      { status: 'empty' },
      { type: 'AddCardioBlock', config: { activity: 'running', targetDurationSeconds: null, targetDistanceMeters: null } },
    )
    expect(next).toEqual({ status: 'empty' })
    expect(effects).toHaveLength(0)
  })
})

describe('bucketFor', () => {
  it('builder mode → draft', () => {
    expect(bucketFor(makeWorkout({ mode: 'builder' })).status).toBe('draft')
  })
  it('active mode → running with null lastOutcome', () => {
    const result = bucketFor(makeWorkout({ mode: 'active' }))
    expect(result.status).toBe('running')
    if (result.status === 'running') expect(result.lastOutcome).toBeNull()
  })
  it('completed mode → completed', () => {
    expect(bucketFor(makeWorkout({ mode: 'completed' })).status).toBe('completed')
  })
})

describe('emptyWorkout', () => {
  it('has startedAt = 0 (not Date.now)', () => {
    expect(emptyWorkout().startedAt).toBe(0)
  })
  it('has builder mode, no blocks, no selection', () => {
    const w = emptyWorkout()
    expect(w.mode).toBe('builder')
    expect(w.blocks).toHaveLength(0)
    expect(w.selectedBlockIndex).toBe(-1)
    expect(w.activeSetIndex).toBeNull()
  })
})
