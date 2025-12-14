import type {
  DbAmrapBlock,
  DbAmrapResult,
  DbBlockExercise,
  DbForTimeBlock,
  DbForTimeResult,
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
    thumbnail: '🏋️',
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
