import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, shallowRef } from 'vue'
import type { LiveQuery } from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'

// Mirrors the LiveQuery contract: subscribe() emits the current snapshot
// asynchronously right after subscribing (as Dexie's liveQuery does), then
// again on every change — unless already unsubscribed.
function createFakeLiveQuery<T>(initial: T) {
  let onChange: ((value: T) => void) | undefined
  const unsubscribe = vi.fn(() => {
    onChange = undefined
  })

  const query: LiveQuery<T> = {
    get: vi.fn().mockResolvedValue(initial),
    subscribe: vi.fn((callback: (value: T) => void) => {
      onChange = callback
      queueMicrotask(() => onChange?.(initial))
      return unsubscribe
    }),
  }

  return {
    query,
    unsubscribe,
    emit: (value: T) => onChange?.(value),
  }
}

describe('useLiveQuery', () => {
  it('should be defined', () => {
    expect(useLiveQuery).toBeDefined()
  })

  it("should populate data with the subscription's initial snapshot", async () => {
    const { query } = createFakeLiveQuery(['snapshot-1'])

    const scope = effectScope()
    const result = scope.run(() => useLiveQuery(() => query))!

    await vi.waitFor(() => expect(result.data.value).toEqual(['snapshot-1']))

    scope.stop()
  })

  it('should replace data with a pushed subscribe() value', async () => {
    const { query, emit } = createFakeLiveQuery(['snapshot-1'])

    const scope = effectScope()
    const result = scope.run(() => useLiveQuery(() => query))!
    await vi.waitFor(() => expect(result.data.value).toEqual(['snapshot-1']))

    emit(['snapshot-2'])

    expect(result.data.value).toEqual(['snapshot-2'])

    scope.stop()
  })

  it('should unsubscribe when the owning scope is disposed', async () => {
    const { query, unsubscribe } = createFakeLiveQuery(['snapshot-1'])

    const scope = effectScope()
    scope.run(() => useLiveQuery(() => query))

    expect(unsubscribe).not.toHaveBeenCalled()

    scope.stop()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('should unsubscribe on manual stop() without double-unsubscribing on scope dispose', async () => {
    const { query, unsubscribe } = createFakeLiveQuery(['initial'])

    const scope = effectScope()
    const result = scope.run(() => useLiveQuery(() => query))!
    await vi.waitFor(() => expect(result.data.value).toEqual(['initial']))

    result.stop()
    expect(unsubscribe).toHaveBeenCalledOnce()

    scope.stop()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('should tear down the old query and subscribe to a new one when a factory dependency changes', async () => {
    const first = createFakeLiveQuery(['first'])
    const second = createFakeLiveQuery(['second'])
    const source = shallowRef(1)
    const make = vi.fn(() => (source.value === 1 ? first.query : second.query))

    const scope = effectScope()
    const result = scope.run(() => useLiveQuery(make))!
    await vi.waitFor(() => expect(result.data.value).toEqual(['first']))

    source.value = 2

    await vi.waitFor(() => expect(first.unsubscribe).toHaveBeenCalledOnce())
    await vi.waitFor(() => expect(result.data.value).toEqual(['second']))
    expect(make).toHaveBeenCalledTimes(2)

    scope.stop()
    expect(second.unsubscribe).toHaveBeenCalledOnce()
  })

  it('should not resubscribe after stop() even when a factory dependency changes', async () => {
    const first = createFakeLiveQuery(['first'])
    const second = createFakeLiveQuery(['second'])
    const source = shallowRef(1)
    const make = vi.fn(() => (source.value === 1 ? first.query : second.query))

    const scope = effectScope()
    const result = scope.run(() => useLiveQuery(make))!
    await vi.waitFor(() => expect(result.data.value).toEqual(['first']))

    result.stop()
    source.value = 2
    await nextTick()

    expect(make).toHaveBeenCalledTimes(1)
    expect(second.query.subscribe).not.toHaveBeenCalled()
    expect(result.data.value).toEqual(['first'])

    scope.stop()
  })
})
