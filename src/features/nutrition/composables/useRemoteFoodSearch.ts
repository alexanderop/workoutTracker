import { computed, toValue, ref, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { tryOnScopeDispose, watchDebounced } from '@vueuse/core'
import { tryCatch } from '@/lib/tryCatch'
import type { ExternalFoodHit, FoodSearchApiAdapter } from '../lib/foodData'
import { openFoodFactsAdapter } from '../lib/openFoodFacts'

/**
 * What the panel shows below its own results. A discriminated union rather
 * than `loading`/`failed`/`hits` refs: "searching *and* failed" is not a
 * reachable state and should not be representable.
 */
export type RemoteFoodSearchState =
  | { readonly status: 'idle' }
  | { readonly status: 'searching' }
  | { readonly status: 'ready'; readonly foods: ReadonlyArray<ExternalFoodHit> }
  | { readonly status: 'error' }

/**
 * Shortest query worth a round trip: three characters search, one and two do
 * not. Three is where real foods start ("egg", "oat", "ham"), and below it the
 * result set is too broad to be worth the request.
 */
const MIN_QUERY_LENGTH = 3
/** Long enough to swallow a word being typed, short enough to feel like a search. */
const DEBOUNCE_MS = 350
const SEARCH_TIMEOUT_MS = 10_000

/**
 * Free-text search against an external food database, alongside the local
 * library rather than instead of it.
 *
 * Deliberately additive and failure-tolerant: the query drives the local list
 * synchronously, and this only ever appends a second section. Offline, slow, or
 * rate-limited all land in `error`, which the panel renders as one quiet line —
 * the user's own foods keep working, which is the whole point of the app being
 * local-first.
 */
export function useRemoteFoodSearch(
  query: MaybeRefOrGetter<string>,
  adapter: FoodSearchApiAdapter = openFoodFactsAdapter,
): { readonly state: Readonly<Ref<RemoteFoodSearchState>> } {
  const state = ref<RemoteFoodSearchState>({ status: 'idle' })
  let inFlight: AbortController | null = null

  function cancelInFlight(): void {
    inFlight?.abort()
    inFlight = null
  }

  async function run(term: string): Promise<void> {
    // Aborting the previous request is what keeps a slow answer to "ska" from
    // landing on top of a fast answer to "skyr".
    cancelInFlight()
    const controller = new AbortController()
    inFlight = controller
    state.value = { status: 'searching' }

    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(SEARCH_TIMEOUT_MS)])
    const [requestError, response] = await tryCatch(fetch(adapter.searchUrl(term), { signal }))
    if (controller.signal.aborted) return
    if (requestError !== null || !response.ok) {
      state.value = { status: 'error' }
      return
    }

    const [bodyError, json] = await tryCatch<unknown>(response.json())
    if (controller.signal.aborted) return
    if (bodyError !== null) {
      state.value = { status: 'error' }
      return
    }

    const result = adapter.parseSearchResponse(json)
    state.value = result.status === 'ok' ? { status: 'ready', foods: result.foods } : result
  }

  const term = computed(() => toValue(query).trim())
  const searchable = computed(() => term.value.length >= MIN_QUERY_LENGTH)

  /**
   * Undebounced, so the moment the query changes the previous query's hits stop
   * being on screen and tappable. Debouncing this too would leave hits for
   * "skyr" staged-able while the field already reads "skyr protein", and would
   * let a request that lands inside the debounce window render under the new
   * query.
   */
  watch(
    term,
    () => {
      cancelInFlight()
      state.value = searchable.value ? { status: 'searching' } : { status: 'idle' }
    },
    // `immediate` matters: the panel unmounts on every tab switch and remounts
    // with the query still in the field, so a plain watcher would leave a
    // returning user with no remote section until they typed another letter.
    { immediate: true },
  )

  // Only the request itself is debounced.
  watchDebounced(
    term,
    (current) => {
      if (searchable.value) void run(current)
    },
    { debounce: DEBOUNCE_MS, immediate: true },
  )

  // The sheet closes mid-flight far more often than not — the user found what
  // they wanted in their own library before the network answered.
  tryOnScopeDispose(cancelInFlight)

  return { state }
}
