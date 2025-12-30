import { getTemplatesRepository } from './index'
import { popularTemplates } from '@/data/popularTemplates'

/**
 * Seed popular templates to IndexedDB if not already seeded.
 * Checks IndexedDB directly since browsers may clear it while keeping localStorage.
 */
export async function seedPopularTemplates(): Promise<void> {
  const repo = getTemplatesRepository()
  const existing = await repo.getAll()
  if (existing.length > 0) {
    return
  }

  await Promise.all(
    popularTemplates.map((template) =>
      repo.create({
        name: template.name,
        blocks: template.blocks,
        tags: [],
      }),
    ),
  )
}
