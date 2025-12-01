import type { DbTemplateStrengthBlock, DbWorkoutTemplate } from '@/db/schema'
import { generateId } from '@/db'

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
