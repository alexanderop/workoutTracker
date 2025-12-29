import { onMounted, ref, computed } from 'vue'
import { getProgressionsRepository } from '@/db'
import type { DbProgression, DbProgressionSession } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import {
  getCurrentLevel,
  calculateProgress,
  getProgressionPhase,
  formatLevelCompact,
} from '../lib/progressionLogic'
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
 */
export function useProgression(progressionId: string) {
  const state = ref<ProgressionDetailState>({ status: 'loading' })
  const isDeleting = ref(false)

  // Derived state
  const progression = computed(() =>
    state.value.status === 'success' ? state.value.progression : null,
  )

  const sessions = computed(() =>
    state.value.status === 'success' ? state.value.sessions : [],
  )

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

    const repo = getProgressionsRepository()
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
    const [sessionsError, sessionHistory] = await tryCatch(
      repo.getSessionHistory(progressionId),
    )

    state.value = {
      status: 'success',
      progression: loaded,
      sessions: sessionsError ? [] : sessionHistory,
    }
  }

  async function deleteProgression(): Promise<boolean> {
    if (state.value.status !== 'success' || isDeleting.value) return false

    isDeleting.value = true
    const [error] = await tryCatch(
      getProgressionsRepository().delete(progressionId),
    )
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
