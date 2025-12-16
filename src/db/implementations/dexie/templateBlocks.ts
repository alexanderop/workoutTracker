import type { TemplateBlocksRepository } from '@/db/interfaces'
import type { DbNormalizedTemplateBlock } from '@/db/schema'
import { db } from './database'

export function createDexieTemplateBlocksRepository(): TemplateBlocksRepository {
  return {
    async getByTemplateId(templateId: string): Promise<ReadonlyArray<DbNormalizedTemplateBlock>> {
      return db.templateBlocks.where('templateId').equals(templateId).sortBy('orderIndex')
    },

    async bulkAdd(blocks: ReadonlyArray<DbNormalizedTemplateBlock>): Promise<void> {
      await db.templateBlocks.bulkAdd([...blocks])
    },

    async deleteByTemplateId(templateId: string): Promise<void> {
      await db.templateBlocks.where('templateId').equals(templateId).delete()
    },
  }
}
