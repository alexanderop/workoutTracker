import { getSettingsRepository, type SettingDefaults } from '@/db'
import { useLiveQuery, type LiveQueryState } from './useLiveQuery'

/**
 * Default values for user settings (used as initial value before first load).
 */
const DEFAULTS: SettingDefaults = {
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
 * Subscribe to live updates of all user settings (merged with defaults).
 * Automatically syncs across browser tabs via IndexedDB events.
 * Cleans up subscription when the component unmounts.
 *
 * @returns Reactive state with current settings and ready status
 *
 * @example
 * const { data: settings, isReady } = useLiveSettings()
 *
 * watchEffect(() => {
 *   if (isReady.value) {
 *     console.log('Weight unit:', settings.value.weightUnit)
 *   }
 * })
 */
export function useLiveSettings(): LiveQueryState<SettingDefaults> {
  return useLiveQuery<SettingDefaults>(
    (callback) => getSettingsRepository().subscribeAll(callback),
    DEFAULTS,
  )
}
