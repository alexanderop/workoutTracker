import { onMounted, ref } from 'vue'
import { getProgressionsRepository } from '@/db'
import type { DbProgression } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import { getCurrentLevel, calculateProgress } from '../lib/progressionLogic'
import type { ProgressionLevel } from '../types'

// ============================================
// Types
// ============================================

export type ProgressionListItem = {
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
 */
export function useProgressions() {
  const state = ref<ProgressionsState>({ status: 'loading' })

  async function loadProgressions(): Promise<void> {
    state.value = { status: 'loading' }

    const repo = getProgressionsRepository()
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
