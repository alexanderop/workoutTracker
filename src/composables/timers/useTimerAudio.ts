import type { ConfigurableWindow } from '@vueuse/core'
import { createGlobalState, defaultWindow, useEventListener, useSupported } from '@vueuse/core'
import { useSettingsStore } from '@/stores/settings'

// One AudioContext for the whole app, not one per component instance. On
// Android (especially over Bluetooth) the output path takes time to open, and
// the first sound after silence is routinely swallowed -- which is the entire
// beep when a cue is only ~150ms long. Creating the context once, priming it
// from the first user gesture, and holding it open with an inaudible source
// keeps the stream warm so a round transition is actually heard.
// See brain/reference/research/2026-07-25-android-pwa-timer-audio-over-music.md

// Inaudible DC offset that keeps one live source node in the graph, so the
// browser has no reason to close the output device between cues. A constant
// offset does not oscillate, so it cannot be heard at any volume.
const KEEPALIVE_OFFSET = 0.0001

// Cap on how long a cue waits for resume(); a cue that cannot start promptly is
// worthless mid-workout, and unresolved resume() promises would hang callers.
const RESUME_TIMEOUT_MS = 100

// Android mixes our cues into the media stream at full music volume -- nothing
// ducks the music for us -- so the cue itself has to cut through. A square wave
// puts energy in the harmonics where music has least, and a burst of short
// pulses is far easier to pick out of a mix than one flat tone. Pulse *count*
// also tells the cues apart by ear alone: 2 = work, 1 = rest, 3 = round.
const CUE_WAVEFORM: OscillatorType = 'square'

// Per-pulse envelope. The attack/release are what stop the hard edges of a
// square wave from clicking; without them every pulse starts at full amplitude.
const PULSE_PEAK = 0.9
const PULSE_ATTACK_SECONDS = 0.006
const PULSE_RELEASE_SECONDS = 0.03
// exponentialRampToValueAtTime() cannot ramp to zero.
const PULSE_SILENCE = 0.0001

// Schedule slightly ahead of `currentTime` so the first pulse is never placed in
// the past (which plays it immediately, and clipped).
const CUE_LEAD_SECONDS = 0.015

// Compression before the volume knob: evens out the peaks so the cue reads as
// louder against music without raising the user's configured volume.
const COMPRESSOR_THRESHOLD_DB = -18
const COMPRESSOR_KNEE_DB = 6
const COMPRESSOR_RATIO = 6
const COMPRESSOR_ATTACK_SECONDS = 0.003
const COMPRESSOR_RELEASE_SECONDS = 0.1

/** One tone within a cue: when it fires relative to the cue start, and for how long. */
type CuePulse = {
  frequency: number
  /** Offset from the cue start, in seconds. */
  at: number
  duration: number
}

/** Work phase: two urgent high pulses -- "go". */
const WORK_CUE: ReadonlyArray<CuePulse> = [
  { frequency: 880, at: 0, duration: 0.1 },
  { frequency: 880, at: 0.17, duration: 0.1 },
]

/** Rest phase: one longer, lower pulse -- "hold". */
const REST_CUE: ReadonlyArray<CuePulse> = [{ frequency: 440, at: 0, duration: 0.24 }]

/** Round transition: three mid pulses, the most distinctive pattern of the three. */
const ROUND_CUE: ReadonlyArray<CuePulse> = [
  { frequency: 660, at: 0, duration: 0.09 },
  { frequency: 660, at: 0.15, duration: 0.09 },
  { frequency: 660, at: 0.3, duration: 0.09 },
]

/** Completion: ascending tones, ending on a long high note. */
const COMPLETE_CUE: ReadonlyArray<CuePulse> = [
  { frequency: 440, at: 0, duration: 0.14 },
  { frequency: 660, at: 0.16, duration: 0.14 },
  { frequency: 880, at: 0.32, duration: 0.3 },
]

/**
 * Web-Audio beep cues for timer phase changes, respecting the user's timer
 * sound settings.
 *
 * Singleton (`createGlobalState`): every timer shares one `AudioContext` for
 * the session. Call `prepare()` from a user gesture -- opening or starting a
 * timer -- so the audio path is already warm when the first cue fires.
 */
export type UseTimerAudioOptions = ConfigurableWindow & {
  audioContext?: typeof AudioContext
}

