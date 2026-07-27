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
})
