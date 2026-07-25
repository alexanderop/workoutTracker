import type { Pausable } from '@vueuse/core'
import { useVibrate } from '@vueuse/core'
import { computed, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { formatTime } from '@/lib/workout-utils'
import { useBaseTimer } from '@/composables/timers/useBaseTimer'

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

export type UseRestTimerReturn = Pausable & {
  elapsedSeconds: ComputedRef<number>
  remainingSeconds: ComputedRef<number>
  hasTarget: ComputedRef<boolean>
  isDone: ComputedRef<boolean>
  isRunning: ComputedRef<boolean>
  formattedTime: ComputedRef<string>
  /** (Re)start the rest from zero -- called each time a set is completed. */
  start: () => void
  /** @deprecated Alias of `pause`; migrate call sites to `pause()`. */
  stop: () => void
  reset: () => void
  toggle: () => void
}

/**
 * Count-up rest timer with an optional reactive target: counts rest between
 * sets, vibrates once when the target is reached, and pauses itself at a
 * safety cap so an unattended timer doesn't tick forever.
 *
 * @param options
 */
export function useRestTimer(options: UseRestTimerOptions = {}): UseRestTimerReturn {
  const hasVibratedForCompletion = shallowRef(false)

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

  function reset(): void {
    base.resetState()
    hasVibratedForCompletion.value = false
  }

  // Unlike base.toggle, deliberately never starts from idle: a rest only
  // begins via start() when a set is completed.
  function toggle(): void {
    if (base.isRunning.value) {
      base.pause()
      return
    }
    base.resume()
  }

  return {
    elapsedSeconds: base.elapsedSeconds,
    remainingSeconds,
    hasTarget,
    isDone,
    isRunning: base.isRunning,
    isActive: base.isActive,
    formattedTime,
    start,
    stop: base.pause,
    pause: base.pause,
    resume: base.resume,
    reset,
    toggle,
  }
}
