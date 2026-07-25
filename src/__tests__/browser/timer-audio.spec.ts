import { describe, expect, it, vi } from 'vitest'
import { useTimerAudio } from '@/composables/timers/useTimerAudio'
import { useSettingsStore } from '@/stores/settings'
import { withSetup } from '../helpers/withSetup'

function setupWithSoundDisabled() {
  return withSetup(() => {
    const settings = useSettingsStore()
    settings.timerSoundEnabled = false
    return useTimerAudio()
  })
}

/**
 * Browser tests for useTimerAudio with real Web Audio API.
 * These tests verify AudioContext behavior that cannot be simulated in jsdom.
 * Note: Each withSetup() call creates a fresh Pinia instance with default settings.
 * Note: playWorkBeep etc. are fire-and-forget async operations, so tests use expect.poll().
 */
describe('useTimerAudio - browser mode', () => {
  describe('real AudioContext integration', () => {
    it('creates AudioContext successfully without errors', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      // Should not throw when creating AudioContext
      expect(() => result.playWorkBeep()).not.toThrow()

      app.unmount()
    })

    it('creates oscillator with correct frequency for work beep (880Hz)', async () => {
      // Spy BEFORE composable is created
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()

      // Wait for async audio playback (AudioContext.resume() is async)
      await expect.poll(() => createOscillatorSpy.mock.calls.length).toBeGreaterThan(0)
      const oscillator = createOscillatorSpy.mock.results[0]?.value
      expect(oscillator?.frequency.value).toBe(880)

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('creates oscillator with correct frequency for rest beep (440Hz)', async () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playRestBeep()

      await expect.poll(() => createOscillatorSpy.mock.calls.length).toBeGreaterThan(0)
      const oscillator = createOscillatorSpy.mock.results[0]?.value
      expect(oscillator?.frequency.value).toBe(440)

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('creates oscillator with correct frequency for round beep (660Hz)', async () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playRoundBeep()

      await expect.poll(() => createOscillatorSpy.mock.calls.length).toBeGreaterThan(0)
      const oscillator = createOscillatorSpy.mock.results[0]?.value
      expect(oscillator?.frequency.value).toBe(660)

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('plays complete sequence with ascending tones (440Hz, 660Hz, 880Hz)', async () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playComplete()

      // Wait for all 3 oscillators (with delays: 0ms, 150ms, 300ms)
      await expect.poll(() => createOscillatorSpy.mock.calls.length, { timeout: 1000 }).toBe(3)

      const frequencies = createOscillatorSpy.mock.results.map(
        (oscillatorResult) => oscillatorResult.value?.frequency.value,
      )
      expect(frequencies).toEqual([440, 660, 880])

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('creates gain node for audio processing', async () => {
      const createGainSpy = vi.spyOn(AudioContext.prototype, 'createGain')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()

      await expect.poll(() => createGainSpy.mock.calls.length).toBeGreaterThan(0)

      app.unmount()
      createGainSpy.mockRestore()
    })

    it('shares one audio engine across every caller', () => {
      const [first, firstApp] = withSetup(() => useTimerAudio())
      const [second, secondApp] = withSetup(() => useTimerAudio())

      // A single engine means a single AudioContext for the session, which is
      // what keeps the output path warm between cues on Android.
      expect(second).toBe(first)

      firstApp.unmount()
      secondApp.unmount()
    })

    it('warms the audio path on prepare() without making a sound', async () => {
      const [result, app] = withSetup(() => useTimerAudio())
      // Earlier cases already primed the shared engine; start from a cold one.
      await result.dispose()

      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')
      const createConstantSourceSpy = vi.spyOn(AudioContext.prototype, 'createConstantSource')

      result.prepare()

      // The inaudible keepalive holds the output device open ...
      await expect.poll(() => createConstantSourceSpy.mock.calls.length).toBeGreaterThan(0)
      // ... but priming must never emit a tone of its own.
      expect(createOscillatorSpy).not.toHaveBeenCalled()

      app.unmount()
      createOscillatorSpy.mockRestore()
      createConstantSourceSpy.mockRestore()
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
    it('does not create AudioContext when sounds are disabled', () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = setupWithSoundDisabled()

      result.playWorkBeep()
      result.playRestBeep()
      result.playRoundBeep()

      expect(createOscillatorSpy).not.toHaveBeenCalled()

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('does not create audio nodes for playComplete when disabled', () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = setupWithSoundDisabled()

      result.playComplete()

      expect(createOscillatorSpy).not.toHaveBeenCalled()

      app.unmount()
      createOscillatorSpy.mockRestore()
    })
  })
})
