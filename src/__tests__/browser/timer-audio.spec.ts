import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTimerAudio } from '@/composables/timers/useTimerAudio'
import { useSettingsStore } from '@/stores/settings'
import { withSetup } from '../helpers/withSetup'
import { resetDatabase } from './setup'

/**
 * Browser tests for useTimerAudio with real Web Audio API.
 * These tests verify AudioContext behavior that cannot be simulated in jsdom.
 */
describe('useTimerAudio - browser mode', () => {
  beforeEach(async () => {
    await resetDatabase()
    setActivePinia(createPinia())
  })

  describe('real AudioContext integration', () => {
    beforeEach(() => {
      const settings = useSettingsStore()
      settings.timerSoundEnabled = true
    })

    it('creates AudioContext successfully without errors', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      // Should not throw when creating AudioContext
      expect(() => result.playWorkBeep()).not.toThrow()

      app.unmount()
    })

    it('creates oscillator with correct frequency for work beep (880Hz)', () => {
      // Spy BEFORE composable is created
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()

      expect(createOscillatorSpy).toHaveBeenCalled()
      const oscillator = createOscillatorSpy.mock.results[0]?.value
      expect(oscillator?.frequency.value).toBe(880)

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('creates oscillator with correct frequency for rest beep (440Hz)', () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playRestBeep()

      expect(createOscillatorSpy).toHaveBeenCalled()
      const oscillator = createOscillatorSpy.mock.results[0]?.value
      expect(oscillator?.frequency.value).toBe(440)

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('creates oscillator with correct frequency for round beep (660Hz)', () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playRoundBeep()

      expect(createOscillatorSpy).toHaveBeenCalled()
      const oscillator = createOscillatorSpy.mock.results[0]?.value
      expect(oscillator?.frequency.value).toBe(660)

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('plays complete sequence with ascending tones (440Hz, 660Hz, 880Hz)', () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playComplete()

      // Should create 3 oscillators for the ascending sequence
      expect(createOscillatorSpy).toHaveBeenCalledTimes(3)

      const frequencies = createOscillatorSpy.mock.results.map(
        (result) => result.value?.frequency.value,
      )
      expect(frequencies).toEqual([440, 660, 880])

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('creates gain node for audio processing', () => {
      const createGainSpy = vi.spyOn(AudioContext.prototype, 'createGain')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()

      expect(createGainSpy).toHaveBeenCalled()

      app.unmount()
      createGainSpy.mockRestore()
    })

    it('plays multiple beeps without errors', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      // Should not throw when playing multiple beeps
      expect(() => {
        result.playWorkBeep()
        result.playRestBeep()
        result.playRoundBeep()
      }).not.toThrow()

      app.unmount()
    })
  })

  describe('respects timerSoundEnabled setting', () => {
    beforeEach(() => {
      const settings = useSettingsStore()
      settings.timerSoundEnabled = false
    })

    it('does not create AudioContext when sounds are disabled', () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()
      result.playRestBeep()
      result.playRoundBeep()

      expect(createOscillatorSpy).not.toHaveBeenCalled()

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('does not create audio nodes for playComplete when disabled', () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playComplete()

      expect(createOscillatorSpy).not.toHaveBeenCalled()

      app.unmount()
      createOscillatorSpy.mockRestore()
    })
  })
})
