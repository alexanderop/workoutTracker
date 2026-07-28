import { describe, expect, it, vi, type MockInstance } from 'vitest'
import { createTimerAudioState, useTimerAudio } from '@/composables/timers/useTimerAudio'
import { useSettingsStore } from '@/stores/settings'
import { withSetup } from '../helpers/withSetup'

type OscillatorSpy = MockInstance<() => OscillatorNode>

/** Frequencies of every oscillator the cue created, in scheduling order. */
function playedFrequencies(spy: OscillatorSpy): Array<number | undefined> {
  return spy.mock.results.map((result) => result.value?.frequency.value)
}

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
  it('resolves AudioContext from the injected window realm', async () => {
    const calls = { contextCount: 0 }
    class InjectedAudioContext extends AudioContext {
      constructor() {
        super()
        calls.contextCount++
      }
    }

    const injectedWindow = new Proxy(globalThis.window, {
      get(target, property) {
        if (property === 'AudioContext') return InjectedAudioContext
        return Reflect.get(target, property, target)
      },
    })
    const [result, app] = withSetup(() => createTimerAudioState({ window: injectedWindow }))

    try {
      result.prepare()
      await expect.poll(() => calls.contextCount).toBe(1)
    } finally {
      try {
        await result.dispose()
      } finally {
        app.unmount()
      }
    }
  })

  describe('real AudioContext integration', () => {
    it('creates AudioContext successfully without errors', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      // Should not throw when creating AudioContext
      expect(() => result.playWorkBeep()).not.toThrow()

      app.unmount()
    })

    // Pulse count is what tells the cues apart by ear over music, so it is part
    // of the contract -- not just the frequency.
    it('plays the work cue as two 880Hz pulses', async () => {
      // Spy BEFORE composable is created
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()

      // Wait for async audio playback (AudioContext.resume() is async)
      await expect.poll(() => createOscillatorSpy.mock.calls.length).toBe(2)
      expect(playedFrequencies(createOscillatorSpy)).toEqual([880, 880])

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('plays the rest cue as a single 440Hz pulse', async () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playRestBeep()

      await expect.poll(() => createOscillatorSpy.mock.calls.length).toBe(1)
      expect(playedFrequencies(createOscillatorSpy)).toEqual([440])

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('plays the round cue as three 660Hz pulses', async () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playRoundBeep()

      await expect.poll(() => createOscillatorSpy.mock.calls.length).toBe(3)
      expect(playedFrequencies(createOscillatorSpy)).toEqual([660, 660, 660])

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('uses a harmonically rich waveform so cues cut through music', async () => {
      const createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()

      await expect.poll(() => createOscillatorSpy.mock.calls.length).toBeGreaterThan(0)
      // A pure sine has no harmonics and is the easiest signal for music to mask.
      expect(createOscillatorSpy.mock.results[0]?.value?.type).toBe('square')

      app.unmount()
      createOscillatorSpy.mockRestore()
    })

    it('schedules pulses on the audio clock rather than starting them now', async () => {
      const startSpy = vi.spyOn(OscillatorNode.prototype, 'start')

      const [result, app] = withSetup(() => useTimerAudio())

      result.playRoundBeep()

      await expect.poll(() => startSpy.mock.calls.length).toBe(3)
      // Every pulse carries an explicit start time, and the burst is spread out
      // in time -- a JS-timer-driven cue would pass no argument at all.
      const startTimes = startSpy.mock.calls.map(([when]) => when)
      expect(startTimes.every((when) => typeof when === 'number')).toBe(true)
      expect(new Set(startTimes).size).toBe(3)

      app.unmount()
      startSpy.mockRestore()
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
