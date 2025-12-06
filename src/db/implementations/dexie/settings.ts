import type { SettingDefaults, SettingsRepository } from '@/db/interfaces'
import type { DbUserSetting, UserSettingKey } from '@/db/schema'
import type { WorkoutTrackerDb } from './database'

/**
 * Default values for user settings.
 */
const SETTING_DEFAULTS: SettingDefaults = {
  theme: 'system',
  defaultRestTimer: 90,
  weightUnit: 'kg',
  heightUnit: 'cm',
  autoSaveInterval: 1000,
  screenWakeLock: true,
  timerSoundEnabled: true,
  language: undefined,
}

export function createDexieSettingsRepository(db: WorkoutTrackerDb): SettingsRepository {
  return {
    async get<TKey extends UserSettingKey>(key: TKey): Promise<SettingDefaults[TKey]> {
      const setting = await db.settings.get(key)
      // @ts-expect-error - Dexie returns the discriminated union, we know the value matches the key
      return setting?.value ?? SETTING_DEFAULTS[key]
    },

    async set(setting: DbUserSetting): Promise<void> {
      await db.settings.put(setting)
    },

    async getAll(): Promise<SettingDefaults> {
      const settings = await db.settings.toArray()
      const result = { ...SETTING_DEFAULTS }

      for (const setting of settings) {
        // @ts-expect-error - Dynamic key assignment from DB values
        result[setting.key] = setting.value
      }

      return result
    },

    async reset(key: UserSettingKey): Promise<void> {
      await db.settings.delete(key)
    },

    async resetAll(): Promise<void> {
      await db.settings.clear()
    },
  }
}
