import type { Ref } from 'vue'
import { createPersistenceCore } from '@/composables/persistence/createPersistenceCore'
import { getActiveWorkoutRepository, getWorkoutsRepository } from '@/db'
import { dbToWorkout, workoutToDb } from '@/db/converters'
import type { DbCompletedWorkout } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import type { Workout } from '@/types/workout'
import type { Effect } from './types'

type PersistenceCore = ReturnType<typeof createPersistenceCore<Workout, ReturnType<typeof workoutToDb>>>

type EffectRunner = {
  core: PersistenceCore
  workoutRef: Ref<Workout>
  markInitialized: () => void
  completeWorkout: (
    notes?: string,
    durationOverrideSeconds?: number,
  ) => Promise<DbCompletedWorkout | null>
  saveNow: () => Promise<void>
  discardActive: () => Promise<void>
  loadActive: () => Promise<Workout | null>
  hasActive: () => Promise<boolean>
}

export function createEffectRunner(workoutRef: Ref<Workout>): EffectRunner {
  const repo = getActiveWorkoutRepository()

  const core = createPersistenceCore({
    source: workoutRef,
    toDb: () => workoutToDb(workoutRef.value),
    fromDb: dbToWorkout,
    repository: {
      get: () => repo.get(),
      save: (database) => repo.save(database),
      clear: () => repo.clear(),
      exists: () => repo.exists(),
    },
    isEmpty: (w) => w.blocks.length === 0,
  })

  async function loadActive(): Promise<Workout | null> {
    return core.load()
  }

  async function hasActive(): Promise<boolean> {
    return core.exists()
  }

  async function discardActive(): Promise<void> {
    await core.discard()
  }

  async function completeWorkout(
    notes = '',
    durationOverrideSeconds?: number,
  ): Promise<DbCompletedWorkout | null> {
    const [getError, databaseWorkout] = await tryCatch(repo.get())
    if (getError) {
      core.persistenceState.value = { status: 'error', error: getError }
      return null
    }
    if (!databaseWorkout) return null

    databaseWorkout.mode = 'completed'

    const [completeError, completed] = await tryCatch(
      getWorkoutsRepository().completeWorkout(databaseWorkout, notes, durationOverrideSeconds),
    )
    if (completeError) {
      core.persistenceState.value = { status: 'error', error: completeError }
      return null
    }

    core.hasUnsavedChanges.value = false
    return completed
  }

  return {
    core,
    workoutRef,
    markInitialized: core.markInitialized,
    completeWorkout,
    saveNow: core.saveNow,
    discardActive,
    loadActive,
    hasActive,
  }
}

export async function runEffects(
  runner: EffectRunner,
  effects: ReadonlyArray<Effect>,
): Promise<void> {
  for (const effect of effects) {
    switch (effect.kind) {
      case 'persist': {
        // createPersistenceCore's watchDebounced auto-saves on source changes.
        // This effect is advisory — no explicit action needed.
        break
      }
      case 'clearPersisted': {
        await runner.discardActive()
        break
      }
      case 'completeWorkout': {
        await runner.completeWorkout(effect.notes, effect.durationOverrideSeconds)
        break
      }
    }
  }
}
