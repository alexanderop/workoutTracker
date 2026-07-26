import { onMounted, ref, computed } from 'vue'
import type { ProgressionsRepository } from '@/db/interfaces'
import type { DbProgression, DbProgressionSession } from '@/db/schema'
import type { Context } from '@/lib/di/context'
import { useRuntimeContext } from '@/lib/di/vue'
import { tryCatch } from '@/lib/tryCatch'
import {
  getCurrentLevel,
  calculateProgress,
  getProgressionPhase,
  formatLevelCompact,
} from '../lib/progressionLogic'
import { ProgressionRepo } from '../services'
import type { ProgressionLevel, ProgressionPhase } from '../types'

// ============================================
// Types
// ============================================

type ProgressionDetailState =
  | { status: 'loading' }
  | { status: 'success'; progression: DbProgression; sessions: ReadonlyArray<DbProgressionSession> }
  | { status: 'not-found' }
  | { status: 'error'; error: Error }

// ============================================
// Composable
// ============================================

/**
 * Single progression with detail info and session history.
 *
 * The repository arrives through a `Context` defaulted to the app runtime's
 * context via `useRuntimeContext()`, so a caller can inject a fake in tests
 * instead of reaching for the global singleton (ADR 004:
 * brain/decisions/004-db-in-di.md).
 */
export function useProgression(
  progressionId: string,
  ctx: Context<ProgressionsRepository> = useRuntimeContext<ProgressionsRepository>(),
) {
  const repo = ctx.get(ProgressionRepo)
  const state = ref<ProgressionDetailState>({ status: 'loading' })
  const isDeleting = ref(false)

  // Derived state
  const progression = computed(() =>
    state.value.status === 'success' ? state.value.progression : null,
  )

  const sessions = computed(() => (state.value.status === 'success' ? state.value.sessions : []))

  const currentLevel = computed((): ProgressionLevel | null =>
    progression.value ? getCurrentLevel(progression.value) : null,
  )

  const phase = computed((): ProgressionPhase | null =>
    progression.value ? getProgressionPhase(progression.value) : null,
  )

  const progress = computed((): number =>
    progression.value ? calculateProgress(progression.value) : 0,
  )

  const levelDisplay = computed((): string =>
    currentLevel.value ? formatLevelCompact(currentLevel.value) : '',
  )

  // Methods
  async function loadProgression(): Promise<void> {
    state.value = { status: 'loading' }

    const [error, loaded] = await tryCatch(repo.getById(progressionId))

    if (error) {
      state.value = { status: 'error', error }
      return
    }

    if (!loaded) {
      state.value = { status: 'not-found' }
      return
    }

    // Load session history
    const [sessionsError, sessionHistory] = await tryCatch(repo.getSessionHistory(progressionId))

    state.value = {
      status: 'success',
      progression: loaded,
      sessions: sessionsError ? [] : sessionHistory,
    }
  }

  async function deleteProgression(): Promise<boolean> {
    if (state.value.status !== 'success' || isDeleting.value) return false

    isDeleting.value = true
    const [error] = await tryCatch(repo.delete(progressionId))
    isDeleting.value = false

    return !error
  }

  // Lifecycle
  onMounted(() => {
    loadProgression()
  })

  return {
    state,
    progression,
    sessions,
    currentLevel,
    phase,
    progress,
    levelDisplay,
    isDeleting,
    reload: loadProgression,
    deleteProgression,
  }
}
