import { describe, expect, it } from 'vitest'
import { empty, make, unsafeMake, type Context } from '@/lib/di/context'
import { Reference, Tag } from '@/lib/di/tag'

describe('Context', () => {
  describe('make', () => {
    it('retrieves the implementation provided for a tag', () => {
      const tag = Tag<number>('count')
      const ctx = make(tag, 42)

      expect(ctx.get(tag)).toBe(42)
    })
  })

  describe('get', () => {
    it('throws a Service not found error for an absent plain tag reached by bypassing the type check', () => {
      const tag = Tag<number>('count')
      const ctx = empty()

      // @ts-expect-error — a plain Tag must be provided; `ctx` is Context<never>.
      expect(() => ctx.get(tag)).toThrow('Service not found: count')
    })
  })

  describe('unsafeGet', () => {
    it('throws a Service not found error for an absent plain tag', () => {
      const tag = Tag<number>('count')

      expect(() => empty().unsafeGet(tag)).toThrow('Service not found: count')
    })

    it('retrieves an implementation that was provided', () => {
      const tag = Tag<number>('count')
      const ctx = make(tag, 7)

      expect(ctx.unsafeGet(tag)).toBe(7)
    })
  })

  describe('getOption', () => {
    it('returns undefined for an absent tag', () => {
      const tag = Tag<number>('count')

      expect(empty().getOption(tag)).toBeUndefined()
    })

    it('returns the implementation for a provided tag', () => {
      const tag = Tag<number>('count')
      const ctx = make(tag, 3)

      expect(ctx.getOption(tag)).toBe(3)
    })
  })

  describe('getOrElse', () => {
    it('returns the fallback for an absent tag', () => {
      const tag = Tag<number>('count')

      expect(empty().getOrElse(tag, () => -1)).toBe(-1)
    })

    it('returns the implementation, ignoring the fallback, for a provided tag', () => {
      const tag = Tag<number>('count')
      const ctx = make(tag, 3)

      expect(ctx.getOrElse(tag, () => -1)).toBe(3)
    })
  })

  describe('References', () => {
    it('resolves to its default value from an empty context', () => {
      const ref = Reference<number>('count', () => 99)

      expect(empty().get(ref)).toBe(99)
    })

    it('resolves to the overriding implementation once added', () => {
      const ref = Reference<number>('count', () => 99)
      const ctx = empty().add(ref, 1)

      expect(ctx.get(ref)).toBe(1)
    })
  })

  describe('add', () => {
    it('does not mutate the context it was called on', () => {
      const tag = Tag<number>('count')
      const original = empty()
      const withCount = original.add(tag, 5)

      expect(original.getOption(tag)).toBeUndefined()
      expect(withCount.getOption(tag)).toBe(5)
    })
  })

  describe('unsafeMake', () => {
    it('builds a context from an already-erased key to implementation map', () => {
      const tag = Tag<number>('count')
      const ctx = unsafeMake(new Map([['count', 10]]))

      expect(ctx.unsafeGet(tag)).toBe(10)
    })

    it('snapshots the map so a mutation the caller makes afterwards is not observed', () => {
      const tag = Tag<number>('count')
      const source = new Map<string, unknown>([['count', 1]])
      const ctx = unsafeMake(source)

      source.set('count', 2)

      expect(ctx.unsafeGet(tag)).toBe(1)
    })
  })

  describe('type-level: unprovided plain Tag is a compile error', () => {
    it('compiles for a Reference but not a plain unprovided Tag', () => {
      const tag = Tag<number>('count')
      const ref = Reference<number>('count', () => 1)
      const ctx = empty()

      // @ts-expect-error — a plain Tag must be provided; `ctx` is Context<never>.
      expect(() => ctx.get(tag)).toThrow('Service not found: count')
      expect(ctx.get(ref)).toBe(1)
    })
  })

  describe('type-level: Context<Services> variance enforces D7 layer 1 at assignability', () => {
    type A = { a: number }
    type B = { b: number }
    const tagA = Tag<A>('A')
    const tagB = Tag<B>('B')

    it('rejects Context<never> where a required service is expected, and still throws at runtime', () => {
      function useA(ctx: Context<A>): A {
        return ctx.get(tagA)
      }

      // @ts-expect-error — Context<never> is not assignable to Context<A>; nothing was provided.
      expect(() => useA(empty())).toThrow('Service not found: A')
    })

    it('rejects a context providing only part of what is required, and throws for the missing part', () => {
      function useBoth(ctx: Context<A | B>): B {
        return ctx.get(tagB)
      }
      const onlyA = make(tagA, { a: 1 })

      // @ts-expect-error — Context<A> is not assignable to Context<A | B>; B was never provided.
      expect(() => useBoth(onlyA)).toThrow('Service not found: B')
    })

    it('accepts a context providing more than what is required', () => {
      function useA(ctx: Context<A>): A {
        return ctx.get(tagA)
      }
      const both = make(tagA, { a: 1 }).add(tagB, { b: 2 })

      expect(useA(both)).toEqual({ a: 1 })
    })

    it('still lets a Reference be read from an empty context, returning its default', () => {
      const ref = Reference<number>('ref-count', () => 99)

      expect(empty().get(ref)).toBe(99)
    })

    it('lets add() widen the provided union to satisfy a broader required context', () => {
      function useBoth(ctx: Context<A | B>): number {
        return ctx.get(tagA).a + ctx.get(tagB).b
      }
      const ctx = make(tagA, { a: 1 }).add(tagB, { b: 2 })

      expect(useBoth(ctx)).toBe(3)
    })
  })
})
