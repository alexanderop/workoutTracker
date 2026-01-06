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
  image: null,
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
  equipment: 'barbell',
  targetReps: 8,
  targetDuration: null,
  targetWeight: null,
  image: null,
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

type DatabaseTemplateAmrapBlock = Extract<DbTemplateBlock, { kind: 'amrap' }>

export function createDbTemplateAmrapBlock(
  overrides: Partial<Omit<DatabaseTemplateAmrapBlock, 'kind'>> = {},
): DatabaseTemplateAmrapBlock {
  return {
    kind: 'amrap',
    config: overrides.config ?? { durationSeconds: 600 },
    exercises: overrides.exercises ?? [createDbTemplateBlockExercise()],
  }
}

// ============================================
// EMOM Block
// ============================================

type DatabaseTemplateEmomBlock = Extract<DbTemplateBlock, { kind: 'emom' }>

export function createDbTemplateEmomBlock(
  overrides: Partial<Omit<DatabaseTemplateEmomBlock, 'kind'>> = {},
): DatabaseTemplateEmomBlock {
  return {
    kind: 'emom',
    config: overrides.config ?? { minutes: 10, exerciseRotation: 'full-round' },
    exercises: overrides.exercises ?? [createDbTemplateBlockExercise()],
  }
}

// ============================================
// Tabata Block
// ============================================

type DatabaseTemplateTabataBlock = Extract<DbTemplateBlock, { kind: 'tabata' }>

export function createDbTemplateTabataBlock(
  overrides: Partial<Omit<DatabaseTemplateTabataBlock, 'kind'>> = {},
): DatabaseTemplateTabataBlock {
  return {
    kind: 'tabata',
    config: overrides.config ?? { rounds: 8, workSeconds: 20, restSeconds: 10 },
    exercise: overrides.exercise ?? createDbTemplateBlockExercise(),
  }
}

// ============================================
// ForTime Block
// ============================================

type DatabaseTemplateForTimeBlock = Extract<DbTemplateBlock, { kind: 'fortime' }>

export function createDbTemplateForTimeBlock(
  overrides: Partial<Omit<DatabaseTemplateForTimeBlock, 'kind'>> = {},
): DatabaseTemplateForTimeBlock {
  return {
    kind: 'fortime',
    config: overrides.config ?? { timeCapSeconds: 900 },
    exercises: overrides.exercises ?? [createDbTemplateBlockExercise()],
  }
}

// ============================================
// Cardio Block
// ============================================

type DatabaseTemplateCardioBlock = Extract<DbTemplateBlock, { kind: 'cardio' }>

export function createDbTemplateCardioBlock(
  overrides: Partial<Omit<DatabaseTemplateCardioBlock, 'kind'>> = {},
): DatabaseTemplateCardioBlock {
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
