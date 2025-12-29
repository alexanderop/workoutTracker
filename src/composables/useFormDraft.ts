import { isRef, onMounted, onScopeDispose, readonly, ref, toRaw, type Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { getDraftsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import type { DraftKey } from '@/db/schema'

type FormDraftOptions<T> = {
  /** Debounce delay in milliseconds (default: 1500) */
  debounce?: number
  /** Determine if form state is empty/default (should not be saved as draft) */
  isEmpty?: (state: T) => boolean
}

/**
 * JSON replacer that handles non-serializable values.
 * Blobs are replaced with null (drafts don't preserve image previews).
 */
function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Blob) {
    return null
  }
  return value
}

/**
 * Create a plain JS object from a potentially reactive object.
 * Removes Vue reactivity and handles Blobs by setting them to null.
 */
function toPlainObject<T>(obj: T): T {
  const raw = toRaw(obj)
  return JSON.parse(JSON.stringify(raw, jsonReplacer))
}

/**
 * Validate that draft data only contains keys present in the template object.
 * Protects against corrupted or outdated draft data being restored.
 */
function isValidDraftData<T extends object>(data: unknown, template: T): data is Partial<T> {
  if (typeof data !== 'object' || data === null) return false
  const templateKeys = new Set(Object.keys(template))
  return Object.keys(data).every((key) => templateKeys.has(key))
}

/**
 * Auto-save form state to IndexedDB and restore on mount.
 * Prevents users from losing progress when navigating away during form creation.
 *
 * @param key - Unique identifier for the draft (e.g., 'benchmark-create')
 * @param formState - Reactive form state object to persist
 * @param options - Configuration options
 *
 * @example
 * const formState = reactive({ name: '', exercises: [] })
 * const { hasDraft, clearDraft } = useFormDraft('benchmark-create', formState)
 *
 * // On successful save
 * async function save() {
 *   await saveBenchmark(formState)
 *   await clearDraft()
 * }
 *
 * // Discard button
 * function discard() {
 *   resetForm()
 *   clearDraft()
 * }
 */
// Use shorter debounce in tests to avoid long waits
const DEFAULT_DEBOUNCE_MS = import.meta.env.MODE === 'test' ? 50 : 1500

export function useFormDraft<T extends object>(
  key: DraftKey,
  formState: T | Ref<T>,
  options: FormDraftOptions<T> = {},
) {
  const { debounce = DEFAULT_DEBOUNCE_MS, isEmpty } = options
  const hasDraft = ref(false)

  // Track disposal to prevent writes after component unmount
  // This guards against race conditions where the debounced watcher
  // fires after cleanup but before the watcher is fully stopped
  let isDisposed = false
  onScopeDispose(() => {
    isDisposed = true
  })

  // Load draft on mount
  onMounted(async () => {
    const draftsRepository = getDraftsRepository()
    const [getError, draft] = await tryCatch(draftsRepository.get(key))
    if (getError || !draft?.data) return

    const state = isRef(formState) ? formState.value : formState

    // Validate draft data before restoring to protect against corrupted/outdated data
    if (!isValidDraftData(draft.data, state)) {
      // Invalid draft schema - clear it
      await tryCatch(draftsRepository.delete(key))
      return
    }

    Object.assign(state, draft.data)
    hasDraft.value = true
  })

  // Auto-save with VueUse's watchDebounced
  // Use toPlainObject to remove Vue reactivity and handle Blobs
  watchDebounced(
    formState,
    async (state) => {
      // Skip save if component has been unmounted
      if (isDisposed) return

      // Skip save if form is empty/default state
      const rawState = isRef(state) ? state.value : state
      if (isEmpty?.(rawState)) return

      const plainState = toPlainObject(state)
      const [error] = await tryCatch(getDraftsRepository().save(key, plainState))
      if (!error) {
        hasDraft.value = true
      }
    },
    { debounce, deep: true },
  )

  /**
   * Clear the draft from IndexedDB.
   * Call this on successful save or when user discards the form.
   */
  async function clearDraft(): Promise<void> {
    const [error] = await tryCatch(getDraftsRepository().delete(key))
    if (!error) {
      hasDraft.value = false
    }
  }

  return {
    /** Whether a draft exists for this form */
    hasDraft: readonly(hasDraft),
    /** Clear the draft from storage */
    clearDraft,
  }
}
