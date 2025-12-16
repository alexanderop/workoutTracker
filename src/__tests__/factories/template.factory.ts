import type { DbTemplateHeader, DbTemplateStrengthBlock, DbWorkoutTemplate } from '@/db/schema'
import { generateId, getTemplatesRepository } from '@/db'

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

/**
 * Creates a DbTemplateHeader (header-only, no blocks).
 * Use for direct table assertions or when blocks aren't needed.
 */
export function createDbTemplateHeader(
  overrides: Partial<DbTemplateHeader> = {},
): DbTemplateHeader {
  return {
    id: generateId(),
    name: 'Test Template',
    createdAt: Date.now(),
    lastUsedAt: null,
    usageCount: 0,
    tags: [],
    ...overrides,
  }
}

/**
 * @deprecated Use createDbTemplateHeader or addTemplateWithBlocks instead.
 * This type doesn't match the normalized schema.
 */
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

/**
 * Creates a template with blocks using the repository (normalized storage).
 * Returns the header. Use getTemplatesRepository().getByIdWithBlocks() to retrieve blocks.
 */
export async function addTemplateWithBlocks(options: {
  id?: string
  name: string
  blocks: ReadonlyArray<DbTemplateStrengthBlock>
  tags?: ReadonlyArray<string>
}): Promise<DbTemplateHeader> {
  const repo = getTemplatesRepository()
  return repo.create({
    name: options.name,
    blocks: options.blocks,
    tags: options.tags,
  })
}
