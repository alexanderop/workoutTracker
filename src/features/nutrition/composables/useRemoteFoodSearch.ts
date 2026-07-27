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
/** Bounds the whole search, retries included, not each attempt. */
const SEARCH_TIMEOUT_MS = 10_000

/**
 * How many times one settled query is sent, first attempt included.
 *
 * Open Food Facts' search backend sheds load by answering with an HTML 503,
 * often for several requests in a row while the very next one succeeds. One
 * attempt therefore reports "unreachable" for a service that is answering —
 * the same empty panel this whole feature is meant to stop showing. Three
 * attempts is where the added wait stops buying much: the user is still
 * reading their own library, which rendered synchronously and never waited.
 */
const MAX_ATTEMPTS = 3
/** Backoff before the second and third attempt. Short — a phone is waiting. */
const RETRY_DELAYS_MS = [400, 1200] as const

/**
 * What one attempt tells the caller to do next, rather than a bare boolean:
 * "the server is struggling" and "the server answered something unusable" both
 * fail, and only one of them is worth sending again.
 */
type AttemptOutcome =
  | { readonly kind: 'answered'; readonly json: unknown }
  | { readonly kind: 'retryable' }
  | { readonly kind: 'final' }

/** A cancellable pause, so a retry in flight does not outlive the query. */
function delay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const timer = setTimeout(resolve, milliseconds)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

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

  async function attempt(term: string, signal: AbortSignal): Promise<AttemptOutcome> {
    const [requestError, response] = await tryCatch(fetch(adapter.searchUrl(term), { signal }))
    // A request that never lands is the shape offline, a dropped connection and
    // a CORS rejection all take. Some of those come good on the next try, and
    // for the ones that do not this costs a device with no network two more
    // immediate rejections.
    if (requestError !== null) return { kind: 'retryable' }
    // 5xx is the load-shedding this endpoint does under pressure. A 4xx says
    // this exact request is wrong, and it will be just as wrong twice.
    if (!response.ok) return { kind: response.status >= 500 ? 'retryable' : 'final' }

    const [bodyError, json] = await tryCatch<unknown>(response.json())
    // A 200 carrying something that is not JSON is a captive portal or a
    // rewritten response, not a server under load — asking again changes nothing.
    return bodyError === null ? { kind: 'answered', json } : { kind: 'final' }
  }

  async function run(term: string): Promise<void> {
    // Aborting the previous request is what keeps a slow answer to "ska" from
    // landing on top of a fast answer to "skyr".
    cancelInFlight()
    const controller = new AbortController()
    inFlight = controller
    state.value = { status: 'searching' }

    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(SEARCH_TIMEOUT_MS)])

    for (let index = 0; index < MAX_ATTEMPTS; index += 1) {
      if (index > 0) {
        await delay(RETRY_DELAYS_MS[index - 1] ?? 0, signal)
        if (controller.signal.aborted) return
      }

      const outcome = await attempt(term, signal)
      // Re-checked after every await: the query can move on mid-retry, and an
      // answer to a term the field no longer holds must never be rendered.
      if (controller.signal.aborted) return

      if (outcome.kind === 'answered') {
        const result = adapter.parseSearchResponse(outcome.json)
        state.value = result.status === 'ok' ? { status: 'ready', foods: result.foods } : result
        return
      }
      if (outcome.kind === 'final') break
    }

    state.value = { status: 'error' }
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
