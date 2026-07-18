import { describe, it, expect } from 'vitest'
import { BASE_62_DIGITS, generateKeyBetween, generateNKeysBetween } from '@/lib/fractionalIndexing'

describe('fractionalIndexing', () => {
  describe('BASE_62_DIGITS', () => {
    it('contains 62 characters in ascending order', () => {
      expect(BASE_62_DIGITS).toBe('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
      expect(BASE_62_DIGITS).toHaveLength(62)
    })
  })

  describe('generateKeyBetween', () => {
    describe('when both bounds are null', () => {
      it('returns the first key "a0"', () => {
        expect(generateKeyBetween(null, null)).toBe('a0')
      })
    })

    describe('when generating before a key (a=null)', () => {
      it('decrements the integer part', () => {
        expect(generateKeyBetween(null, 'a0')).toBe('Zz')
        expect(generateKeyBetween(null, 'a1')).toBe('a0')
        expect(generateKeyBetween(null, 'Zz')).toBe('Zy')
      })

      it('uses the integer part when it is less than the key', () => {
        expect(generateKeyBetween(null, 'a0V')).toBe('a0')
        expect(generateKeyBetween(null, 'b999')).toBe('b99')
      })

      it('handles multi-character integer parts', () => {
        expect(generateKeyBetween(null, 'Y00')).toBe('Xzzz')
      })
    })

    describe('when generating after a key (b=null)', () => {
      it('increments the integer part', () => {
        expect(generateKeyBetween('a0', null)).toBe('a1')
        expect(generateKeyBetween('a1', null)).toBe('a2')
        expect(generateKeyBetween('Zz', null)).toBe('a0')
      })

      it('handles carry in integer part', () => {
        expect(generateKeyBetween('bzz', null)).toBe('c000')
      })

      it('generates fractional part when at maximum integer', () => {
        expect(generateKeyBetween('zzzzzzzzzzzzzzzzzzzzzzzzzzy', null)).toBe(
          'zzzzzzzzzzzzzzzzzzzzzzzzzzz',
        )
        expect(generateKeyBetween('zzzzzzzzzzzzzzzzzzzzzzzzzzz', null)).toBe(
          'zzzzzzzzzzzzzzzzzzzzzzzzzzzV',
        )
      })
    })

    describe('when generating between two keys', () => {
      it('generates midpoint in fractional part for same integer', () => {
        expect(generateKeyBetween('a0', 'a1')).toBe('a0V')
        expect(generateKeyBetween('a1', 'a2')).toBe('a1V')
        expect(generateKeyBetween('a0', 'a0V')).toBe('a0G')
        expect(generateKeyBetween('a0', 'a0G')).toBe('a08')
      })

      it('uses increment when possible', () => {
        expect(generateKeyBetween('a0', 'a2')).toBe('a1')
        expect(generateKeyBetween('a0', 'a1V')).toBe('a1')
      })

      it('handles consecutive keys with fractional parts', () => {
        expect(generateKeyBetween('a0V', 'a1')).toBe('a0l')
        expect(generateKeyBetween('b125', 'b129')).toBe('b127')
      })

      it('handles cross-boundary between Zz and a range', () => {
        expect(generateKeyBetween('Zz', 'a0')).toBe('ZzV')
        expect(generateKeyBetween('Zz', 'a1')).toBe('a0')
        expect(generateKeyBetween('Zz', 'a01')).toBe('a0')
      })
    })

    describe('error handling', () => {
      it('throws when a >= b', () => {
        expect(() => generateKeyBetween('a1', 'a0')).toThrow('a1 >= a0')
        expect(() => generateKeyBetween('a1', 'a1')).toThrow('a1 >= a1')
      })

      it('throws for invalid key format', () => {
        expect(() => generateKeyBetween('0', '1')).toThrow('invalid order key head: 0')
        expect(() => generateKeyBetween('a', null)).toThrow('invalid order key')
      })

      it('throws for trailing zeros', () => {
        expect(() => generateKeyBetween('a00', null)).toThrow('invalid order key: a00')
        expect(() => generateKeyBetween('a00', 'a1')).toThrow('invalid order key: a00')
      })

      it('throws for minimum integer key', () => {
        expect(() => generateKeyBetween(null, 'A00000000000000000000000000')).toThrow(
          'invalid order key: A00000000000000000000000000',
        )
      })
    })

    describe('extreme key values', () => {
      it('handles near-minimum keys', () => {
        expect(generateKeyBetween(null, 'A000000000000000000000000001')).toBe(
          'A000000000000000000000000000V',
        )
      })
    })

    describe('custom digits', () => {
      it('works with base-10 digits', () => {
        const digits = '0123456789'
        expect(generateKeyBetween(null, null, digits)).toBe('a0')
        expect(generateKeyBetween('a0', 'a1', digits)).toBe('a05')
      })
    })
  })

  describe('generateNKeysBetween', () => {
    const BASE_10_DIGITS = '0123456789'

    describe('when n=0', () => {
      it('returns empty array', () => {
        expect(generateNKeysBetween(null, null, 0)).toEqual([])
      })
    })

    describe('when n=1', () => {
      it('returns single key', () => {
        expect(generateNKeysBetween(null, null, 1)).toEqual(['a0'])
      })
    })

    describe('when generating multiple keys', () => {
      it('returns n keys in sorted order', () => {
        const keys = generateNKeysBetween(null, null, 5)

        expect(keys).toHaveLength(5)
        // Verify sorted order using toSorted comparison
        const sorted = [...keys].toSorted()
        expect(keys).toEqual(sorted)
      })

      it('generates keys after a bound (b=null)', () => {
        const keys = generateNKeysBetween('a0', null, 3)

        expect(keys).toHaveLength(3)
        expect(keys.at(0)! > 'a0').toBe(true)
        // Verify sorted order
        const sorted = [...keys].toSorted()
        expect(keys).toEqual(sorted)
      })

      it('generates keys before a bound (a=null)', () => {
        const keys = generateNKeysBetween(null, 'a0', 3)

        expect(keys).toHaveLength(3)
        expect(keys.at(-1)! < 'a0').toBe(true)
        // Verify sorted order
        const sorted = [...keys].toSorted()
        expect(keys).toEqual(sorted)
      })

      it('generates keys between two bounds', () => {
        const keys = generateNKeysBetween('a0', 'a2', 3)

        expect(keys).toHaveLength(3)
        expect(keys.at(0)! > 'a0').toBe(true)
        expect(keys.at(-1)! < 'a2').toBe(true)
        // Verify sorted order
        const sorted = [...keys].toSorted()
        expect(keys).toEqual(sorted)
      })
    })

    describe('all generated keys are unique', () => {
      it('generates unique keys for large n', () => {
        const keys = generateNKeysBetween(null, null, 100)
        const uniqueKeys = new Set(keys)

        expect(uniqueKeys.size).toBe(100)
      })
    })

    describe('with base-10 digits', () => {
      it('generates 5 keys from null to null', () => {
        const keys = generateNKeysBetween(null, null, 5, BASE_10_DIGITS)
        expect(keys.join(' ')).toBe('a0 a1 a2 a3 a4')
      })

      it('generates 10 keys after a4', () => {
        const keys = generateNKeysBetween('a4', null, 10, BASE_10_DIGITS)
        expect(keys.join(' ')).toBe('a5 a6 a7 a8 a9 b00 b01 b02 b03 b04')
      })

      it('generates 5 keys before a0', () => {
        const keys = generateNKeysBetween(null, 'a0', 5, BASE_10_DIGITS)
        expect(keys.join(' ')).toBe('Z5 Z6 Z7 Z8 Z9')
      })

      it('generates 20 keys between a0 and a2', () => {
        const keys = generateNKeysBetween('a0', 'a2', 20, BASE_10_DIGITS)
        expect(keys.join(' ')).toBe(
          'a01 a02 a03 a035 a04 a05 a06 a07 a08 a09 a1 a11 a12 a13 a14 a15 a16 a17 a18 a19',
        )
      })
    })
  })

  describe('integer boundary transitions', () => {
    it('handles transition from Z to a (uppercase to lowercase)', () => {
      // Zz is the last "Z" integer, next should be a0
      expect(generateKeyBetween('Zz', null)).toBe('a0')
    })

    it('handles transition from a to Z (lowercase to uppercase) going backward', () => {
      expect(generateKeyBetween(null, 'a0')).toBe('Zz')
    })

    it('maintains key ordering across integer boundaries', () => {
      const key1 = 'Zz'
      const key2 = generateKeyBetween(key1, null)
      const key3 = generateKeyBetween(key2, null)

      expect(key1 < key2).toBe(true)
      expect(key2 < key3).toBe(true)
    })
  })

  describe('real-world usage scenarios', () => {
    it('supports inserting items at the beginning of a list', () => {
      // Simulate inserting at the beginning of a list
      const firstItem = generateKeyBetween(null, null) // a0
      const insertedBefore = generateKeyBetween(null, firstItem) // Zz

      expect(insertedBefore < firstItem).toBe(true)
    })

    it('supports inserting items at the end of a list', () => {
      const lastItem = generateKeyBetween(null, null) // a0
      const insertedAfter = generateKeyBetween(lastItem, null) // a1

      expect(insertedAfter > lastItem).toBe(true)
    })

    it('supports inserting items between existing items', () => {
      const item1 = 'a0'
      const item2 = 'a1'
      const between = generateKeyBetween(item1, item2) // a0V

      expect(between > item1).toBe(true)
      expect(between < item2).toBe(true)
    })

    it('supports many insertions in the same gap', () => {
      const state = { left: 'a0' }
      const right = 'a1'

      // Keep inserting between left and right
      for (const _ of Array.from({ length: 20 })) {
        const newKey = generateKeyBetween(state.left, right)
        expect(newKey > state.left).toBe(true)
        expect(newKey < right).toBe(true)
        state.left = newKey
      }
    })
  })

  describe('with BASE_95 custom digits', () => {
    const BASE_95_DIGITS =
      ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'

    it('generates midpoint with custom digits', () => {
      expect(generateKeyBetween('a00', 'a01', BASE_95_DIGITS)).toBe('a00P')
      expect(generateKeyBetween('a0/', 'a00', BASE_95_DIGITS)).toBe('a0/P')
    })

    it('handles null bounds with spaces as first digit', () => {
      expect(generateKeyBetween(null, null, BASE_95_DIGITS)).toBe('a ')
      expect(generateKeyBetween('a ', null, BASE_95_DIGITS)).toBe('a!')
      expect(generateKeyBetween(null, 'a ', BASE_95_DIGITS)).toBe('Z~')
    })

    it('throws for trailing spaces (which are zeros in base-95)', () => {
      expect(() => generateKeyBetween('a0 ', 'a0!', BASE_95_DIGITS)).toThrow(
        'invalid order key: a0 ',
      )
    })

    it('handles near-minimum keys', () => {
      const minKey = 'A' + ' '.repeat(26)
      expect(() => generateKeyBetween(null, minKey, BASE_95_DIGITS)).toThrow(
        `invalid order key: ${minKey}`,
      )
      expect(generateKeyBetween(null, minKey + '0', BASE_95_DIGITS)).toBe(minKey + '(')
    })

    it('handles integer boundaries', () => {
      expect(generateKeyBetween('a~', null, BASE_95_DIGITS)).toBe('b  ')
      expect(generateKeyBetween('Z~', null, BASE_95_DIGITS)).toBe('a ')
    })

    it('throws for invalid trailing spaces in integer part', () => {
      expect(() => generateKeyBetween('b   ', null, BASE_95_DIGITS)).toThrow(
        'invalid order key: b   ',
      )
    })

    it('generates midpoints correctly', () => {
      expect(generateKeyBetween('a0', 'a0V', BASE_95_DIGITS)).toBe('a0;')
      expect(generateKeyBetween('a  1', 'a  2', BASE_95_DIGITS)).toBe('a  1P')
    })
  })
})
