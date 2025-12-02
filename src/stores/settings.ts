import { defineStore } from 'pinia'
import { ref } from 'vue'
import { settingsRepository } from '@/db/repositories/settings'

export type WeightUnit = 'kg' | 'lbs'
export type HeightUnit = 'cm' | 'ft-in'

export const useSettingsStore = defineStore('settings', () => {
  const weightUnit = ref<WeightUnit>('kg')
  const heightUnit = ref<HeightUnit>('cm')
  const screenWakeLock = ref(true)
  const timerSoundEnabled = ref(true)
  const isLoaded = ref(false)
  const isLoading = ref(false)

  /**
   * Load all settings from the database.
   * Call this on app initialization.
   */
  async function loadFromDb(): Promise<void> {
    if (isLoading.value) return

    isLoading.value = true
    try {
      const settings = await settingsRepository.getAll()
      weightUnit.value = settings.weightUnit
      heightUnit.value = settings.heightUnit
      screenWakeLock.value = settings.screenWakeLock
      isLoaded.value = true
    } finally {
      isLoading.value = false
    }
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

  return {
    weightUnit,
    heightUnit,
    screenWakeLock,
    timerSoundEnabled,
    isLoaded,
    isLoading,
    loadFromDb,
    setWeightUnit,
    setHeightUnit,
    setScreenWakeLock,
  }
})
