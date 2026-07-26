import { computed, onUnmounted, ref } from 'vue'
import type { ProgressionsRepository } from '@/db/interfaces'
import type { DbProgression, DbProgressionSession } from '@/db/schema'
import type { Context } from '@/lib/di/context'
import { useRuntimeContext } from '@/lib/di/vue'
import { tryCatch } from '@/lib/tryCatch'
import { calculateNextLevel, getCurrentLevel } from '../lib/progressionLogic'
import { ProgressionRepo } from '../services'
import type { ProgressionLevel } from '../types'

// ============================================
// Types
// ============================================

type SessionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; progression: DbProgression }
  | { status: 'active'; progression: DbProgression }
  | { status: 'completing' }
  | { status: 'completed'; session: DbProgressionSession }
  | { status: 'error'; error: Error }

// ============================================
// Composable
// ============================================

/**
 * Active EMOM session with timer for a progression.
 *
 * Repository injected per ADR 004 (brain/decisions/004-db-in-di.md).
 *
 * Time is deliberately *not* injected, unlike `useHabits`: after removing the
 * write-only `startedAt`, the sole remaining clock read is the 1-second
 * `setInterval` tick, and `Clock` has no interval primitive to replace it with.
 * Node specs drive the tick with `vi.useFakeTimers()` instead.
 */
export function useProgressionSession(
  progressionId: string,
  ctx: Context<ProgressionsRepository> = useRuntimeContext<ProgressionsRepository>(),
) {
  const repo = ctx.get(ProgressionRepo)
  // Core state
  const state = ref<SessionState>({ status: 'idle' })

  // Timer state
  const currentSecond = ref(0)
  const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)

  // Derived state
  const progression = computed(() => {
    if (state.value.status === 'ready' || state.value.status === 'active') {
      return state.value.progression
    }
    return null
  })

  const level = computed((): ProgressionLevel | null =>
    progression.value ? getCurrentLevel(progression.value) : null,
  )

  const totalSeconds = computed(() => (level.value?.minutes ?? 0) * 60)

  const currentMinute = computed(() => Math.floor(currentSecond.value / 60) + 1)

  const secondsInCurrentMinute = computed(() => currentSecond.value % 60)

  const secondsUntilNextMinute = computed(() => 60 - secondsInCurrentMinute.value)

  const isLastMinute = computed(
    () => level.value !== null && currentMinute.value >= level.value.minutes,
  )

  const isTimerComplete = computed(() => currentSecond.value >= totalSeconds.value)

  const isActive = computed(() => state.value.status === 'active')

  const isReady = computed(() => state.value.status === 'ready')

  // Methods
  async function load(): Promise<void> {
    state.value = { status: 'loading' }

    const [error, loaded] = await tryCatch(repo.getById(progressionId))

    if (error) {
      state.value = { status: 'error', error }
      return
    }

    if (!loaded) {
      state.value = { status: 'error', error: new Error('Progression not found') }
      return
    }

    if (loaded.isComplete) {
      state.value = { status: 'error', error: new Error('Progression already complete') }
      return
    }

    state.value = { status: 'ready', progression: loaded }
  }

  function startTimer(): void {
    if (state.value.status !== 'ready') return

    const prog = state.value.progression
    state.value = { status: 'active', progression: prog }
    currentSecond.value = 0

    timerInterval.value = setInterval(() => {
      currentSecond.value++

      if (currentSecond.value >= totalSeconds.value) {
        stopTimer()
      }
    }, 1000)
  }

  function stopTimer(): void {
    if (!timerInterval.value) {
      return
    }

    clearInterval(timerInterval.value)
    timerInterval.value = null
  }

  function cancelSession(): void {
    stopTimer()
    currentSecond.value = 0
    if (progression.value) {
      state.value = { status: 'ready', progression: progression.value }
    }
  }

  async function completeSession(completed: boolean): Promise<DbProgressionSession | null> {
    stopTimer()

    const currentProgression = progression.value
    if (!currentProgression) return null

    state.value = { status: 'completing' }

    // Compute next level in the feature layer, pass to repository
    const nextLevel =
      completed && !currentProgression.isComplete
        ? calculateNextLevel(currentProgression)
        : undefined

    const [error, session] = await tryCatch(repo.recordSession(progressionId, completed, nextLevel))

    if (error) {
      state.value = { status: 'error', error }
      return null
    }

    state.value = { status: 'completed', session }
    return session
  }

  // Cleanup
  onUnmounted(() => {
    stopTimer()
  })

  return {
    // State
    state,
    currentSecond,

    // Derived
    progression,
    level,
    totalSeconds,
    currentMinute,
    secondsInCurrentMinute,
    secondsUntilNextMinute,
    isLastMinute,
    isTimerComplete,
    isActive,
    isReady,

    // Methods
    load,
    startTimer,
    stopTimer,
    cancelSession,
    completeSession,
  }
}
