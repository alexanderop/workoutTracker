import { liveQuery } from 'dexie'
import type { LiveQuery, SettingDefaults, SettingsRepository } from '@/db/interfaces'
import type { DbUserSetting, HabitViewMode, UserSettingKey } from '@/db/schema'
import { DEFAULT_HABIT_VIEW_MODE } from '@/db/schema'
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
  habitViewMode: DEFAULT_HABIT_VIEW_MODE,
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
  async function get(key: 'habitViewMode'): Promise<HabitViewMode>
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
 *
 * Every arm says the same thing -- `result[key] = value` for its own key -- so
 * this reads like boilerplate begging to be collapsed into one indexed write.
 * It cannot be, on this codebase's terms: TypeScript will not correlate
 * `setting.key` with `setting.value` when indexing a discriminated union, so
 * the collapsed form needs a type assertion, and assertions are banned here
 * (`@typescript-eslint/consistent-type-assertions`). A generic write helper
 * gets past the linter only by widening `value` to the union of every
 * setting's type, which is the same safety hole wearing a hat.
 *
 * So the arms stay, and with them the property worth having: adding a
 * `DbUserSetting` variant whose value type disagrees with its `SettingDefaults`
 * field is a compile error here rather than a silent bad write at runtime. The
 * complexity budget is one arm short of the number of settings we have; that
 * is a fact about the rule, not about this function.
 *
 * The `default` arm covers the other half. A type mismatch was always caught;
 * a *missing* arm was not -- a `switch` over a union in a `void` function is
 * not exhaustiveness-checked, so a new key with no case here would have made
 * `getAll()` hand back the default instead of the user's stored value, silently
 * and with a green build. Assigning the narrowed `setting` to `never` turns
 * that into a compile error too.
 */
// eslint-disable-next-line complexity -- One arm per setting; see above.
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
    case 'habitViewMode': {
      result.habitViewMode = setting.value
      break
    }
    default: {
      const unhandled: never = setting
      return unhandled
    }
  }
}

/**
 * Shared query logic for `getAll()` and `observeAll()` so both read the same
 * raw rows from the table.
 */
function queryAll(database: WorkoutTrackerDatabase): Promise<ReadonlyArray<DbUserSetting>> {
  return database.settings.toArray()
}

export function createDexieSettingsRepository(
  database: WorkoutTrackerDatabase,
): SettingsRepository {
  return {
    get: createGetFunction(database),

    async set(setting: DbUserSetting): Promise<void> {
      await database.settings.put(setting)
    },

    async getAll(): Promise<SettingDefaults> {
      const settings = await queryAll(database)
      const result = { ...SETTING_DEFAULTS }

      for (const setting of settings) {
        applySetting(result, setting)
      }

      return result
    },

    observeAll(): LiveQuery<ReadonlyArray<DbUserSetting>> {
      const run = () => queryAll(database)
      return {
        get: () => run(),
        subscribe(onChange: (value: ReadonlyArray<DbUserSetting>) => void) {
          const subscription = liveQuery(run).subscribe({ next: onChange })
          return () => subscription.unsubscribe()
        },
      }
    },

    async reset(key: UserSettingKey): Promise<void> {
      await database.settings.delete(key)
    },

    async resetAll(): Promise<void> {
      await database.settings.clear()
    },
  }
}
