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

function runInScope(query: ReturnType<typeof ref<string>>) {
  const scope = effectScope()
  const state = scope.run(() => useRemoteFoodSearch(() => query.value ?? '', adapter).state)
  if (state === undefined) throw new Error('expected the composable to return its state')
  return { state, scope }
}

describe('useRemoteFoodSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
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
   * The three ways the real Open Food Facts search fails, all of which have to
   * land in `error` rather than hang on `searching` or throw: the panel keeps
   * showing the user's own library either way, and a permanent spinner is the
   * one outcome that reads as a broken app.
   */
  describe('when Open Food Facts does not answer with a usable page', () => {
    it('reports an error for an outage, which OFF serves as an HTML 503', async () => {
      const { respondWithResponse } = deferredFetch()
      const query = ref('skyr')
      const { state, scope } = runInScope(query)

      await nextTick()
      vi.advanceTimersByTime(DEBOUNCE_MS)
      await respondWithResponse(
        new Response('<!DOCTYPE html><title>Page temporarily unavailable</title>', {
          status: 503,
          headers: { 'content-type': 'text/html' },
        }),
      )

      expect(state.value).toEqual({ status: 'error' })
      scope.stop()
    })

    it('reports an error when the request never lands, as offline or CORS does', async () => {
      const { rejectWith } = deferredFetch()
      const query = ref('skyr')
      const { state, scope } = runInScope(query)

      await nextTick()
      vi.advanceTimersByTime(DEBOUNCE_MS)
      await rejectWith(new TypeError('Failed to fetch'))

      expect(state.value).toEqual({ status: 'error' })
      scope.stop()
    })

    it('reports an error for a 200 whose body is not JSON', async () => {
      const { respondWithResponse } = deferredFetch()
      const query = ref('skyr')
      const { state, scope } = runInScope(query)

      await nextTick()
      vi.advanceTimersByTime(DEBOUNCE_MS)
      await respondWithResponse(new Response('<html>captive portal</html>', { status: 200 }))

      expect(state.value).toEqual({ status: 'error' })
      scope.stop()
    })
  })
})
