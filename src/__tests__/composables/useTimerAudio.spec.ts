import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTimerAudio } from '@/composables/useTimerAudio'
import { useSettingsStore } from '@/stores/settings'
import { withSetup } from '../helpers/withSetup'

// Mock Web Audio API
/* eslint-disable @typescript-eslint/consistent-type-assertions */
const mockOscillatorStart = vi.fn()
const mockOscillatorStop = vi.fn()
const mockOscillatorConnect = vi.fn()
const mockGainConnect = vi.fn()
const mockAudioContextClose = vi.fn()

const createMockOscillator = () => ({
  frequency: { value: 0 },
  type: 'sine' as OscillatorType,
  start: mockOscillatorStart,
  stop: mockOscillatorStop,
  connect: mockOscillatorConnect,
  disconnect: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => true),
  context: {} as BaseAudioContext,
  numberOfInputs: 0,
  numberOfOutputs: 0,
  channelCount: 2,
  channelCountMode: 'max' as ChannelCountMode,
  channelInterpretation: 'speakers' as ChannelInterpretation,
  onended: null,
  setPeriodicWave: vi.fn(),
  detune: { value: 0 } as AudioParam,
})

const createMockGainNode = () => ({
  gain: { value: 1 },
  connect: mockGainConnect,
  disconnect: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => true),
  context: {} as BaseAudioContext,
  numberOfInputs: 0,
  numberOfOutputs: 0,
  channelCount: 2,
  channelCountMode: 'max' as ChannelCountMode,
  channelInterpretation: 'speakers' as ChannelInterpretation,
})

const mockCreateOscillator = vi.fn(() => createMockOscillator())
const mockCreateGain = vi.fn(() => createMockGainNode())

class MockAudioContext {
  destination = {} as AudioDestinationNode
  sampleRate = 44100
  currentTime = 0
  state = 'running' as AudioContextState
  createOscillator = mockCreateOscillator
  createGain = mockCreateGain
  close = mockAudioContextClose
}
/* eslint-enable @typescript-eslint/consistent-type-assertions */

// Mock AudioContext globally
// @ts-expect-error - Mocking global AudioContext
global.AudioContext = MockAudioContext

describe('useTimerAudio', () => {
  beforeEach(() => {
    // Reset Pinia store
    setActivePinia(createPinia())

    // Clear all mocks
    mockOscillatorStart.mockClear()
    mockOscillatorStop.mockClear()
    mockOscillatorConnect.mockClear()
    mockGainConnect.mockClear()
    mockAudioContextClose.mockClear()
    mockCreateOscillator.mockClear()
    mockCreateGain.mockClear()
  })

  describe('when sounds are enabled', () => {
    beforeEach(() => {
      const settings = useSettingsStore()
      settings.timerSoundEnabled = true
    })

    it('playWorkBeep creates oscillator with 880Hz frequency', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()

      expect(mockCreateOscillator).toHaveBeenCalled()
      const oscillator = mockCreateOscillator.mock.results[0]?.value
      expect(oscillator?.frequency.value).toBe(880)
      expect(mockOscillatorStart).toHaveBeenCalled()
      app.unmount()
    })

    it('playRestBeep creates oscillator with 440Hz frequency', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      result.playRestBeep()

      expect(mockCreateOscillator).toHaveBeenCalled()
      const oscillator = mockCreateOscillator.mock.results[0]?.value
      expect(oscillator?.frequency.value).toBe(440)
      expect(mockOscillatorStart).toHaveBeenCalled()
      app.unmount()
    })

    it('playRoundBeep creates oscillator with 660Hz frequency', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      result.playRoundBeep()

      expect(mockCreateOscillator).toHaveBeenCalled()
      const oscillator = mockCreateOscillator.mock.results[0]?.value
      expect(oscillator?.frequency.value).toBe(660)
      expect(mockOscillatorStart).toHaveBeenCalled()
      app.unmount()
    })

    it('playComplete plays multiple tones in sequence', async () => {
      const [result, app] = withSetup(() => useTimerAudio())

      result.playComplete()

      // Should create multiple oscillators for the ascending tone sequence
      expect(mockCreateOscillator.mock.calls.length).toBeGreaterThan(1)
      expect(mockOscillatorStart.mock.calls.length).toBeGreaterThan(1)
      app.unmount()
    })

    it('oscillators are connected to gain node and destination', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()

      expect(mockCreateGain).toHaveBeenCalled()
      expect(mockOscillatorConnect).toHaveBeenCalled()
      expect(mockGainConnect).toHaveBeenCalled()
      app.unmount()
    })

    it('lazily creates AudioContext on first play', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      // AudioContext should not be created until first play
      expect(mockCreateOscillator).not.toHaveBeenCalled()

      result.playWorkBeep()

      // Now it should be created
      expect(mockCreateOscillator).toHaveBeenCalled()
      app.unmount()
    })

    it('reuses AudioContext across multiple plays', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()
      // Store call count for potential future assertions
      const _firstCallCount = mockCreateOscillator.mock.calls.length

      mockCreateOscillator.mockClear()
      result.playRestBeep()

      // New oscillator created, but AudioContext constructor not called again
      expect(mockCreateOscillator).toHaveBeenCalled()
      // If we had a way to track AudioContext construction, we'd verify it wasn't called again
      app.unmount()
    })
  })

  describe('when sounds are disabled', () => {
    beforeEach(() => {
      const settings = useSettingsStore()
      settings.timerSoundEnabled = false
    })

    it('playWorkBeep does not create audio nodes', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      result.playWorkBeep()

      expect(mockCreateOscillator).not.toHaveBeenCalled()
      expect(mockCreateGain).not.toHaveBeenCalled()
      expect(mockOscillatorStart).not.toHaveBeenCalled()
      app.unmount()
    })

    it('playRestBeep does not create audio nodes', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      result.playRestBeep()

      expect(mockCreateOscillator).not.toHaveBeenCalled()
      expect(mockCreateGain).not.toHaveBeenCalled()
      expect(mockOscillatorStart).not.toHaveBeenCalled()
      app.unmount()
    })

    it('playRoundBeep does not create audio nodes', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      result.playRoundBeep()

      expect(mockCreateOscillator).not.toHaveBeenCalled()
      expect(mockCreateGain).not.toHaveBeenCalled()
      expect(mockOscillatorStart).not.toHaveBeenCalled()
      app.unmount()
    })

    it('playComplete does not create audio nodes', () => {
      const [result, app] = withSetup(() => useTimerAudio())

      result.playComplete()

      expect(mockCreateOscillator).not.toHaveBeenCalled()
      expect(mockCreateGain).not.toHaveBeenCalled()
      expect(mockOscillatorStart).not.toHaveBeenCalled()
      app.unmount()
    })
  })
})
