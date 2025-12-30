import { useSettingsStore } from '@/stores/settings'

export function useTimerAudio() {
  const settings = useSettingsStore()
  let audioContext: AudioContext | null = null

  /**
   * Ensure AudioContext is created and attempt to resume if suspended.
   * Mobile browsers start AudioContext in suspended state.
   * Uses a timeout to prevent hanging if resume() doesn't resolve.
   */
  async function ensureAudioReady(): Promise<void> {
    if (!audioContext) {
      audioContext = new AudioContext()
    }

    // Resume if suspended (required for mobile and when other apps have audio focus)
    // Use Promise.race with timeout to prevent hanging in test environments
    // Note: 'interrupted' is iOS Safari specific state not in standard typings
    const state = audioContext.state
    if (state === 'suspended' || state === 'interrupted') {
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 100))
      await Promise.race([audioContext.resume(), timeout])
    }
  }

  /**
   * Play a beep at the specified frequency.
   */
  async function playBeep(frequency: number, duration = 0.15): Promise<void> {
    if (!settings.timerSoundEnabled) return

    await ensureAudioReady()
    if (!audioContext) return

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gainNode.gain.value = Math.min(settings.timerSoundVolume, 1)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + duration)
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

  return {
    playWorkBeep,
    playRestBeep,
    playRoundBeep,
    playComplete,
  }
}
