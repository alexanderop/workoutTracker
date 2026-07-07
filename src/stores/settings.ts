import { createGlobalState } from '@vueuse/core'
import { reactive, ref } from 'vue'
import { getSettingsRepository } from '@/db'
import type { DbUserSetting } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import type { HeightUnit, Language, WeightUnit } from '@/types/settings'

// Mirrors `SETTING_DEFAULTS` in the Dexie settings adapter for the subset of
// keys this store tracks.
const DEFAULT_WEIGHT_UNIT: WeightUnit = 'kg'
const DEFAULT_HEIGHT_UNIT: HeightUnit = 'cm'
const DEFAULT_SCREEN_WAKE_LOCK = true
const DEFAULT_TIMER_SOUND_ENABLED = true
const DEFAULT_TIMER_SOUND_VOLUME = 0.8
// Mirrors SETTING_DEFAULTS.defaultRestTimer in the Dexie settings adapter (90s).
const DEFAULT_REST_TIMER_SECONDS = 90
// Matches defaultRestTimerSettingSchema's `z.number().int().min(0).max(3600)`.
const MIN_REST_TIMER_SECONDS = 0
const MAX_REST_TIMER_SECONDS = 3600

export const useSettingsStore = createGlobalState(() => {
  const weightUnit = ref<WeightUnit>(DEFAULT_WEIGHT_UNIT)
  const heightUnit = ref<HeightUnit>(DEFAULT_HEIGHT_UNIT)
  const screenWakeLock = ref(DEFAULT_SCREEN_WAKE_LOCK)
  const timerSoundEnabled = ref(DEFAULT_TIMER_SOUND_ENABLED)
  const timerSoundVolume = ref(DEFAULT_TIMER_SOUND_VOLUME)
  const defaultRestTimer = ref(DEFAULT_REST_TIMER_SECONDS)
  const language = ref<Language | undefined>(undefined)
  const isLoaded = ref(false)
  const isLoading = ref(false)

  /**
   * Apply a raw settings snapshot onto this store's refs, resetting to
   * defaults first so a deleted/reset row reverts a field rather than
   * leaving it stale.
   */
  function applySnapshot(snapshot: ReadonlyArray<DbUserSetting>): void {
    weightUnit.value = DEFAULT_WEIGHT_UNIT
    heightUnit.value = DEFAULT_HEIGHT_UNIT
    screenWakeLock.value = DEFAULT_SCREEN_WAKE_LOCK
    timerSoundEnabled.value = DEFAULT_TIMER_SOUND_ENABLED
    timerSoundVolume.value = DEFAULT_TIMER_SOUND_VOLUME
    defaultRestTimer.value = DEFAULT_REST_TIMER_SECONDS
    language.value = undefined

    for (const setting of snapshot) {
      switch (setting.key) {
        case 'weightUnit': {
          weightUnit.value = setting.value
          break
        }
        case 'heightUnit': {
          heightUnit.value = setting.value
          break
        }
        case 'screenWakeLock': {
          screenWakeLock.value = setting.value
          break
        }
        case 'timerSoundEnabled': {
          timerSoundEnabled.value = setting.value
          break
        }
        case 'timerSoundVolume': {
          timerSoundVolume.value = setting.value
          break
        }
        case 'defaultRestTimer': {
          defaultRestTimer.value = setting.value
          break
        }
        case 'language': {
          language.value = setting.value
          break
        }
        default: {
          // theme / autoSaveInterval are not tracked by this store.
          break
        }
      }
    }
  }

  // Subscribed once for the lifetime of this singleton store (createGlobalState
  // memoizes this factory body). NOT onMounted/onUnmounted — this store is not
  // tied to a component. Keeps refs in sync with storage, including changes
  // from other tabs. `stop()` below exists so tests can explicitly tear it down.
  const settingsQuery = getSettingsRepository().observeAll()
  let stopSettingsSubscription: (() => void) | undefined = settingsQuery.subscribe((snapshot) => {
    applySnapshot(snapshot)
  })

  /**
   * Load all settings from the database.
   * Call this on app initialization.
   */
  async function loadFromDatabase(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    const [error, snapshot] = await tryCatch(settingsQuery.get())
    isLoading.value = false

    if (error) return

    applySnapshot(snapshot)
    isLoaded.value = true
  }

  /**
   * Stop the live settings subscription. Exposed for test teardown; not
   * called during normal app operation.
   */
  function stop(): void {
    stopSettingsSubscription?.()
    stopSettingsSubscription = undefined
  }

  async function setWeightUnit(unit: WeightUnit): Promise<void> {
    weightUnit.value = unit
    await tryCatch(getSettingsRepository().set({ key: 'weightUnit', value: unit }))
  }

  async function setHeightUnit(unit: HeightUnit): Promise<void> {
    heightUnit.value = unit
    await tryCatch(getSettingsRepository().set({ key: 'heightUnit', value: unit }))
  }

  async function setScreenWakeLock(enabled: boolean): Promise<void> {
    screenWakeLock.value = enabled
    await tryCatch(getSettingsRepository().set({ key: 'screenWakeLock', value: enabled }))
  }

  async function setLanguage(lang: Language): Promise<void> {
    language.value = lang
    await tryCatch(getSettingsRepository().set({ key: 'language', value: lang }))
  }

  async function setTimerSoundEnabled(enabled: boolean): Promise<void> {
    timerSoundEnabled.value = enabled
    await tryCatch(getSettingsRepository().set({ key: 'timerSoundEnabled', value: enabled }))
  }

  async function setTimerSoundVolume(volume: number): Promise<void> {
    const clampedVolume = Math.min(Math.max(volume, 0.5), 1)
    timerSoundVolume.value = clampedVolume
    await tryCatch(getSettingsRepository().set({ key: 'timerSoundVolume', value: clampedVolume }))
  }

  /**
   * Set the default rest timer duration in seconds. `0` disables the rest
   * target entirely (the rest timer falls back to a plain count-up display).
   * Clamped to the range accepted by `defaultRestTimerSettingSchema`.
   */
  async function setDefaultRestTimer(seconds: number): Promise<void> {
    const clampedSeconds = Math.round(
      Math.min(Math.max(seconds, MIN_REST_TIMER_SECONDS), MAX_REST_TIMER_SECONDS),
    )
    defaultRestTimer.value = clampedSeconds
    await tryCatch(getSettingsRepository().set({ key: 'defaultRestTimer', value: clampedSeconds }))
  }

  /** Reset state to defaults (for test isolation) */
  function $reset(): void {
    weightUnit.value = DEFAULT_WEIGHT_UNIT
    heightUnit.value = DEFAULT_HEIGHT_UNIT
    screenWakeLock.value = DEFAULT_SCREEN_WAKE_LOCK
    timerSoundEnabled.value = DEFAULT_TIMER_SOUND_ENABLED
    timerSoundVolume.value = DEFAULT_TIMER_SOUND_VOLUME
    defaultRestTimer.value = DEFAULT_REST_TIMER_SECONDS
    language.value = undefined
    isLoaded.value = false
    isLoading.value = false
  }

  return reactive({
    weightUnit,
    heightUnit,
    screenWakeLock,
    timerSoundEnabled,
    timerSoundVolume,
    defaultRestTimer,
    language,
    isLoaded,
    isLoading,
    loadFromDb: loadFromDatabase,
    setWeightUnit,
    setHeightUnit,
    setScreenWakeLock,
    setLanguage,
    setTimerSoundEnabled,
    setTimerSoundVolume,
    setDefaultRestTimer,
    stop,
    $reset,
  })
})
