import { defineStore } from 'pinia'
import { ref } from 'vue'
import { settingsRepository } from '@/db/repositories/settings'
import { tryCatch } from '@/lib/tryCatch'
import type { HeightUnit, Language, WeightUnit } from '@/types/settings'

export const useSettingsStore = defineStore('settings', () => {
  const weightUnit = ref<WeightUnit>('kg')
  const heightUnit = ref<HeightUnit>('cm')
  const screenWakeLock = ref(true)
  const timerSoundEnabled = ref(true)
  const language = ref<Language | undefined>(undefined)
  const isLoaded = ref(false)
  const isLoading = ref(false)

  /**
   * Load all settings from the database.
   * Call this on app initialization.
   */
  async function loadFromDb(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    const [error, settings] = await tryCatch(settingsRepository.getAll())
    isLoading.value = false

    if (error) return

    weightUnit.value = settings.weightUnit
    heightUnit.value = settings.heightUnit
    screenWakeLock.value = settings.screenWakeLock
    timerSoundEnabled.value = settings.timerSoundEnabled
    language.value = settings.language
    isLoaded.value = true
  }

  /**
   * Set the weight unit preference.
   */
  async function setWeightUnit(unit: WeightUnit): Promise<void> {
    weightUnit.value = unit
    await settingsRepository.set({ key: 'weightUnit', value: unit })
  }

  /**
   * Set the height unit preference.
   */
  async function setHeightUnit(unit: HeightUnit): Promise<void> {
    heightUnit.value = unit
    await settingsRepository.set({ key: 'heightUnit', value: unit })
  }

  /**
   * Set the screen wake lock preference.
   */
  async function setScreenWakeLock(enabled: boolean): Promise<void> {
    screenWakeLock.value = enabled
    await settingsRepository.set({ key: 'screenWakeLock', value: enabled })
  }

  /**
   * Set the language preference.
   */
  async function setLanguage(lang: Language): Promise<void> {
    language.value = lang
    await settingsRepository.set({ key: 'language', value: lang })
  }

  /**
   * Set the timer sound preference.
   */
  async function setTimerSoundEnabled(enabled: boolean): Promise<void> {
    timerSoundEnabled.value = enabled
    await settingsRepository.set({ key: 'timerSoundEnabled', value: enabled })
  }

  return {
    weightUnit,
    heightUnit,
    screenWakeLock,
    timerSoundEnabled,
    language,
    isLoaded,
    isLoading,
    loadFromDb,
    setWeightUnit,
    setHeightUnit,
    setScreenWakeLock,
    setLanguage,
    setTimerSoundEnabled,
  }
})
