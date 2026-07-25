import { createApp } from 'vue'
import { describe, expect, it } from 'vitest'
import { succeed } from '@/lib/di/layer'
import { makeRuntime } from '@/lib/di/runtime'
import { Reference, Tag } from '@/lib/di/tag'
import { provideRuntime, useRuntimeContext } from '@/lib/di/vue'

describe('provideRuntime / useRuntimeContext', () => {
  it('resolves the service a runtime built through useRuntimeContext', () => {
    const tag = Tag<number>('count')
    const app = createApp({})
    provideRuntime(makeRuntime([succeed(tag, 42)]), app)

    const value = app.runWithContext(() => useRuntimeContext<number>().unsafeGet(tag))

    expect(value).toBe(42)
  })

  it('round-trips every service from a multi-layer runtime', () => {
    const countTag = Tag<number>('count')
    const nameTag = Tag<string>('name')
    const app = createApp({})
    provideRuntime(makeRuntime([succeed(countTag, 7), succeed(nameTag, 'seven')]), app)

    const [count, name] = app.runWithContext(() => {
      const context = useRuntimeContext<number | string>()
      return [context.unsafeGet(countTag), context.unsafeGet(nameTag)]
    })

    expect(count).toBe(7)
    expect(name).toBe('seven')
  })

  it('throws an error naming provideRuntime when no runtime was provided', () => {
    const app = createApp({})

    expect(() => app.runWithContext(() => useRuntimeContext())).toThrow(/provideRuntime/)
  })

  it('reads a Reference default off the bridged context even though no layer provided it', () => {
    const referenceTag = Reference<number>('ambient', () => 99)
    const providedTag = Tag<number>('provided')
    const app = createApp({})
    provideRuntime(makeRuntime([succeed(providedTag, 1)]), app)

    const value = app.runWithContext(() => useRuntimeContext<number>().get(referenceTag))

    expect(value).toBe(99)
  })

  it('keeps each app on its own runtime', () => {
    const tag = Tag<number>('count')
    const appA = createApp({})
    const appB = createApp({})
    provideRuntime(makeRuntime([succeed(tag, 1)]), appA)
    provideRuntime(makeRuntime([succeed(tag, 2)]), appB)

    const valueA = appA.runWithContext(() => useRuntimeContext<number>().unsafeGet(tag))
    const valueB = appB.runWithContext(() => useRuntimeContext<number>().unsafeGet(tag))

    expect(valueA).toBe(1)
    expect(valueB).toBe(2)
  })
})
