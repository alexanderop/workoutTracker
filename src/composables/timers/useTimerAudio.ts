import { createGlobalState, useEventListener } from '@vueuse/core'
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

/**
 * Web-Audio beep cues for timer phase changes, respecting the user's timer
 * sound settings.
 *
 * Singleton (`createGlobalState`): every timer shares one `AudioContext` for
 * the session. Call `prepare()` from a user gesture -- opening or starting a
 * timer -- so the audio path is already warm when the first cue fires.
 */
export const useTimerAudio = createGlobalState(() => {
  const settings = useSettingsStore()

  let audioContext: AudioContext | null = null
  let keepAlive: ConstantSourceNode | null = null

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
    if (!settings.timerSoundEnabled) return null

    audioContext ??= new AudioContext()
    const context = audioContext

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
    if (document.visibilityState !== 'visible') return
    if (!audioContext || audioContext.state === 'running') return
    prepare()
  })

  /**
   * Play a beep at the specified frequency.
   */
  async function playBeep(frequency: number, duration = 0.15): Promise<void> {
    const context = await ensureAudioReady()
    if (!context) return

    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gainNode.gain.value = Math.min(settings.timerSoundVolume, 1)

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start()
    oscillator.stop(context.currentTime + duration)
  }

  /**
   * Play work interval beep (880Hz).
   */
  function playWorkBeep(): void {
    void playBeep(880)
  }

  /**
   * Play rest interval beep (440Hz).
   */
  function playRestBeep(): void {
    void playBeep(440)
  }

  /**
   * Play round transition beep (660Hz).
   */
  function playRoundBeep(): void {
    void playBeep(660)
  }

  /**
   * Play completion sequence (ascending tones).
   */
  async function playComplete(): Promise<void> {
    if (!settings.timerSoundEnabled) return

    await playBeep(440, 0.15)
    setTimeout(() => void playBeep(660, 0.15), 150)
    setTimeout(() => void playBeep(880, 0.15), 300)
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

    const context = audioContext
    audioContext = null
    if (context && context.state !== 'closed') await context.close()
  }

  return {
    prepare,
    playWorkBeep,
    playRestBeep,
    playRoundBeep,
    playComplete,
    dispose,
  }
})
