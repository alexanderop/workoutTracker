import type {
  DbTemplateBlockExercise,
  DbTemplateStrengthBlock,
  DbTemplateBlock,
  DbWorkoutTemplate,
} from '@/db/schema'
import { generateId } from '@/db'

// ============================================
// Template Block Exercise
// ============================================

const TEMPLATE_BLOCK_EXERCISE_DEFAULTS: Readonly<DbTemplateBlockExercise> = {
  exerciseDefinitionId: null,
  name: 'Burpees',
  prescribedReps: 10,
  load: null,
  thumbnail: '🔥',
}

export function createDbTemplateBlockExercise(
  overrides: Partial<DbTemplateBlockExercise> = {},
): DbTemplateBlockExercise {
  return {
    ...TEMPLATE_BLOCK_EXERCISE_DEFAULTS,
    ...overrides,
  }
}

// ============================================
// Strength Block
// ============================================

const TEMPLATE_STRENGTH_BLOCK_DEFAULTS: Readonly<DbTemplateStrengthBlock> = {
  kind: 'strength',
  exerciseDefinitionId: null,
  name: 'Bench Press',
  equipment: 'Barbell',
  targetReps: 8,
  thumbnail: '🏋️',
  defaultSetCount: 3,
}

export function createDbTemplateStrengthBlock(
  overrides: Partial<DbTemplateStrengthBlock> = {},
): DbTemplateStrengthBlock {
  return {
    ...TEMPLATE_STRENGTH_BLOCK_DEFAULTS,
    ...overrides,
  }
}

// ============================================
// AMRAP Block
// ============================================

type DbTemplateAmrapBlock = Extract<DbTemplateBlock, { kind: 'amrap' }>

export function createDbTemplateAmrapBlock(
  overrides: Partial<Omit<DbTemplateAmrapBlock, 'kind'>> = {},
): DbTemplateAmrapBlock {
  return {
    kind: 'amrap',
    config: overrides.config ?? { durationSeconds: 600 },
    exercises: overrides.exercises ?? [createDbTemplateBlockExercise()],
  }
}

// ============================================
// EMOM Block
// ============================================

type DbTemplateEmomBlock = Extract<DbTemplateBlock, { kind: 'emom' }>

export function createDbTemplateEmomBlock(
  overrides: Partial<Omit<DbTemplateEmomBlock, 'kind'>> = {},
): DbTemplateEmomBlock {
  return {
    kind: 'emom',
    config: overrides.config ?? { minutes: 10, exerciseRotation: 'full-round' },
    exercises: overrides.exercises ?? [createDbTemplateBlockExercise()],
  }
}

// ============================================
// Tabata Block
// ============================================

type DbTemplateTabataBlock = Extract<DbTemplateBlock, { kind: 'tabata' }>

export function createDbTemplateTabataBlock(
  overrides: Partial<Omit<DbTemplateTabataBlock, 'kind'>> = {},
): DbTemplateTabataBlock {
  return {
    kind: 'tabata',
    config: overrides.config ?? { rounds: 8, workSeconds: 20, restSeconds: 10 },
    exercise: overrides.exercise ?? createDbTemplateBlockExercise(),
  }
}

// ============================================
// ForTime Block
// ============================================

type DbTemplateForTimeBlock = Extract<DbTemplateBlock, { kind: 'fortime' }>

export function createDbTemplateForTimeBlock(
  overrides: Partial<Omit<DbTemplateForTimeBlock, 'kind'>> = {},
): DbTemplateForTimeBlock {
  return {
    kind: 'fortime',
    config: overrides.config ?? { timeCapSeconds: 900 },
    exercises: overrides.exercises ?? [createDbTemplateBlockExercise()],
  }
}

// ============================================
// Cardio Block
// ============================================

type DbTemplateCardioBlock = Extract<DbTemplateBlock, { kind: 'cardio' }>

export function createDbTemplateCardioBlock(
  overrides: Partial<Omit<DbTemplateCardioBlock, 'kind'>> = {},
): DbTemplateCardioBlock {
  return {
    kind: 'cardio',
    config: overrides.config ?? {
      activity: 'running',
      targetDurationSeconds: 1800,
      targetDistanceMeters: 5000,
    },
  }
}

export function createDbTemplate(overrides: Partial<DbWorkoutTemplate> = {}): DbWorkoutTemplate {
  return {
    id: generateId(),
    name: 'Test Template',
    blocks: overrides.blocks ?? [createDbTemplateStrengthBlock()],
    createdAt: Date.now(),
    lastUsedAt: null,
    tags: [],
    ...overrides,
  }
}
