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
  timerSoundVolume: 0.8,
  language: undefined,
}

/**
 * Get a setting value by key with proper type narrowing via function overloads.
 */
function createGetFunction(db: WorkoutTrackerDb) {
  async function get(key: 'theme'): Promise<'light' | 'dark' | 'system'>
  async function get(key: 'defaultRestTimer'): Promise<number>
  async function get(key: 'weightUnit'): Promise<'kg' | 'lbs'>
  async function get(key: 'heightUnit'): Promise<'cm' | 'ft-in'>
  async function get(key: 'autoSaveInterval'): Promise<number>
  async function get(key: 'screenWakeLock'): Promise<boolean>
  async function get(key: 'timerSoundEnabled'): Promise<boolean>
  async function get(key: 'timerSoundVolume'): Promise<number>
  async function get(key: 'language'): Promise<'en' | 'de' | undefined>
  async function get(key: UserSettingKey) {
    const setting = await db.settings.get(key)
    if (!setting) {
      return SETTING_DEFAULTS[key]
    }

    // Use switch to narrow the discriminated union
    switch (setting.key) {
      case 'theme':
        return setting.value
      case 'defaultRestTimer':
        return setting.value
      case 'weightUnit':
        return setting.value
      case 'heightUnit':
        return setting.value
      case 'autoSaveInterval':
        return setting.value
      case 'screenWakeLock':
        return setting.value
      case 'timerSoundEnabled':
        return setting.value
      case 'timerSoundVolume':
        return setting.value
      case 'language':
        return setting.value
    }
  }

  return get
}

export function createDexieSettingsRepository(db: WorkoutTrackerDb): SettingsRepository {
  return {
    get: createGetFunction(db),

    async set(setting: DbUserSetting): Promise<void> {
      await db.settings.put(setting)
    },

    async getAll(): Promise<SettingDefaults> {
      const settings = await db.settings.toArray()
      const result = { ...SETTING_DEFAULTS }

      for (const setting of settings) {
        switch (setting.key) {
          case 'theme':
            result.theme = setting.value
            break
          case 'defaultRestTimer':
            result.defaultRestTimer = setting.value
            break
          case 'weightUnit':
            result.weightUnit = setting.value
            break
          case 'heightUnit':
            result.heightUnit = setting.value
            break
          case 'autoSaveInterval':
            result.autoSaveInterval = setting.value
            break
          case 'screenWakeLock':
            result.screenWakeLock = setting.value
            break
          case 'timerSoundEnabled':
            result.timerSoundEnabled = setting.value
            break
          case 'timerSoundVolume':
            result.timerSoundVolume = setting.value
            break
          case 'language':
            result.language = setting.value
            break
        }
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
