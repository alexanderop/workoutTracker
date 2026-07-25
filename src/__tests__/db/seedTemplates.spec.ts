import { describe, it, expect, beforeEach } from 'vitest'
import { seedPopularTemplates } from '@/db/seedTemplates'
import { popularTemplates } from '@/db/popularTemplates'
import { resetDatabase } from '@/__tests__/setup'
import { getAllTemplates, getTemplateCount } from '@/__tests__/helpers/dbAssertions'

describe('seedPopularTemplates', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('seeds templates on first run', async () => {
    await seedPopularTemplates()
    const count = await getTemplateCount()
    expect(count).toBe(popularTemplates.length)
  })

  it('skips seeding when templates already exist', async () => {
    // First seed
    await seedPopularTemplates()
    const firstCount = await getTemplateCount()

    // Second call should not duplicate
    await seedPopularTemplates()
    const secondCount = await getTemplateCount()

    expect(secondCount).toBe(firstCount)
  })

  it('seeds goku template with correct structure', async () => {
    await seedPopularTemplates()
    const templates = await getAllTemplates()
    const gokuTemplate = templates.find((t) => t.name === 'goku')

    expect(gokuTemplate).toBeDefined()
    expect(gokuTemplate!.blocks).toHaveLength(6)
    expect(gokuTemplate!.blocks[0]).toMatchObject({
      kind: 'strength',
      name: 'Goblet Squat',
      defaultSetCount: 3,
      targetReps: 8,
    })
  })

  it('seeds goku extreme template with 8 exercises', async () => {
    await seedPopularTemplates()
    const templates = await getAllTemplates()
    const extremeTemplate = templates.find((t) => t.name === 'goku extreme')

    expect(extremeTemplate).toBeDefined()
    expect(extremeTemplate!.blocks).toHaveLength(8)
    expect(extremeTemplate!.blocks[2]).toMatchObject({
      kind: 'strength',
      name: 'Deadlift',
      defaultSetCount: 1,
      targetReps: 5,
    })
  })
})
