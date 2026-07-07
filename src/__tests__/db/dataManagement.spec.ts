import { describe, it, expect, beforeEach } from 'vitest'
import { getDataManagementRepository, getProgressionsRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'

/**
 * deleteAll() must wipe every table in the schema (modulo onboarding). It
 * previously missed the progressions/progressionSessions tables added in
 * database.ts version 5, so Settings -> Delete All Data silently left
 * progression data behind (UX review finding).
 */
describe('DataManagementRepository.deleteAll', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should remove progressions when deleting all data', async () => {
    const progressions = getProgressionsRepository()
    const progression = await progressions.create({
      name: 'KB Swing Challenge',
      availableWeights: [16, 20, 24],
    })
    await progressions.recordSession(progression.id, true, {
      reps: 12,
      minutes: 10,
      weightIndex: 0,
      isComplete: false,
    })

    await getDataManagementRepository().deleteAll()

    expect(await progressions.getAll()).toHaveLength(0)
    expect(await progressions.getSessionHistory(progression.id)).toHaveLength(0)
  })
})
