import { useVibrate } from '@vueuse/core'
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { formatTime } from '@/lib/workout-utils'
import { useBaseTimer } from './useBaseTimer'

// Safety cap on the count-up display so a forgotten/unattended rest timer
// doesn't tick forever in the background. Widened to cover the configured
// target too (settings allow up to 3600s) plus a little overtime headroom.
const MIN_COUNT_UP_CAP_SECONDS = 300

// Vibration pattern played once when the rest target is reached: buzz, pause, buzz.
const REST_COMPLETE_VIBRATION_PATTERN = [200, 100, 200]

export type UseRestTimerOptions = {
  /**
   * Optional rest target in seconds. `0` (or omitted) means "no target" --
   * the timer behaves as a plain count-up stopwatch, matching the pre-target
   * behavior. Reactive: adjusting it while running (e.g. a +/-15s tap)
   * immediately updates `remainingSeconds`/`isDone`.
   */
  target?: MaybeRefOrGetter<number>
}

export function useRestTimer(options: UseRestTimerOptions = {}) {
  const hasVibratedForCompletion = ref(false)

  // `interval` is a required (but deprecated) option for persistent vibration;
  // 0 disables it since we only want the one-shot completion buzz below.
  const { vibrate } = useVibrate({ pattern: REST_COMPLETE_VIBRATION_PATTERN, interval: 0 })

  const target = computed(() => Math.max(0, toValue(options.target) ?? 0))
  const hasTarget = computed(() => target.value > 0)
  const capSeconds = computed(() => Math.max(MIN_COUNT_UP_CAP_SECONDS, target.value))

  // Timestamp-based timer core (elapsed is recomputed from Date.now() on every
  // tick, so a throttled/delayed interval -- backgrounded tab, screen wake-lock
  // interactions -- still reports the correct elapsed time). Shared with the
  // AMRAP/EMOM/Tabata/ForTime timers via useBaseTimer; the cap check pauses the
  // count-up once it's reached.
  const base = useBaseTimer({
    tickInterval: 1000,
    onTick: () => {
      if (base.elapsedSeconds.value >= capSeconds.value) {
        base.pause()
      }
    },
  })

  const remainingSeconds = computed(() => Math.max(target.value - base.elapsedSeconds.value, 0))
  const isDone = computed(() => hasTarget.value && base.elapsedSeconds.value >= target.value)
  const formattedTime = computed(() =>
    formatTime(hasTarget.value ? remainingSeconds.value : base.elapsedSeconds.value),
  )

  // Vibrate exactly once per rest when the countdown reaches zero.
  watch(isDone, (done) => {
    if (done && !hasVibratedForCompletion.value) {
      hasVibratedForCompletion.value = true
      vibrate()
    }
  })

  /** (Re)start the rest from zero -- called each time a set is completed. */
  function start(): void {
    base.resetState()
    hasVibratedForCompletion.value = false
    base.start()
  }

  function stop(): void {
    base.pause()
  }

  /** Resume a paused rest; a no-op unless the timer is actually paused. */
  function resume(): void {
    if (base.isPaused.value) {
      base.start()
    }
  }

  function reset(): void {
    base.resetState()
    hasVibratedForCompletion.value = false
  }

  function toggle(): void {
    if (base.isRunning.value) {
      stop()
      return
    }
    resume()
  }

  return {
    elapsedSeconds: base.elapsedSeconds,
    remainingSeconds,
    hasTarget,
    isDone,
    isRunning: base.isRunning,
    formattedTime,
    start,
    stop,
    resume,
    reset,
    toggle,
  }
}
