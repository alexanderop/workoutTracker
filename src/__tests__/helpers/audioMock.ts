/**
 * Audio mock helper for testing Web Audio API usage.
 * Provides mock implementations for AudioContext, OscillatorNode, and GainNode.
 *
 * Two modes are supported:
 * - jsdom mode: Uses MockAudioContext class that replaces global.AudioContext
 * - Browser mode: Uses vi.spyOn() on the real AudioContext.prototype
 *
 * Use getAudioMocksUnified() for environment-agnostic access to mocks/spies.
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
  sampleRate = 44_100
  currentTime = 0
  state = 'running'
  createOscillator = mockCreateOscillator
  createGain = mockCreateGain
  close = vi.fn()
  resume = vi.fn(() => Promise.resolve())
  suspend = vi.fn(() => Promise.resolve())
}

/**
 * Sets up the global AudioContext mock.
 * Call this at the top of your test file, outside of any describe/it blocks.
 */
export function setupAudioContextMock(): void {
  // @ts-expect-error - Mocking global AudioContext
  globalThis.AudioContext = MockAudioContext
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

// =============================================================================
// Browser Mode: Spy on real AudioContext.prototype
// =============================================================================

let createOscillatorSpy: ReturnType<typeof vi.spyOn> | null = null
let createGainSpy: ReturnType<typeof vi.spyOn> | null = null

/**
 * Sets up spies on the real AudioContext.prototype methods.
 * Call this in beforeEach for browser mode tests.
 */
export function setupAudioSpies(): void {
  createOscillatorSpy = vi.spyOn(AudioContext.prototype, 'createOscillator')
  createGainSpy = vi.spyOn(AudioContext.prototype, 'createGain')
}

/**
 * Returns the spy functions for assertions in browser mode.
 */
export function getAudioSpies() {
  return {
    createOscillator: createOscillatorSpy,
    createGain: createGainSpy,
  }
}

/**
 * Clears all spy call history.
 * Call this in beforeEach to reset state between tests.
 */
export function clearAudioSpies(): void {
  createOscillatorSpy?.mockClear()
  createGainSpy?.mockClear()
}

/**
 * Restores the original implementations.
 * Call this in afterEach for browser mode tests.
 */
export function restoreAudioSpies(): void {
  createOscillatorSpy?.mockRestore()
  createGainSpy?.mockRestore()
  createOscillatorSpy = null
  createGainSpy = null
}

// =============================================================================
// Unified API: Works in both jsdom and browser modes
// =============================================================================

/**
 * Detect if running in real browser (not jsdom).
 */
export function isBrowserMode(): boolean {
  return (
    globalThis.window !== undefined && !globalThis.navigator.userAgent.includes('jsdom')
  )
}

/**
 * Returns mocks/spies in a unified interface that works in both environments.
 * In jsdom: returns the mock functions from setupAudioContextMock()
 * In browser: returns the spies from setupAudioSpies()
 */
export function getAudioMocksUnified() {
  return isBrowserMode() ? getAudioSpies() : getAudioMocks()
}

/**
 * Clears all mock/spy call history for the current environment.
 */
export function clearAudioMocksUnified(): void {
  if (isBrowserMode()) {
    clearAudioSpies()
    return
  }
  clearAudioMocks()
}
