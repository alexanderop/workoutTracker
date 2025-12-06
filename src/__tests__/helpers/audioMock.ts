/**
 * Audio mock helper for testing Web Audio API usage.
 * Provides mock implementations for AudioContext, OscillatorNode, and GainNode.
 */
import { vi } from 'vitest'

// Store mock functions so they can be accessed and cleared
const mockOscillatorStart = vi.fn()
const mockOscillatorStop = vi.fn()
const mockOscillatorConnect = vi.fn()
const mockGainConnect = vi.fn()

function createMockOscillator() {
  return {
    frequency: { value: 0 },
    type: 'sine',
    start: mockOscillatorStart,
    stop: mockOscillatorStop,
    connect: mockOscillatorConnect,
    disconnect: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    context: {},
    numberOfInputs: 0,
    numberOfOutputs: 0,
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
    onended: null,
    setPeriodicWave: vi.fn(),
    detune: { value: 0 },
  }
}

function createMockGainNode() {
  return {
    gain: { value: 1 },
    connect: mockGainConnect,
    disconnect: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    context: {},
    numberOfInputs: 0,
    numberOfOutputs: 0,
    channelCount: 2,
    channelCountMode: 'max',
    channelInterpretation: 'speakers',
  }
}

const mockCreateOscillator = vi.fn(() => createMockOscillator())
const mockCreateGain = vi.fn(() => createMockGainNode())

class MockAudioContext {
  destination = {}
  sampleRate = 44100
  currentTime = 0
  state = 'running'
  createOscillator = mockCreateOscillator
  createGain = mockCreateGain
  close = vi.fn()
}

/**
 * Sets up the global AudioContext mock.
 * Call this at the top of your test file, outside of any describe/it blocks.
 */
export function setupAudioContextMock(): void {
  // @ts-expect-error - Mocking global AudioContext
  global.AudioContext = MockAudioContext
}

/**
 * Returns the mock functions for assertions.
 */
export function getAudioMocks() {
  return {
    oscillatorStart: mockOscillatorStart,
    oscillatorStop: mockOscillatorStop,
    oscillatorConnect: mockOscillatorConnect,
    gainConnect: mockGainConnect,
    createOscillator: mockCreateOscillator,
    createGain: mockCreateGain,
  }
}

/**
 * Clears all mock call history.
 * Call this in beforeEach to reset state between tests.
 */
export function clearAudioMocks(): void {
  mockOscillatorStart.mockClear()
  mockOscillatorStop.mockClear()
  mockOscillatorConnect.mockClear()
  mockGainConnect.mockClear()
  mockCreateOscillator.mockClear()
  mockCreateGain.mockClear()
}
