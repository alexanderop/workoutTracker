import { describe, expect, it } from 'vitest'
import { fresh, scoped, succeed, sync } from '@/lib/di/layer'
import { makeRuntime, makeRuntimeOf } from '@/lib/di/runtime'
import { Tag } from '@/lib/di/tag'

describe('makeRuntimeOf', () => {
  it('resolves the built service through the typed context', () => {
    const tag = Tag<number>('count')
    const runtime = makeRuntimeOf(succeed(tag, 42))

    expect(runtime.context.get(tag)).toBe(42)
    expect(runtime.get(tag)).toBe(42)
  })
})

describe('makeRuntime', () => {
  it('resolves each layer through runtime.get', () => {
    const countTag = Tag<number>('count')
    const runtime = makeRuntime([succeed(countTag, 7)])

    expect(runtime.get(countTag)).toBe(7)
  })

  it('lets a later layer read an earlier layer service off the accumulated context', () => {
    const countTag = Tag<number>('count')
    const doubledTag = Tag<number>('doubled')
    const runtime = makeRuntime([
      succeed(countTag, 21),
      sync(doubledTag, (ctx) => ctx.unsafeGet(countTag) * 2),
    ])

    expect(runtime.get(doubledTag)).toBe(42)
  })

  it('builds a non-fresh layer at most once per runtime even if listed twice', () => {
    const tag = Tag<number>('token')
    const tokens: Array<number> = []
    const layer = sync(tag, () => tokens.push(1))
    const runtime = makeRuntime([layer, layer])

    expect(runtime.get(tag)).toBe(1)
  })

  it('memoizes per layer object identity, not per tag key', () => {
    const tag = Tag<number>('count')
    const tokens: Array<number> = []
    const build = () => tokens.push(1)
    const layerA = sync(tag, build)
    const layerB = sync(tag, build)
    const runtime = makeRuntime([layerA, layerB])

    // Two distinct layer objects sharing a tag key both get built (unlike
    // the same layer listed twice, which builds once) -- the context ends up
    // holding whichever built last.
    expect(runtime.get(tag)).toBe(2)
  })

  it('rebuilds a fresh layer on every occurrence', () => {
    const tag = Tag<number>('tokens')
    const tokens: Array<number> = []
    const layer = fresh(sync(tag, () => tokens.push(1)))
    const runtime = makeRuntime([layer, layer])

    // Both builds ran; the last one in array order wins for this tag's slot,
    // and it reflects the second build having actually happened.
    expect(runtime.get(tag)).toBe(2)
  })

  it('hands each layer a snapshot, so a context captured at build time never gains later services', () => {
    const tagA = Tag<{ lookUpB: () => number | undefined }>('A')
    const tagB = Tag<number>('B')
    const runtime = makeRuntime([
      sync(tagA, (ctx) => ({ lookUpB: () => ctx.getOption(tagB) })),
      succeed(tagB, 5),
    ])

    expect(runtime.get(tagA).lookUpB()).toBeUndefined()
    expect(runtime.get(tagB)).toBe(5)
  })

  it('runs a scoped layer release on dispose', () => {
    const tag = Tag<{ id: number }>('resource')
    const released: Array<number> = []
    const layer = scoped(
      tag,
      () => ({ id: 9 }),
      (resource) => released.push(resource.id),
    )
    const runtime = makeRuntime([layer])

    expect(released).toEqual([])
    runtime.dispose()
    expect(released).toEqual([9])
  })
})
