/**
 * Unit tests for Settings Store
 *
 * Tests volume clamping boundaries - these tests kill mutations
 * where the clamping logic is incorrectly modified.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from '@/stores/settings'

describe('Settings Store', () => {
  beforeEach(() => {
    const store = useSettingsStore()
    store.$reset()
  })

  describe('setTimerSoundVolume', () => {
    it('clamps volume below 0.5 to minimum 0.5', async () => {
      const store = useSettingsStore()

      await store.setTimerSoundVolume(0.3)

      expect(store.timerSoundVolume).toBe(0.5)
    })

    it('clamps volume above 1 to maximum 1', async () => {
      const store = useSettingsStore()

      await store.setTimerSoundVolume(1.5)

      expect(store.timerSoundVolume).toBe(1)
    })

    it('accepts volume at exact minimum boundary (0.5)', async () => {
      const store = useSettingsStore()

      await store.setTimerSoundVolume(0.5)

      expect(store.timerSoundVolume).toBe(0.5)
    })

    it('accepts volume at exact maximum boundary (1)', async () => {
      const store = useSettingsStore()

      await store.setTimerSoundVolume(1)

      expect(store.timerSoundVolume).toBe(1)
    })

    it('accepts volume within valid range', async () => {
      const store = useSettingsStore()

      await store.setTimerSoundVolume(0.75)

      expect(store.timerSoundVolume).toBe(0.75)
    })
  })

  describe('loadFromDatabase', () => {
    it('prevents concurrent loads by checking isLoading state', async () => {
      const store = useSettingsStore()

      // Start a load
      const loadPromise = store.loadFromDb()

      // While loading, isLoading should be true
      // A second call should return immediately without effect
      expect(store.isLoading).toBe(true)

      // Start second load while first is in progress
      await store.loadFromDb()

      // Wait for original load
      await loadPromise

      // isLoading should be false after load completes
      expect(store.isLoading).toBe(false)
    })
  })
})
