import { onScopeDispose, ref, type Ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { tryCatch } from '@/lib/tryCatch'

const AUTO_SAVE_DEBOUNCE_MS = 1000

/**
 * Persistence state using discriminated union for type safety.
 */
export type PersistenceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'saving' }
  | { status: 'error'; error: Error }

/**
 * Configuration for the persistence core factory.
 */
export type PersistenceConfig<TDomain, TDb> = {
  /** The reactive ref containing the domain data */
  source: Ref<TDomain>
  /** Convert domain model to database model */
  toDb: () => TDb
  /** Convert database model to domain model */
  fromDb: (db: TDb) => TDomain
  /** Repository methods for persistence */
  repository: {
    get: () => Promise<TDb | undefined>
    save: (db: TDb) => Promise<void>
    clear: () => Promise<void>
    exists: () => Promise<boolean>
  }
  /** Check if the domain data is empty (should trigger clear instead of save) */
  isEmpty: (domain: TDomain) => boolean
  /** Debounce interval for auto-save in milliseconds */
  debounceMs?: number
}

/**
 * Factory function for creating persistence composables.
 * Handles auto-save, loading, error state, and cleanup.
 *
 * @example
 * ```ts
 * const core = createPersistenceCore({
 *   source: workout,
 *   toDb: () => workoutToDb(workout.value, startedAt),
 *   fromDb: dbToWorkout,
 *   repository: getActiveWorkoutRepository(),
 *   isEmpty: (w) => w.blocks.length === 0,
 * })
 * ```
 */
export function createPersistenceCore<TDomain, TDb>(config: PersistenceConfig<TDomain, TDb>) {
  const {
    source,
    toDb,
    fromDb,
    repository,
    isEmpty,
    debounceMs = AUTO_SAVE_DEBOUNCE_MS,
  } = config

  // State
  const persistenceState = ref<PersistenceState>({ status: 'idle' })
  const hasUnsavedChanges = ref(false)
  const isInitialized = ref(false)

  // Track if the composable scope is disposed (component unmounted)
  // This prevents pending debounced callbacks from writing stale data
  let isDisposed = false

  onScopeDispose(() => {
    isDisposed = true
  })

  // Track changes for unsaved indicator
  watch(
    source,
    () => {
      if (isInitialized.value) {
        hasUnsavedChanges.value = true
      }
    },
    { deep: true },
  )

  /**
   * Perform the actual save operation to the database.
   * Extracted to avoid duplication between auto-save and saveNow().
   */
  async function performSave(): Promise<void> {
    persistenceState.value = { status: 'saving' }

    const dbData = toDb()
    const [saveError] = await tryCatch(repository.save(dbData))

    if (saveError) {
      persistenceState.value = { status: 'error', error: saveError }
      return
    }

    hasUnsavedChanges.value = false
    persistenceState.value = { status: 'idle' }
  }

  // Auto-save on changes (debounced)
  watchDebounced(
    source,
    async (newValue) => {
      // Skip save if scope is disposed (component unmounted)
      if (isDisposed) return
      if (!isInitialized.value) return

      // Empty data means clear instead of save
      if (isEmpty(newValue)) {
        const [clearError] = await tryCatch(repository.clear())
        if (clearError) {
          persistenceState.value = { status: 'error', error: clearError }
          return
        }
        hasUnsavedChanges.value = false
        return
      }

      await performSave()
    },
    { debounce: debounceMs, deep: true },
  )

  /**
   * Load data from the database.
   * Returns null if no data exists.
   */
  async function load(): Promise<TDomain | null> {
    persistenceState.value = { status: 'loading' }

    const [loadError, dbData] = await tryCatch(repository.get())

    if (loadError) {
      persistenceState.value = { status: 'error', error: loadError }
      return null
    }

    persistenceState.value = { status: 'idle' }

    if (dbData) {
      return fromDb(dbData)
    }
    return null
  }

  /**
   * Check if data exists in the database.
   */
  async function exists(): Promise<boolean> {
    const [error, result] = await tryCatch(repository.exists())

    if (error) {
      persistenceState.value = { status: 'error', error }
      return false
    }

    return result
  }

  /**
   * Discard data without saving to history.
   */
  async function discard(): Promise<void> {
    const [error] = await tryCatch(repository.clear())

    if (error) {
      persistenceState.value = { status: 'error', error }
      return
    }

    hasUnsavedChanges.value = false
  }

  /**
   * Mark persistence as initialized.
   * Call this after loading or creating new data.
   */
  function markInitialized(): void {
    isInitialized.value = true
  }

  /**
   * Force save the current state immediately.
   */
  async function saveNow(): Promise<void> {
    if (isEmpty(source.value)) return
    await performSave()
  }

  return {
    // State
    persistenceState,
    hasUnsavedChanges,
    isInitialized,

    // Methods
    load,
    exists,
    discard,
    markInitialized,
    saveNow,
  }
}
