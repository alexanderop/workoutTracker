import { useSettingsStore } from '@/stores/settings'

export function useTimerAudio() {
  const settings = useSettingsStore()
  let audioContext: AudioContext | null = null

  /**
   * Play a beep at the specified frequency.
   */
  function playBeep(frequency: number, duration = 0.15): void {
    if (!settings.timerSoundEnabled) return

    if (!audioContext) {
      audioContext = new AudioContext()
    }

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gainNode.gain.value = Math.min(settings.timerSoundVolume, 1.0)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + duration)
  }

  /**
   * Play work interval beep (880Hz).
   */
  function playWorkBeep(): void {
    playBeep(880)
  }

  /**
   * Play rest interval beep (440Hz).
   */
  function playRestBeep(): void {
    playBeep(440)
  }

  /**
   * Play round transition beep (660Hz).
   */
  function playRoundBeep(): void {
    playBeep(660)
  }

  /**
   * Play completion sequence (ascending tones).
   */
  function playComplete(): void {
    if (!settings.timerSoundEnabled) return

    playBeep(440, 0.15)
    playBeep(660, 0.15)
    playBeep(880, 0.15)
  }

  return {
    playWorkBeep,
    playRestBeep,
    playRoundBeep,
    playComplete,
  }
}
