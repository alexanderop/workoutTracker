import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useRemoteFoodSearch } from '@/features/nutrition/composables/useRemoteFoodSearch'
import type { FoodSearchApiAdapter } from '@/features/nutrition/lib/foodData'

/**
 * Node-tier spec: the composable is watchers over `fetch`, with no DOM and no
 * IndexedDB. What it has to get right is ordering -- which query's results are
 * allowed on screen -- and that is decidable with fake timers.
 */

const DEBOUNCE_MS = 350

const adapter: FoodSearchApiAdapter = {
  searchUrl: (query) => `https://search.example/search?q=${encodeURIComponent(query)}`,
  parseSearchResponse: (json) => ({
    status: 'ok',
    foods: [
      {
        id: String(json),
        name: String(json),
        brand: null,
        servingGrams: null,
        nutrientsPer100Grams: {
          calories: 100,
          proteinGrams: 1,
          carbohydrateGrams: 1,
          fatGrams: 1,
        },
      },
    ],
  }),
}

/**
 * Drain the `await` chain inside `run()`, whatever branch it takes. Reading a
 * response body is not purely microtask work, so this has to let queued tasks
 * run too -- `advanceTimersByTimeAsync` is the fake-timer way to do that.
 */
async function flushAsyncWork(): Promise<void> {
  for (let index = 0; index < 5; index += 1) await vi.advanceTimersByTimeAsync(0)
}

/** Total attempts per settled query, and the pauses between them. */
const MAX_ATTEMPTS = 3
const RETRY_DELAYS_MS = [400, 1200]
/** Long enough to clear every backoff, for tests that only care about the end. */
const ALL_RETRIES_MS = RETRY_DELAYS_MS.reduce((total, delay) => total + delay, 0)

/** A fetch whose response the test releases by hand. */
function deferredFetch() {
  const pending = Promise.withResolvers<Response>()
  const fetchMock = vi.fn(() => pending.promise)
  vi.stubGlobal('fetch', fetchMock)
  return {
    fetchMock,
    respondWith: (body: string) => {
      pending.resolve(Response.json(body))
      // Two ticks: one for the fetch promise, one for `response.json()`.
      return Promise.resolve().then(() => {})
    },
    respondWithResponse: async (response: Response) => {
      pending.resolve(response)
      await flushAsyncWork()
    },
    rejectWith: async (error: Error) => {
      pending.reject(error)
      await flushAsyncWork()
    },
  }
}

/**
 * A fetch that answers each call from `outcomes` in order, so a test can say
 * "503, 503, then the page" and assert on what the panel ends up showing.
 */
function scriptedFetch(outcomes: ReadonlyArray<() => Promise<Response>>) {
  let call = 0
  const fetchMock = vi.fn(() => {
    const outcome = outcomes[Math.min(call, outcomes.length - 1)]
    call += 1
    if (outcome === undefined) throw new Error('scriptedFetch needs at least one outcome')
    return outcome()
  })
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock }
}

/** The HTML page Open Food Facts serves instead of shedding the connection. */
const outage = () =>
  Promise.resolve(
    new Response('<!DOCTYPE html><title>Page temporarily unavailable</title>', { status: 503 }),
  )
const answers = (body: string) => () => Promise.resolve(Response.json(body))

function runInScope(query: ReturnType<typeof ref<string>>) {
  const scope = effectScope()
  const state = scope.run(() => useRemoteFoodSearch(() => query.value ?? '', adapter).state)
  if (state === undefined) throw new Error('expected the composable to return its state')
  return { state, scope }
}

