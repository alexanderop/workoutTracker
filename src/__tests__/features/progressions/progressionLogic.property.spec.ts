import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import type { DbProgression } from '@/db/schema'
import type { ProgressionPhase } from '@/features/progressions/types'
import {
  calculateNextLevel,
  calculateProgress,
  calculateTotalSessions,
  getCurrentLevel,
  getProgressionPhase,
} from '@/features/progressions/lib/progressionLogic'

/**
 * Property-based tests for the kettlebell swing progression state machine.
 *
 * The progression advances reps -> time -> weight. These properties simulate
 * entire runs by feeding `calculateNextLevel` back into the state, checking
 * that the run terminates, never moves backward, and that the derived
 * progress percentage stays inside [0, 100] (the clamp guards against
 * `sessionsCompleted` overshooting the analytic total, which is reachable
 * via failed sessions and via increments that do not divide the ranges).
 */

// ============================================
// Simulation model
// ============================================

type ProgressionConfig = {
  startReps: number
  maxReps: number
  repIncrement: number
  startMinutes: number
  maxMinutes: number
  minuteIncrement: number
  availableWeights: ReadonlyArray<number>
}

type SimState = {
  reps: number
  minutes: number
  weightIndex: number
  isComplete: boolean
  sessionsCompleted: number
}

function toProgression(config: ProgressionConfig, state: SimState): DbProgression {
  return {
    id: 'progression-under-test',
    name: 'Property progression',
    availableWeights: config.availableWeights,
    currentWeightIndex: state.weightIndex,
    currentReps: state.reps,
    currentMinutes: state.minutes,
    startReps: config.startReps,
    maxReps: config.maxReps,
    repIncrement: config.repIncrement,
    startMinutes: config.startMinutes,
    maxMinutes: config.maxMinutes,
    minuteIncrement: config.minuteIncrement,
    sessionsCompleted: state.sessionsCompleted,
    isComplete: state.isComplete,
    createdAt: 0,
    lastSessionAt: null,
  }
}

function initialState(config: ProgressionConfig): SimState {
  return {
    reps: config.startReps,
    minutes: config.startMinutes,
    weightIndex: 0,
    isComplete: false,
    sessionsCompleted: 0,
  }
}

/**
 * The analytic session total. Checked against the simulated state machine,
 * which walks `calculateNextLevel` step by step — an independent code path.
 */
function expectedTotalSessions(config: ProgressionConfig): number {
  return calculateTotalSessions(toProgression(config, initialState(config)))
}

function advance(config: ProgressionConfig, state: SimState): SimState {
  const next = calculateNextLevel(toProgression(config, state))
  return {
    reps: next.reps,
    minutes: next.minutes,
    weightIndex: next.weightIndex,
    isComplete: next.isComplete,
    sessionsCompleted: state.sessionsCompleted + 1,
  }
}

/**
 * Apply `calculateNextLevel` until completion, returning every state
 * including the initial one. Throws past `maxSteps` (termination guard).
 */
function runSimulation(config: ProgressionConfig, maxSteps: number): Array<SimState> {
  let current = initialState(config)
  const states: Array<SimState> = [current]
  while (!current.isComplete) {
    if (current.sessionsCompleted >= maxSteps) {
      throw new Error(`Simulation did not terminate within ${maxSteps} steps`)
    }
    current = advance(config, current)
    states.push(current)
  }
  return states
}

function terminationCap(config: ProgressionConfig): number {
  return Math.ceil(10 * expectedTotalSessions(config)) + 10
}

function stepsOf(states: ReadonlyArray<SimState>): Array<{ from: SimState; to: SimState }> {
  const steps: Array<{ from: SimState; to: SimState }> = []
  for (let index = 1; index < states.length; index += 1) {
    const from = states[index - 1]
    const to = states[index]
    if (from && to) steps.push({ from, to })
  }
  return steps
}

// ============================================
// Arbitraries
// ============================================

