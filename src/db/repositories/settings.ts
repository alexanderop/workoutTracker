import { db } from '../index'
import type { DbUserSetting, UserSettingKey } from '../schema'

/**
 * Default values for user settings.
 */
const SETTING_DEFAULTS = {
  theme: 'system',
  defaultRestTimer: 90,
  weightUnit: 'kg',
  heightUnit: 'cm',
  autoSaveInterval: 1000,
  screenWakeLock: true,
  timerSoundEnabled: true,
  language: undefined,
} as const

type SettingDefaults = typeof SETTING_DEFAULTS

/**
 * Repository for managing user settings.
 */
export const settingsRepository = {
  /**
   * Get a setting value by key.
   * Returns the default value if not set.
   */
  async get<TKey extends UserSettingKey>(key: TKey): Promise<SettingDefaults[TKey]> {
    const setting = await db.settings.get(key)
    // @ts-expect-error - Dexie returns the discriminated union, we know the value matches the key
    return setting?.value ?? SETTING_DEFAULTS[key]
  },

  /**
   * Set a setting value.
   */
  async set(setting: DbUserSetting): Promise<void> {
    await db.settings.put(setting)
  },

  /**
   * Get all settings as an object.
   */
  async getAll(): Promise<SettingDefaults> {
    const settings = await db.settings.toArray()
    const result = { ...SETTING_DEFAULTS }

    for (const setting of settings) {
      // @ts-expect-error - Dynamic key assignment from DB values
      result[setting.key] = setting.value
    }

    return result
  },

  /**
   * Reset a setting to its default value.
   */
  async reset(key: UserSettingKey): Promise<void> {
    await db.settings.delete(key)
  },

  /**
   * Reset all settings to defaults.
   */
  async resetAll(): Promise<void> {
    await db.settings.clear()
  },
}
