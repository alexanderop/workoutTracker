import type {
  DbAmrapBlock,
  DbAmrapResult,
  DbBlockExercise,
  DbCardioBlock,
  DbCardioResult,
  DbEmomBlock,
  DbEmomResult,
  DbForTimeBlock,
  DbForTimeResult,
  DbTabataBlock,
  DbTabataResult,
} from '@/db/schema'
import { generateId } from '@/db'

// ============================================
// Block Exercise (shared by all timed blocks)
// ============================================

export function createDbBlockExercise(
  overrides: Partial<DbBlockExercise> = {},
): DbBlockExercise {
  return {
    id: generateId(),
    name: 'Thrusters',
    prescribedReps: 21,
    load: null,
    image: null,
    ...overrides,
  }
}

// ============================================
// ForTime Block
// ============================================

const FORTIME_DEFAULTS: Readonly<Omit<DbForTimeBlock, 'id' | 'exercises'>> = {
  kind: 'fortime',
  config: { timeCapSeconds: null },
  result: null,
  orderIndex: 0,
}

export function createDbForTimeBlock(
  overrides: Partial<DbForTimeBlock> = {},
): DbForTimeBlock {
  return {
    id: generateId(),
    ...FORTIME_DEFAULTS,
    exercises: [createDbBlockExercise()],
    ...overrides,
  }
}

export function createDbForTimeResult(
  overrides: Partial<DbForTimeResult> = {},
): DbForTimeResult {
  return {
    completionTime: 180,
    completed: true,
    splitTimes: [],
    ...overrides,
  }
}

// ============================================
// AMRAP Block
// ============================================

const AMRAP_DEFAULTS: Readonly<Omit<DbAmrapBlock, 'id' | 'exercises'>> = {
  kind: 'amrap',
  config: { durationSeconds: 600 },
  result: null,
  orderIndex: 0,
}

export function createDbAmrapBlock(
  overrides: Partial<DbAmrapBlock> = {},
): DbAmrapBlock {
  return {
    id: generateId(),
    ...AMRAP_DEFAULTS,
    exercises: [createDbBlockExercise()],
    ...overrides,
  }
}

export function createDbAmrapResult(
  overrides: Partial<DbAmrapResult> = {},
): DbAmrapResult {
  return {
    rounds: 5,
    partialReps: 3,
    actualDuration: 600,
    ...overrides,
  }
}

// ============================================
// EMOM Block
// ============================================

const EMOM_DEFAULTS: Readonly<Omit<DbEmomBlock, 'id' | 'exercises'>> = {
  kind: 'emom',
  config: { minutes: 12, exerciseRotation: 'each-minute' },
  result: null,
  orderIndex: 0,
}

export function createDbEmomBlock(
  overrides: Partial<DbEmomBlock> = {},
): DbEmomBlock {
  return {
    id: generateId(),
    ...EMOM_DEFAULTS,
    exercises: [createDbBlockExercise({ name: 'Kettlebell Swings', prescribedReps: 10 })],
    ...overrides,
  }
}

export function createDbEmomResult(
  overrides: Partial<DbEmomResult> = {},
): DbEmomResult {
  return {
    completedMinutes: 12,
    missedMinutes: [],
    ...overrides,
  }
}

// ============================================
// Tabata Block
// ============================================

const TABATA_DEFAULTS: Readonly<Omit<DbTabataBlock, 'id' | 'exercise'>> = {
  kind: 'tabata',
  config: { rounds: 8, workSeconds: 20, restSeconds: 10 },
  result: null,
  orderIndex: 0,
}

export function createDbTabataBlock(
  overrides: Partial<DbTabataBlock> = {},
): DbTabataBlock {
  return {
    id: generateId(),
    ...TABATA_DEFAULTS,
    exercise: createDbBlockExercise({ name: 'Air Squats', prescribedReps: 0 }),
    ...overrides,
  }
}

export function createDbTabataResult(
  overrides: Partial<DbTabataResult> = {},
): DbTabataResult {
  return {
    repsPerRound: [15, 14, 13, 12, 11, 10, 10, 9],
    ...overrides,
  }
}

// ============================================
// Cardio Block
// ============================================

const CARDIO_DEFAULTS: Readonly<Omit<DbCardioBlock, 'id'>> = {
  kind: 'cardio',
  config: {
    activity: 'running',
    targetDurationSeconds: null,
    targetDistanceMeters: null,
  },
  result: null,
  orderIndex: 0,
}

export function createDbCardioBlock(
  overrides: Partial<DbCardioBlock> = {},
): DbCardioBlock {
  return {
    id: generateId(),
    ...CARDIO_DEFAULTS,
    ...overrides,
  }
}

export function createDbCardioResult(
  overrides: Partial<DbCardioResult> = {},
): DbCardioResult {
  return {
    actualDurationSeconds: 1800,
    distanceMeters: 5000,
    avgPaceSecondsPerKm: 360,
    calories: 350,
    notes: null,
    ...overrides,
  }
}
