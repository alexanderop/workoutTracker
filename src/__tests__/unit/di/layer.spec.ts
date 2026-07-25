import { describe, expect, it } from 'vitest'
import { empty } from '@/lib/di/context'
import { fresh, scoped, succeed, sync } from '@/lib/di/layer'
import { makeScope } from '@/lib/di/scope'
import { Tag } from '@/lib/di/tag'

describe('succeed', () => {
  it('builds a layer that always yields the given implementation', () => {
    const tag = Tag<number>('count')
    const layer = succeed(tag, 42)

    expect(layer.build(empty(), makeScope())).toBe(42)
    expect(layer.tag).toBe(tag)
  })
})

describe('sync', () => {
  it('builds a layer whose implementation is computed from the context at build time', () => {
    const countTag = Tag<number>('count')
    const doubledTag = Tag<number>('doubled')
    const ctx = empty().add(countTag, 21)
    const layer = sync(doubledTag, (c) => c.unsafeGet(countTag) * 2)

    expect(layer.build(ctx, makeScope())).toBe(42)
  })
})

describe('scoped', () => {
  it('builds the implementation via acquire and registers release on the scope', () => {
    const tag = Tag<{ id: number }>('resource')
    const released: Array<number> = []
    const layer = scoped(
      tag,
      () => ({ id: 1 }),
      (resource) => released.push(resource.id),
    )
    const scope = makeScope()

    const built = layer.build(empty(), scope)
    expect(built).toEqual({ id: 1 })
    expect(released).toEqual([])

    scope.close()
    expect(released).toEqual([1])
  })
})

describe('fresh', () => {
  it('marks a layer as fresh without mutating the original', () => {
    const tag = Tag<number>('count')
    const layer = succeed(tag, 1)
    const freshLayer = fresh(layer)

    expect(layer.isFresh).toBe(false)
    expect(freshLayer.isFresh).toBe(true)
    expect(freshLayer.build(empty(), makeScope())).toBe(1)
  })
})
