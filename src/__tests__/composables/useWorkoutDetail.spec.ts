import { describe, expect, it } from 'vitest'
import type { DbCompletedWorkout, DbSet, DbStrengthBlock, DbWorkoutBlock } from '@/db/schema'
import {
  calculateTotalWeight,
  computeWorkoutStats,
  getCompletedSets,
} from '@/composables/useWorkoutDetail'

// ============================================
// Test Factories
// ============================================

function createSet(overrides: Partial<DbSet> = {}): DbSet {
  return {
    id: 'set-1',
    kg: '0',
    reps: '0',
    rir: '0',
    status: 'planned',
    completedAt: null,
    ...overrides,
  }
}

function createStrengthBlock(
  overrides: Partial<DbStrengthBlock> & { sets?: ReadonlyArray<DbSet> } = {},
): DbStrengthBlock {
  return {
    kind: 'strength',
    id: 'block-1',
    exerciseDefinitionId: 'def-1',
    name: 'Bench Press',
    equipment: 'barbell',
    targetReps: 10,
    thumbnail: '',
    sets: [],
    orderIndex: 0,
    ...overrides,
  }
}

function createWorkout(overrides: Partial<DbCompletedWorkout> = {}): DbCompletedWorkout {
  return {
    id: 'workout-1',
    name: 'Test Workout',
    blocks: [],
    startedAt: Date.now(),
    completedAt: Date.now(),
    durationSeconds: 3600,
    notes: '',
    ...overrides,
  }
}

// ============================================
// Pure Function Tests
// ============================================

describe('getCompletedSets', () => {
  it('returns empty array when no blocks', () => {
    const result = getCompletedSets([])
    expect(result).toEqual([])
  })

  it('returns empty array when no sets are completed', () => {
    const blocks: ReadonlyArray<DbWorkoutBlock> = [
      createStrengthBlock({
        sets: [createSet({ status: 'planned' }), createSet({ status: 'planned' })],
      }),
    ]

    const result = getCompletedSets(blocks)
    expect(result).toEqual([])
  })

  it('returns only completed sets', () => {
    const completedSet = createSet({ id: 'completed-1', status: 'completed' })
    const plannedSet = createSet({ id: 'planned-1', status: 'planned' })

    const blocks: ReadonlyArray<DbWorkoutBlock> = [
      createStrengthBlock({ sets: [completedSet, plannedSet] }),
    ]

    const result = getCompletedSets(blocks)

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('completed-1')
  })

  it('returns completed sets from multiple blocks', () => {
    const blocks: ReadonlyArray<DbWorkoutBlock> = [
      createStrengthBlock({
        id: 'block-1',
        sets: [
          createSet({ id: 'set-1', status: 'completed' }),
          createSet({ id: 'set-2', status: 'planned' }),
        ],
      }),
      createStrengthBlock({
        id: 'block-2',
        sets: [
          createSet({ id: 'set-3', status: 'completed' }),
          createSet({ id: 'set-4', status: 'completed' }),
        ],
      }),
    ]

    const result = getCompletedSets(blocks)

    expect(result).toHaveLength(3)
    expect(result.map((s) => s.id)).toEqual(['set-1', 'set-3', 'set-4'])
  })
})

describe('calculateTotalWeight', () => {
  it('returns 0 for empty array', () => {
    expect(calculateTotalWeight([])).toBe(0)
  })

  it('calculates weight as kg × reps for single set', () => {
    const sets = [createSet({ kg: '100', reps: '10' })]
    expect(calculateTotalWeight(sets)).toBe(1000)
  })

  it('sums weight across multiple sets', () => {
    const sets = [
      createSet({ kg: '100', reps: '10' }), // 1000
      createSet({ kg: '80', reps: '12' }), // 960
      createSet({ kg: '60', reps: '15' }), // 900
    ]
    expect(calculateTotalWeight(sets)).toBe(2860)
  })

  it('handles string number parsing correctly', () => {
    const sets = [createSet({ kg: '75.5', reps: '8' })]
    expect(calculateTotalWeight(sets)).toBe(604)
  })

  it('treats invalid kg as 0', () => {
    const sets = [createSet({ kg: 'invalid', reps: '10' })]
    expect(calculateTotalWeight(sets)).toBe(0)
  })

  it('treats invalid reps as 0', () => {
    const sets = [createSet({ kg: '100', reps: 'invalid' })]
    expect(calculateTotalWeight(sets)).toBe(0)
  })

  it('treats empty strings as 0', () => {
    const sets = [createSet({ kg: '', reps: '' })]
    expect(calculateTotalWeight(sets)).toBe(0)
  })

  it('rounds result to nearest integer', () => {
    const sets = [createSet({ kg: '33.33', reps: '3' })] // 99.99
    expect(calculateTotalWeight(sets)).toBe(100)
  })
})

describe('computeWorkoutStats', () => {
  it('returns duration from workout', () => {
    const workout = createWorkout({ durationSeconds: 5400 })
    const stats = computeWorkoutStats(workout)
    expect(stats.duration).toBe(5400)
  })

  it('counts strength blocks as exercises', () => {
    const workout = createWorkout({
      blocks: [
        createStrengthBlock({ id: 'block-1' }),
        createStrengthBlock({ id: 'block-2' }),
        createStrengthBlock({ id: 'block-3' }),
      ],
    })
    const stats = computeWorkoutStats(workout)
    expect(stats.exerciseCount).toBe(3)
  })

  it('counts only completed sets', () => {
    const workout = createWorkout({
      blocks: [
        createStrengthBlock({
          sets: [
            createSet({ status: 'completed' }),
            createSet({ status: 'completed' }),
            createSet({ status: 'planned' }),
          ],
        }),
      ],
    })
    const stats = computeWorkoutStats(workout)
    expect(stats.setCount).toBe(2)
  })

  it('calculates total weight from completed sets only', () => {
    const workout = createWorkout({
      blocks: [
        createStrengthBlock({
          sets: [
            createSet({ kg: '100', reps: '10', status: 'completed' }), // 1000
            createSet({ kg: '200', reps: '5', status: 'planned' }), // not counted
          ],
        }),
      ],
    })
    const stats = computeWorkoutStats(workout)
    expect(stats.totalWeight).toBe(1000)
  })

  it('returns complete stats object', () => {
    const workout = createWorkout({
      durationSeconds: 3600,
      blocks: [
        createStrengthBlock({
          sets: [
            createSet({ kg: '100', reps: '10', status: 'completed' }),
            createSet({ kg: '100', reps: '8', status: 'completed' }),
          ],
        }),
        createStrengthBlock({
          sets: [createSet({ kg: '50', reps: '12', status: 'completed' })],
        }),
      ],
    })

    const stats = computeWorkoutStats(workout)

    expect(stats).toEqual({
      duration: 3600,
      exerciseCount: 2,
      setCount: 3,
      totalWeight: 2400, // 1000 + 800 + 600
      timedBlockCount: 0,
      totalRounds: 0,
    })
  })
})
