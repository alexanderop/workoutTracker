import { describe, expect, it } from 'vitest'
import { makeScope } from '@/lib/di/scope'
import { tryCatch } from '@/lib/tryCatch'

describe('Scope', () => {
  it('runs finalizers in reverse registration order on close', () => {
    const order: Array<number> = []
    const scope = makeScope()

    scope.addFinalizer(() => order.push(1))
    scope.addFinalizer(() => order.push(2))
    scope.addFinalizer(() => order.push(3))
    scope.close()

    expect(order).toEqual([3, 2, 1])
  })

  it('does not run finalizers again on a second close', () => {
    const order: Array<number> = []
    const scope = makeScope()

    scope.addFinalizer(() => order.push(1))
    scope.close()
    scope.close()

    expect(order).toEqual([1])
  })

  it('runs every finalizer even when an earlier one throws', () => {
    const order: Array<number> = []
    const scope = makeScope()

    scope.addFinalizer(() => order.push(1))
    scope.addFinalizer(() => {
      throw new Error('boom')
    })
    scope.addFinalizer(() => order.push(3))

    expect(() => scope.close()).toThrow()
    expect(order).toEqual([3, 1])
  })

  it('throws an AggregateError containing every finalizer failure', () => {
    const scope = makeScope()
    const errorA = new Error('a failed')
    const errorB = new Error('b failed')

    scope.addFinalizer(() => {
      throw errorA
    })
    scope.addFinalizer(() => {
      throw errorB
    })

    const [caught] = tryCatch(() => scope.close())

    expect(caught).toBeInstanceOf(AggregateError)
    expect(caught instanceof AggregateError ? caught.errors : undefined).toEqual([errorB, errorA])
  })

  it('throws nothing when no finalizer fails', () => {
    const scope = makeScope()
    scope.addFinalizer(() => {})

    expect(() => scope.close()).not.toThrow()
  })

  it('runs a finalizer added after close immediately, and not again on a later close', () => {
    const order: Array<number> = []
    const scope = makeScope()
    scope.close()

    scope.addFinalizer(() => order.push(1))
    expect(order).toEqual([1])

    scope.close()
    expect(order).toEqual([1])
  })
})
