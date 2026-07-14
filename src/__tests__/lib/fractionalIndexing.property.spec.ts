import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { generateKeyBetween, generateNKeysBetween } from '@/lib/fractionalIndexing'

/**
 * Property-based tests for fractional indexing order keys.
 *
 * Order keys have a strict format (an integer part whose length is encoded in
 * the head character, plus an optional fraction with no trailing zero), so
 * arbitrary strings are not valid inputs. Every key under test is derived
 * from the module itself: a pool is grown from the root key via fc-driven
 * insertions at random gaps, and bounds are then drawn from that sorted pool.
 *
 * Properties:
 * 1. Ordering: a < generateKeyBetween(a, b) < b, including null bounds.
 * 2. generateNKeysBetween returns exactly n strictly ascending keys within
 *    the bounds, for all four bound shapes.
 * 3. Closure: every generated key is itself a valid bound for further calls.
 * 4. Model-based: a random insertion sequence keeps the key list strictly
 *    sorted and duplicate-free after every operation; repeated head/tail
 *    insertion stays strictly monotonic (exercising the integer
 *    decrement/increment carry paths such as the 'a' -> 'Z' head transition).
 */

const poolSeedsArb = fc.array(fc.nat(), { minLength: 2, maxLength: 6 })
const insertionSeedsArb = fc.array(fc.nat(), { minLength: 20, maxLength: 30 })
const keyCountArb = fc.integer({ min: 0, max: 6 })
const loopCountArb = fc.integer({ min: 5, max: 40 })

/** Insert a fresh key into the sorted pool at the given gap index. */
function insertKeyAtGap(pool: Array<string>, gap: number): void {
  const before = pool[gap - 1] ?? null
  const after = pool[gap] ?? null
  pool.splice(gap, 0, generateKeyBetween(before, after))
}

/** Grow a sorted pool of valid order keys from the root key. */
function buildPool(seeds: ReadonlyArray<number>): Array<string> {
  const pool = [generateKeyBetween(null, null)]
  for (const seed of seeds) {
    insertKeyAtGap(pool, seed % (pool.length + 1))
  }
  return pool
}

function keyAt(pool: ReadonlyArray<string>, index: number): string {
  const key = pool[index]
  if (key === undefined) throw new Error(`no key at index ${index}`)
  return key
}

/** Pick two keys a < b from the sorted pool, driven by fc-generated seeds. */
function pickOrderedPair(
  pool: ReadonlyArray<string>,
  seedA: number,
  seedB: number,
): [string, string] {
  const indexA = seedA % (pool.length - 1)
  const remaining = pool.length - 1 - indexA
  const indexB = indexA + 1 + (seedB % remaining)
  return [keyAt(pool, indexA), keyAt(pool, indexB)]
}

function expectStrictlyAscending(keys: ReadonlyArray<string>): void {
  for (let index = 1; index < keys.length; index++) {
    const previous = keyAt(keys, index - 1)
    const current = keyAt(keys, index)
    expect(previous < current, `expected ${previous} < ${current}`).toBe(true)
  }
}

/** Insert `count` keys before the current head; result stays ascending. */
function chainHeadInsertions(count: number): Array<string> {
  const chain = [generateKeyBetween(null, null)]
  for (let index = 0; index < count; index++) {
    chain.unshift(generateKeyBetween(null, keyAt(chain, 0)))
  }
  return chain
}

/** Insert `count` keys after the current tail; result stays ascending. */
function chainTailInsertions(count: number): Array<string> {
  const chain = [generateKeyBetween(null, null)]
  for (let index = 0; index < count; index++) {
    chain.push(generateKeyBetween(keyAt(chain, chain.length - 1), null))
  }
  return chain
}

function expectNKeysWithinBounds(a: string | null, b: string | null, n: number): void {
  const keys = generateNKeysBetween(a, b, n)
  expect(keys).toHaveLength(n)
  expectStrictlyAscending(keys)
  for (const key of keys) {
    if (a !== null) expect(a < key, `expected ${a} < ${key}`).toBe(true)
    if (b !== null) expect(key < b, `expected ${key} < ${b}`).toBe(true)
  }
}

describe('fractionalIndexing (property-based)', () => {
  it('generates a key strictly between the bounds', () => {
    fc.assert(
      fc.property(poolSeedsArb, fc.nat(), fc.nat(), (seeds, seedA, seedB) => {
        const pool = buildPool(seeds)
        const [a, b] = pickOrderedPair(pool, seedA, seedB)

        const mid = generateKeyBetween(a, b)
        expect(a < mid, `expected ${a} < ${mid}`).toBe(true)
        expect(mid < b, `expected ${mid} < ${b}`).toBe(true)

        expect(generateKeyBetween(null, b) < b).toBe(true)
        expect(generateKeyBetween(a, null) > a).toBe(true)
      }),
    )
  })

  it('generateNKeysBetween returns n ascending keys for all bound shapes', () => {
    fc.assert(
      fc.property(poolSeedsArb, fc.nat(), fc.nat(), keyCountArb, (seeds, seedA, seedB, n) => {
        const pool = buildPool(seeds)
        const [a, b] = pickOrderedPair(pool, seedA, seedB)

        expectNKeysWithinBounds(null, null, n)
        expectNKeysWithinBounds(a, null, n)
        expectNKeysWithinBounds(null, b, n)
        expectNKeysWithinBounds(a, b, n)
      }),
    )
  })

  it('generated keys are themselves valid bounds for further insertion', () => {
    fc.assert(
      fc.property(poolSeedsArb, fc.nat(), fc.nat(), (seeds, seedA, seedB) => {
        const pool = buildPool(seeds)
        const [a, b] = pickOrderedPair(pool, seedA, seedB)

        const mid = generateKeyBetween(a, b)
        const lower = generateKeyBetween(a, mid)
        const upper = generateKeyBetween(mid, b)
        expectStrictlyAscending([a, lower, mid, upper, b])
      }),
    )
  })

  it('keeps the list strictly sorted under random insertion sequences', () => {
    fc.assert(
      fc.property(insertionSeedsArb, (seeds) => {
        const keys: Array<string> = []
        for (const seed of seeds) {
          insertKeyAtGap(keys, seed % (keys.length + 1))
          expectStrictlyAscending(keys)
        }
        // Strict ascent already implies distinctness; double-check explicitly
        expect(new Set(keys).size).toBe(keys.length)
      }),
    )
  })

  it('stays monotonic under repeated head and tail insertion', () => {
    fc.assert(
      fc.property(loopCountArb, (count) => {
        const headChain = chainHeadInsertions(count)
        expect(headChain).toHaveLength(count + 1)
        expectStrictlyAscending(headChain)

        const tailChain = chainTailInsertions(count)
        expect(tailChain).toHaveLength(count + 1)
        expectStrictlyAscending(tailChain)
      }),
    )
  })
})
