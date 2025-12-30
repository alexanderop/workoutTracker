import { createGlobalState } from '@vueuse/core'
import { reactive, ref } from 'vue'
import { getSettingsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { HeightUnit, Language, WeightUnit } from '@/types/settings'

export const useSettingsStore = createGlobalState(() => {
  const weightUnit = ref<WeightUnit>('kg')
  const heightUnit = ref<HeightUnit>('cm')
  const screenWakeLock = ref(true)
  const timerSoundEnabled = ref(true)
  const timerSoundVolume = ref(0.8)
  const language = ref<Language | undefined>(undefined)
  const isLoaded = ref(false)
  const isLoading = ref(false)

  /**
   * Load all settings from the database.
   * Call this on app initialization.
   */
  async function loadFromDatabase(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    const [error, settings] = await tryCatch(getSettingsRepository().getAll())
    isLoading.value = false

    if (error) return

    weightUnit.value = settings.weightUnit
    heightUnit.value = settings.heightUnit
    screenWakeLock.value = settings.screenWakeLock
    timerSoundEnabled.value = settings.timerSoundEnabled
    timerSoundVolume.value = settings.timerSoundVolume
    language.value = settings.language
    isLoaded.value = true
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

  /** Reset state to defaults (for test isolation) */
  function $reset(): void {
    weightUnit.value = 'kg'
    heightUnit.value = 'cm'
    screenWakeLock.value = true
    timerSoundEnabled.value = true
    timerSoundVolume.value = 0.8
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
    $reset,
  })
})
