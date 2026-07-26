import { describe, it, expect, beforeEach } from 'vitest'
import { getSettingsRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'
import { db } from '@/db/implementations/dexie/database'
import { dbUserSettingSchema } from '@/features/settings/utils/validation/settingsSchema'

/**
 * Backward compatibility for the `settings` key-value table.
 *
 * `settings` needs no Dexie version bump to gain a key, which is exactly why a
 * new one can break old data silently: every profile written before the key
 * existed simply has no row for it. These certify that such a profile still
 * reads, still exports, and still imports.
 *
 * Browser tier, deliberately: the point is the real Dexie adapter against real
 * IndexedDB with rows genuinely absent, not a fake that returns defaults
 * because it was asked to.
 */
describe('settings backward compatibility', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  /** A profile from before `habitViewMode` existed: the row is simply absent. */
  async function seedLegacySettings(): Promise<void> {
    await db.settings.clear()
    await db.settings.bulkPut([
      { key: 'weightUnit', value: 'kg' },
      { key: 'timerSoundEnabled', value: true },
      { key: 'timerSoundVolume', value: 0.8 },
    ])
  }

  it('reads habitViewMode as cards when the row predates the key', async () => {
    await seedLegacySettings()

    await expect(getSettingsRepository().get('habitViewMode')).resolves.toBe('cards')
  })

  it('fills habitViewMode into getAll() without disturbing the stored keys', async () => {
    await seedLegacySettings()

    const all = await getSettingsRepository().getAll()

    expect(all.habitViewMode).toBe('cards')
    expect(all.weightUnit).toBe('kg')
    expect(all.timerSoundVolume).toBe(0.8)
  })

  it('accepts a legacy export payload that has no habitViewMode row', async () => {
    await seedLegacySettings()

    // Export is the raw rows, so a legacy payload simply lacks the key. Every
    // row still has to clear the import schema.
    const exported = await db.settings.toArray()
    expect(exported.some((setting) => setting.key === 'habitViewMode')).toBe(false)

    for (const setting of exported) {
      expect(dbUserSettingSchema.safeParse(setting).success).toBe(true)
    }
  })

  it('round-trips a legacy payload back to the cards default', async () => {
    await seedLegacySettings()
    const exported = await db.settings.toArray()

    await db.settings.clear()
    await db.settings.bulkPut(exported)

    await expect(getSettingsRepository().get('habitViewMode')).resolves.toBe('cards')
  })
})