describe('useRemoteFoodSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Nothing in this file may reach the network. A test that forgets to
    // install its own stub should say so, rather than quietly searching the
    // real Open Food Facts and passing because a pending request looks exactly
    // like the `searching` state it was about to assert.
    vi.stubGlobal('fetch', () => {
      throw new Error('unstubbed fetch — call deferredFetch() or scriptedFetch() first')
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('stays idle below three characters and never touches the network', async () => {
    const { fetchMock } = deferredFetch()
    const query = ref('')
    const { state, scope } = runInScope(query)

    query.value = 'sk'
    await nextTick()
    vi.advanceTimersByTime(DEBOUNCE_MS * 2)
    await nextTick()

    expect(state.value).toEqual({ status: 'idle' })
    expect(fetchMock).not.toHaveBeenCalled()
    scope.stop()
  })

  it('shows the searching state immediately, then requests once the query settles', async () => {
    const { fetchMock } = deferredFetch()
    const query = ref('')
    const { state, scope } = runInScope(query)

    query.value = 'sky'
    await nextTick()

    // Before any timer runs: the stale list is already gone from the panel.
    expect(state.value).toEqual({ status: 'searching' })
    expect(fetchMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(DEBOUNCE_MS)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('searches a query the panel was mounted with, without waiting for a keystroke', async () => {
    const { fetchMock } = deferredFetch()
    const query = ref('skyr')
    const { state, scope } = runInScope(query)

    // The sheet keeps the query across tab switches, which unmount this panel.
    expect(state.value).toEqual({ status: 'searching' })
    vi.advanceTimersByTime(DEBOUNCE_MS)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('drops back to idle synchronously when the query falls below the minimum', async () => {
    deferredFetch()
    const query = ref('skyr')
    const { state, scope } = runInScope(query)

    await nextTick()
    vi.advanceTimersByTime(DEBOUNCE_MS)

    query.value = 'sk'
    await nextTick()

    // No waiting on the debounce: results for "skyr" must not stay tappable
    // under a field that reads "sk".
    expect(state.value).toEqual({ status: 'idle' })
    scope.stop()
  })

  it('never renders a request that resolves after the query moved on', async () => {
    const { respondWith } = deferredFetch()
    const query = ref('skyr')
    const { state, scope } = runInScope(query)

    await nextTick()
    vi.advanceTimersByTime(DEBOUNCE_MS)
    expect(state.value).toEqual({ status: 'searching' })

    // The user keeps typing while the first request is still in flight.
    query.value = 'skyr protein'
    await nextTick()

    await respondWith('skyr')
    await nextTick()

    // The answer to "skyr" is discarded rather than rendered under the new
    // query, which is still waiting on its own request.
    expect(state.value).toEqual({ status: 'searching' })
    scope.stop()
  })

  /**
   * The ways the real Open Food Facts search fails. All of them have to end in
   * `error` rather than hang on `searching` or throw: the panel keeps showing
   * the user's own library either way, and a permanent spinner is the one
   * outcome that reads as a broken app.
   */
  describe('when Open Food Facts does not answer with a usable page', () => {
    /** Settle the query, then let every backoff and attempt run to completion. */
    async function searchToCompletion(query: ReturnType<typeof ref<string>>) {
      const scoped = runInScope(query)
      await nextTick()
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
      await vi.advanceTimersByTimeAsync(ALL_RETRIES_MS)
      await flushAsyncWork()
      return scoped
    }

    it('reports an error once an outage outlasts every attempt', async () => {
      const { fetchMock } = scriptedFetch([outage])
      const { state, scope } = await searchToCompletion(ref('skyr'))

      expect(state.value).toEqual({ status: 'error' })
      expect(fetchMock).toHaveBeenCalledTimes(MAX_ATTEMPTS)
      scope.stop()
    })

    /**
     * The finding that made retrying worth having: this endpoint answers a run
     * of requests with an HTML 503 and then serves the very next one. Giving up
     * after the first is how a working service reads as "unreachable".
     */
    it('renders the page when a later attempt succeeds', async () => {
      const { fetchMock } = scriptedFetch([outage, outage, answers('skyr')])
      const { state, scope } = await searchToCompletion(ref('skyr'))

      expect(state.value).toMatchObject({ status: 'ready', foods: [{ name: 'skyr' }] })
      expect(fetchMock).toHaveBeenCalledTimes(3)
      scope.stop()
    })

    it('stops the moment it has an answer rather than using up its attempts', async () => {
      const { fetchMock } = scriptedFetch([answers('skyr')])
      const { state, scope } = await searchToCompletion(ref('skyr'))

      expect(state.value).toMatchObject({ status: 'ready' })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      scope.stop()
    })

    it('retries a request that never lands, as a dropped connection does', async () => {
      const { fetchMock } = scriptedFetch([
        () => Promise.reject(new TypeError('Failed to fetch')),
        answers('skyr'),
      ])
      const { state, scope } = await searchToCompletion(ref('skyr'))

      expect(state.value).toMatchObject({ status: 'ready' })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      scope.stop()
    })

    it('gives up immediately on a 4xx, which says the request itself is wrong', async () => {
      const { fetchMock } = scriptedFetch([
        () => Promise.resolve(new Response('no', { status: 400 })),
      ])
      const { state, scope } = await searchToCompletion(ref('skyr'))

      expect(state.value).toEqual({ status: 'error' })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      scope.stop()
    })

    it('gives up immediately on a 200 whose body is not JSON', async () => {
      const { fetchMock } = scriptedFetch([
        () => Promise.resolve(new Response('<html>captive portal</html>', { status: 200 })),
      ])
      const { state, scope } = await searchToCompletion(ref('skyr'))

      expect(state.value).toEqual({ status: 'error' })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      scope.stop()
    })

    it('stays on searching between attempts, never flashing an error it will retract', async () => {
      const { fetchMock } = scriptedFetch([outage, answers('skyr')])
      const { state, scope } = runInScope(ref('skyr'))

      await nextTick()
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
      await flushAsyncWork()

      // The first attempt has come back 503 and the backoff before the second
      // is still running. An `error` here would be a message the next attempt
      // takes straight back off the screen.
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(state.value).toEqual({ status: 'searching' })

      await vi.advanceTimersByTimeAsync(ALL_RETRIES_MS)
      await flushAsyncWork()
      expect(state.value).toMatchObject({ status: 'ready' })
      scope.stop()
    })

    /**
     * A retry outliving its query is the same defect as a slow response
     * outliving it, one backoff later: the field says "skyr protein" and the
     * list must not fill with answers to "skyr".
     */
    it('abandons its remaining attempts when the query moves on', async () => {
      const { fetchMock } = scriptedFetch([outage])
      const query = ref('skyr')
      const { state, scope } = runInScope(query)

      await nextTick()
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
      await flushAsyncWork()
      const attemptsForSkyr = fetchMock.mock.calls.length

      query.value = 'sk'
      await nextTick()
      await vi.advanceTimersByTimeAsync(ALL_RETRIES_MS)
      await flushAsyncWork()

      expect(state.value).toEqual({ status: 'idle' })
      expect(fetchMock).toHaveBeenCalledTimes(attemptsForSkyr)
      scope.stop()
    })
  })
})