const incrementArb = fc.integer({ min: 1, max: 5 })
const quotientArb = fc.integer({ min: 0, max: 5 })
const startRepsArb = fc.integer({ min: 5, max: 20 })
const startMinutesArb = fc.integer({ min: 5, max: 15 })

function stepsToAscendingWeights(steps: ReadonlyArray<number>): Array<number> {
  const weights: Array<number> = []
  let current = 4
  for (const step of steps) {
    current += step
    weights.push(current)
  }
  return weights
}

const weightStepsArb = fc.array(fc.integer({ min: 1, max: 8 }), { minLength: 1, maxLength: 4 })
const weightsArb = weightStepsArb.map(stepsToAscendingWeights)

type DividingSeed = {
  startReps: number
  startMinutes: number
  repIncrement: number
  minuteIncrement: number
  repQuotient: number
  minuteQuotient: number
  availableWeights: Array<number>
}

/** Derives maxes so the increments divide the rep/minute ranges exactly. */
function dividingSeedToConfig(seed: DividingSeed): ProgressionConfig {
  return {
    startReps: seed.startReps,
    maxReps: seed.startReps + seed.repIncrement * seed.repQuotient,
    repIncrement: seed.repIncrement,
    startMinutes: seed.startMinutes,
    maxMinutes: seed.startMinutes + seed.minuteIncrement * seed.minuteQuotient,
    minuteIncrement: seed.minuteIncrement,
    availableWeights: seed.availableWeights,
  }
}

const dividingSeedArb = fc.record({
  startReps: startRepsArb,
  startMinutes: startMinutesArb,
  repIncrement: incrementArb,
  minuteIncrement: incrementArb,
  repQuotient: quotientArb,
  minuteQuotient: quotientArb,
  availableWeights: weightsArb,
})

const dividingConfigArb = dividingSeedArb.map(dividingSeedToConfig)

type SpanSeed = {
  startReps: number
  repSpan: number
  repIncrement: number
  startMinutes: number
  minuteSpan: number
  minuteIncrement: number
  availableWeights: Array<number>
}

/** Spans are arbitrary, so increments may not divide the ranges. */
function spanSeedToConfig(seed: SpanSeed): ProgressionConfig {
  return {
    startReps: seed.startReps,
    maxReps: seed.startReps + seed.repSpan,
    repIncrement: seed.repIncrement,
    startMinutes: seed.startMinutes,
    maxMinutes: seed.startMinutes + seed.minuteSpan,
    minuteIncrement: seed.minuteIncrement,
    availableWeights: seed.availableWeights,
  }
}

const unconstrainedSeedArb = fc.record({
  startReps: startRepsArb,
  repSpan: fc.integer({ min: 0, max: 12 }),
  repIncrement: fc.integer({ min: 1, max: 7 }),
  startMinutes: startMinutesArb,
  minuteSpan: fc.integer({ min: 0, max: 12 }),
  minuteIncrement: fc.integer({ min: 1, max: 7 }),
  availableWeights: weightsArb,
})

const unconstrainedConfigArb = unconstrainedSeedArb.map(spanSeedToConfig)

// ============================================
// Assertion helpers
// ============================================

function assertMonotonicStep(config: ProgressionConfig, from: SimState, to: SimState): void {
  expect(to.weightIndex).toBeGreaterThanOrEqual(from.weightIndex)
  if (to.weightIndex > from.weightIndex) {
    expect(to.weightIndex).toBe(from.weightIndex + 1)
    expect(to.reps).toBe(config.startReps)
    expect(to.minutes).toBe(config.startMinutes)
    return
  }
  const lexOk = to.minutes > from.minutes || (to.minutes === from.minutes && to.reps >= from.reps)
  expect(lexOk).toBe(true)
}

function progressAlongRun(
  config: ProgressionConfig,
  states: ReadonlyArray<SimState>,
): Array<number> {
  return states.map((state) => calculateProgress(toProgression(config, state)))
}

