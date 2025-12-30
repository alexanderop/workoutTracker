import type { SettingDefaults, SettingsRepository } from '@/db/interfaces'
import type { DbUserSetting, UserSettingKey } from '@/db/schema'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

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
function createGetFunction(database: WorkoutTrackerDatabase) {
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
    const setting = await database.settings.get(key)
    if (!setting) {
      return SETTING_DEFAULTS[key]
    }

    return setting.value
  }

  return get
}

/**
 * Apply a single setting to the result object with proper type narrowing.
 */
function applySetting(result: SettingDefaults, setting: DbUserSetting): void {
  switch (setting.key) {
    case 'theme': {
      result.theme = setting.value
      break
    }
    case 'defaultRestTimer': {
      result.defaultRestTimer = setting.value
      break
    }
    case 'weightUnit': {
      result.weightUnit = setting.value
      break
    }
    case 'heightUnit': {
      result.heightUnit = setting.value
      break
    }
    case 'autoSaveInterval': {
      result.autoSaveInterval = setting.value
      break
    }
    case 'screenWakeLock': {
      result.screenWakeLock = setting.value
      break
    }
    case 'timerSoundEnabled': {
      result.timerSoundEnabled = setting.value
      break
    }
    case 'timerSoundVolume': {
      result.timerSoundVolume = setting.value
      break
    }
    case 'language': {
      result.language = setting.value
      break
    }
  }
}

export function createDexieSettingsRepository(database: WorkoutTrackerDatabase): SettingsRepository {
  return {
    get: createGetFunction(database),

    async set(setting: DbUserSetting): Promise<void> {
      await database.settings.put(setting)
    },

    async getAll(): Promise<SettingDefaults> {
      const settings = await database.settings.toArray()
      const result = { ...SETTING_DEFAULTS }

      for (const setting of settings) {
        applySetting(result, setting)
      }

      return result
    },

    async reset(key: UserSettingKey): Promise<void> {
      await database.settings.delete(key)
    },

    async resetAll(): Promise<void> {
      await database.settings.clear()
    },
  }
}
