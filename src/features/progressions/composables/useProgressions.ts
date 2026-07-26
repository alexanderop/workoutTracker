import { onMounted, ref } from 'vue'
import type { ProgressionsRepository } from '@/db/interfaces'
import type { DbProgression } from '@/db/schema'
import type { Context } from '@/lib/di/context'
import { useRuntimeContext } from '@/lib/di/vue'
import { tryCatch } from '@/lib/tryCatch'
import { getCurrentLevel, calculateProgress } from '../lib/progressionLogic'
import { ProgressionRepo } from '../services'
import type { ProgressionLevel } from '../types'

// ============================================
// Types
// ============================================

type ProgressionListItem = {
  id: string
  name: string
  level: ProgressionLevel
  progress: number
  isComplete: boolean
  sessionsCompleted: number
}

type ProgressionsState =
  | { status: 'loading' }
  | { status: 'success'; items: ReadonlyArray<ProgressionListItem> }
  | { status: 'error'; error: Error }

// ============================================
// Helpers
// ============================================

function toListItem(progression: DbProgression): ProgressionListItem {
  return {
    id: progression.id,
    name: progression.name,
    level: getCurrentLevel(progression),
    progress: calculateProgress(progression),
    isComplete: progression.isComplete,
    sessionsCompleted: progression.sessionsCompleted,
  }
}

// ============================================
// Composable
// ============================================

/**
 * List all progressions with current level info.
 *
 * The repository arrives through a `Context` defaulted to the app runtime's
 * context via `useRuntimeContext()`, so a caller can inject a fake in tests
 * instead of reaching for the global singleton (ADR 004:
 * brain/decisions/004-db-in-di.md).
 */
export function useProgressions(
  ctx: Context<ProgressionsRepository> = useRuntimeContext<ProgressionsRepository>(),
) {
  const repo = ctx.get(ProgressionRepo)
  const state = ref<ProgressionsState>({ status: 'loading' })

  async function loadProgressions(): Promise<void> {
    state.value = { status: 'loading' }

    const [error, progressions] = await tryCatch(repo.getAll())

    if (error) {
      state.value = { status: 'error', error }
      return
    }

    state.value = {
      status: 'success',
      items: progressions.map(toListItem),
    }
  }

  onMounted(() => {
    loadProgressions()
  })

  return {
    state,
    reload: loadProgressions,
  }
}