export const useTimerAudio = createGlobalState((options: UseTimerAudioOptions = {}) => {
  const { window = defaultWindow } = options
  const document = window?.document
  const AudioContextConstructor =
    options.audioContext ?? (window ? globalThis.AudioContext : undefined)
  const settings = useSettingsStore()
  const isSupported = useSupported(() => AudioContextConstructor !== undefined)

  let audioContext: AudioContext | null = null
  let keepAlive: ConstantSourceNode | null = null
  let cueBus: DynamicsCompressorNode | null = null
  let volumeGain: GainNode | null = null

  /**
   * Hold the output device open between cues. Skipped where
   * `ConstantSourceNode` is unavailable -- the keepalive is an optimization,
   * never a precondition for playing a cue.
   */
  function startKeepAlive(context: AudioContext): void {
    if (keepAlive) return
    if (typeof context.createConstantSource !== 'function') return

    const source = context.createConstantSource()
    source.offset.value = KEEPALIVE_OFFSET
    source.connect(context.destination)
    source.start()
    keepAlive = source
  }

  /**
   * Resolve the shared context, creating and resuming it on demand. Returns
   * `null` when timer sounds are off, so nothing touches the audio device.
   * Mobile browsers start an `AudioContext` suspended and suspend it again when
   * the page is hidden, hence the resume on every call.
   */
  async function ensureAudioReady(): Promise<AudioContext | null> {
    if (!settings.timerSoundEnabled || !AudioContextConstructor) return null

    const context = audioContext ?? new AudioContextConstructor()
    audioContext = context

    // 'interrupted' is an iOS Safari specific state absent from the standard typings.
    const state: string = context.state
    if (state === 'suspended' || state === 'interrupted') {
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, RESUME_TIMEOUT_MS))
      await Promise.race([context.resume(), timeout])
    }

    startKeepAlive(context)
    return context
  }

  /**
   * Warm the audio path ahead of the first cue. Call this from a user gesture
   * (mounting a timer screen, tapping start): `resume()` is far more reliable
   * with user activation than from a later timer tick.
   */
  function prepare(): void {
    void ensureAudioReady()
  }

  // Android Chrome suspends the context while the page is hidden -- which is
  // exactly what happens when the user switches to their music app. Resume as
  // soon as they come back rather than waiting for the next cue to try.
  useEventListener(document, 'visibilitychange', () => {
    if (document?.visibilityState !== 'visible') return
    if (!audioContext || audioContext.state === 'running') return
    prepare()
  })

  /**
   * The node every cue pulse connects to: compressor -> volume -> output. Built
   * once per context and reused, so a cue only has to create its own pulses.
   */
  function getCueBus(context: AudioContext): DynamicsCompressorNode {
    if (cueBus) return cueBus

    const compressor = context.createDynamicsCompressor()
    compressor.threshold.value = COMPRESSOR_THRESHOLD_DB
    compressor.knee.value = COMPRESSOR_KNEE_DB
    compressor.ratio.value = COMPRESSOR_RATIO
    compressor.attack.value = COMPRESSOR_ATTACK_SECONDS
    compressor.release.value = COMPRESSOR_RELEASE_SECONDS

    const gain = context.createGain()
    compressor.connect(gain)
    gain.connect(context.destination)

    cueBus = compressor
    volumeGain = gain
    return compressor
  }

  /**
   * Schedule one enveloped pulse on the audio clock. Scheduling (rather than
   * playing "now" from a JS timer) keeps a cue's rhythm intact even when the
   * main thread is busy or throttled.
   */
  function schedulePulse(
    context: AudioContext,
    destination: AudioNode,
    pulse: CuePulse,
    cueStart: number,
  ): void {
    const startAt = cueStart + pulse.at
    const endAt = startAt + pulse.duration

    const oscillator = context.createOscillator()
    oscillator.frequency.value = pulse.frequency
    oscillator.type = CUE_WAVEFORM

    const envelope = context.createGain()
    const attackEnd = startAt + PULSE_ATTACK_SECONDS
    const releaseStart = Math.max(attackEnd, endAt - PULSE_RELEASE_SECONDS)
    envelope.gain.setValueAtTime(0, startAt)
    envelope.gain.linearRampToValueAtTime(PULSE_PEAK, attackEnd)
    envelope.gain.setValueAtTime(PULSE_PEAK, releaseStart)
    envelope.gain.exponentialRampToValueAtTime(PULSE_SILENCE, endAt)

    oscillator.connect(envelope)
    envelope.connect(destination)

    oscillator.start(startAt)
    oscillator.stop(endAt)
    // Release the pulse's nodes once it has finished sounding; a workout
    // schedules hundreds of these.
    oscillator.addEventListener(
      'ended',
      () => {
        oscillator.disconnect()
        envelope.disconnect()
      },
      { once: true },
    )
  }

  /**
   * Play a cue: a burst of scheduled pulses through the shared cue bus.
   */
  async function playCue(cue: ReadonlyArray<CuePulse>): Promise<void> {
    const context = await ensureAudioReady()
    if (!context) return

    const bus = getCueBus(context)
    if (volumeGain) volumeGain.gain.value = Math.min(settings.timerSoundVolume, 1)

    const cueStart = context.currentTime + CUE_LEAD_SECONDS
    for (const pulse of cue) schedulePulse(context, bus, pulse, cueStart)
  }

  /**
   * Play the work interval cue (two 880Hz pulses).
   */
  function playWorkBeep(): void {
    void playCue(WORK_CUE)
  }

  /**
   * Play the rest interval cue (one long 440Hz pulse).
   */
  function playRestBeep(): void {
    void playCue(REST_CUE)
  }

  /**
   * Play the round transition cue (three 660Hz pulses).
   */
  function playRoundBeep(): void {
    void playCue(ROUND_CUE)
  }

  /**
   * Play the completion cue (ascending tones).
   */
  async function playComplete(): Promise<void> {
    await playCue(COMPLETE_CUE)
  }

  /**
   * Release the shared context and its keepalive. Production code never needs
   * this -- the context is meant to outlive individual timers -- but tests must
   * reset the singleton between cases.
   */
  async function dispose(): Promise<void> {
    keepAlive?.stop()
    keepAlive?.disconnect()
    keepAlive = null
    cueBus?.disconnect()
    cueBus = null
    volumeGain?.disconnect()
    volumeGain = null

    const context = audioContext
    audioContext = null
    if (context && context.state !== 'closed') await context.close()
  }

  return {
    isSupported,
    prepare,
    playWorkBeep,
    playRestBeep,
    playRoundBeep,
    playComplete,
    dispose,
  }
})