function expectedPhase(progression: DbProgression): ProgressionPhase {
  if (progression.isComplete) return 'complete'
  if (progression.currentReps < progression.maxReps) return 'reps'
  return 'time'
}

// ============================================
// Properties
// ============================================

describe('progressionLogic (property-based)', () => {
  // One simulation per sample: session count, monotonic stepping, and the
  // progress invariants are all checkable from the same run of states.
  it('a well-formed run completes in exactly the computed sessions, never moves backward, and progress climbs 0→100', () => {
    fc.assert(
      fc.property(dividingConfigArb, (config) => {
        const states = runSimulation(config, terminationCap(config))

        // Completes after exactly the analytic total
        const expected = expectedTotalSessions(config)
        expect(states).toHaveLength(expected + 1)
        const finalState = states.at(-1)
        expect(finalState?.isComplete).toBe(true)
        expect(finalState?.sessionsCompleted).toBe(expected)

        // Never moves backward: (weightIndex, minutes, reps) only resets at a weight bump
        for (const { from, to } of stepsOf(states)) {
          assertMonotonicStep(config, from, to)
        }

        // Progress is non-decreasing, within [0, 100], and hits 100 exactly on completion
        const values = progressAlongRun(config, states)
        for (const [index, state] of states.entries()) {
          const progress = values[index] ?? -1
          expect(progress).toBeGreaterThanOrEqual(0)
          expect(progress).toBeLessThanOrEqual(100)
          expect(progress).toBeGreaterThanOrEqual(values[index - 1] ?? 0)
          expect(progress === 100).toBe(state.isComplete)
        }
      }),
    )
  })

  it('terminates with progress <= 100 and a consistent phase even for non-dividing increments', () => {
    fc.assert(
      fc.property(unconstrainedConfigArb, (config) => {
        const states = runSimulation(config, terminationCap(config))
        for (const state of states) {
          const progression = toProgression(config, state)
          const progress = calculateProgress(progression)
          expect(progress).toBeGreaterThanOrEqual(0)
          expect(progress).toBeLessThanOrEqual(100)
          expect(getProgressionPhase(progression)).toBe(expectedPhase(progression))
        }
      }),
    )
  })

  it('getCurrentLevel resolves weights for valid indexes and falls back to 0 out of range', () => {
    fc.assert(
      fc.property(dividingConfigArb, fc.integer({ min: 0, max: 100 }), (config, raw) => {
        const validIndex = raw % config.availableWeights.length
        const state = { ...initialState(config), weightIndex: validIndex }
        const level = getCurrentLevel(toProgression(config, state))
        expect(level.weight).toBe(config.availableWeights[validIndex])
        expect(Number.isFinite(level.weight)).toBe(true)
        const outOfRange = { ...state, weightIndex: config.availableWeights.length + raw }
        const outOfRangeLevel = getCurrentLevel(toProgression(config, outOfRange))
        expect(outOfRangeLevel.weight).toBe(0)
      }),
    )
  })

  // Regression pin for the clamp fix: sessionsCompleted can exceed the
  // analytic total (failed sessions still increment it, and non-dividing
  // increments make the formula undercount), so progress must cap at 100.
  it('clamps progress to 100 when sessionsCompleted overshoots the computed total', () => {
    const overshoot: DbProgression = {
      id: 'regression-clamp',
      name: 'Overshoot regression',
      availableWeights: [16],
      currentWeightIndex: 0,
      currentReps: 12,
      currentMinutes: 10,
      startReps: 10,
      maxReps: 13,
      repIncrement: 2,
      startMinutes: 10,
      maxMinutes: 13,
      minuteIncrement: 2,
      sessionsCompleted: 6,
      isComplete: false,
      createdAt: 0,
      lastSessionAt: null,
    }
    // Analytic total = (3/2 + 1) + 3/2 = 4 sessions; uncapped this yields
    // round((6 / 4) * 100) = 150.
    expect(calculateProgress(overshoot)).toBe(100)
  })
})
