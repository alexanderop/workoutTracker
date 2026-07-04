import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { LiveQuery } from '@/db'
import { useLiveQuery } from '@/composables/useLiveQuery'
import { withSetup } from '../helpers/withSetup'

function createFakeLiveQuery<T>(initial: T) {
  let onChange: ((value: T) => void) | undefined
  const unsubscribe = vi.fn()

  const query: LiveQuery<T> = {
    get: vi.fn().mockResolvedValue(initial),
    subscribe: vi.fn((callback: (value: T) => void) => {
      onChange = callback
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
  it('should populate data with the initial get() snapshot when mounted', async () => {
    const { query } = createFakeLiveQuery(['snapshot-1'])

    const [result, app] = withSetup(() => useLiveQuery(() => query))
    await nextTick()
    await nextTick()

    expect(result.data.value).toEqual(['snapshot-1'])

    app.unmount()
  })

  it('should replace data with a pushed subscribe() value', async () => {
    const { query, emit } = createFakeLiveQuery(['snapshot-1'])

    const [result, app] = withSetup(() => useLiveQuery(() => query))
    await nextTick()
    await nextTick()

    emit(['snapshot-2'])

    expect(result.data.value).toEqual(['snapshot-2'])

    app.unmount()
  })

  it('should call unsubscribe when the component unmounts', async () => {
    const { query, unsubscribe } = createFakeLiveQuery(['snapshot-1'])

    const [, app] = withSetup(() => useLiveQuery(() => query))
    await nextTick()
    await nextTick()

    expect(unsubscribe).not.toHaveBeenCalled()

    app.unmount()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
