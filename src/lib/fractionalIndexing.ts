/**
 * Fractional Indexing for lexicographically sortable keys.
 * Based on https://observablehq.com/@dgreensp/implementing-fractional-indexing
 * License: CC0 (no rights reserved)
 */

export const BASE_62_DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/** Get character at index, throwing if out of bounds. */
function charAt(str: string, index: number): string {
  const char = str[index]
  if (char === undefined) {
    throw new Error(`index ${index} out of bounds for string length ${str.length}`)
  }
  return char
}

/** Get first character of a non-empty string. */
function firstChar(str: string): string {
  return charAt(str, 0)
}

/** Get the digit index for a character in the digit string. */
function getDigitIndex(char: string | undefined, digits: string, defaultIndex: number): number {
  return char ? digits.indexOf(char) : defaultIndex
}

/** Validate that neither string has a trailing zero. */
function validateNoTrailingZero(a: string, b: string | null | undefined, zero: string): void {
  if (a.slice(-1) === zero || (b && b.slice(-1) === zero)) {
    throw new Error('trailing zero')
  }
}

/** Find the length of the common prefix between a and b, treating missing chars in a as zero. */
function findCommonPrefixLength(a: string, b: string, zero: string): number {
  let n = 0
  while ((a[n] ?? zero) === b[n]) {
    n++
  }
  return n
}

/** Calculate the midpoint digit between two digit indices. */
function getMidpointDigit(digitA: number, digitB: number, digits: string): string | null {
  if (digitB - digitA > 1) {
    const midDigit = Math.round(0.5 * (digitA + digitB))
    return charAt(digits, midDigit)
  }
  return null
}

/**
 * Finds the midpoint between two fractional parts.
 * `a` may be empty string, `b` is null or non-empty string.
 * `a < b` lexicographically if `b` is non-null.
 * No trailing zeros allowed.
 */
function midpoint(a: string, b: string | null | undefined, digits: string): string {
  const zero = firstChar(digits)

  if (b != null && a >= b) {
    throw new Error(`${a} >= ${b}`)
  }
  validateNoTrailingZero(a, b, zero)

  // Handle common prefix case
  if (b) {
    const n = findCommonPrefixLength(a, b, zero)
    if (n > 0) {
      return b.slice(0, n) + midpoint(a.slice(n), b.slice(n), digits)
    }
  }

  // First digits (or lack of digit) are different
  const digitA = getDigitIndex(a[0], digits, 0)
  const digitB = b == null ? digits.length : digits.indexOf(firstChar(b))

  // Try to find a midpoint digit
  const midDigit = getMidpointDigit(digitA, digitB, digits)
  if (midDigit) return midDigit

  // First digits are consecutive - use first char of b if it's long enough
  if (b && b.length > 1) return b.slice(0, 1)

  // Recurse: keep first digit of a, find midpoint for rest
  return charAt(digits, digitA) + midpoint(a.slice(1), null, digits)
}

function validateInteger(int: string): void {
  if (int.length !== getIntegerLength(firstChar(int))) {
    throw new Error(`invalid integer part of order key: ${int}`)
  }
}

function getIntegerLength(head: string): number {
  if (head >= 'a' && head <= 'z') {
    return (head.codePointAt(0) ?? 0) - ('a'.codePointAt(0) ?? 0) + 2
  }

  if (head >= 'A' && head <= 'Z') {
    return ('Z'.codePointAt(0) ?? 0) - (head.codePointAt(0) ?? 0) + 2
  }

  throw new Error(`invalid order key head: ${head}`)
}

function getIntegerPart(key: string): string {
  const integerPartLength = getIntegerLength(firstChar(key))
  if (integerPartLength > key.length) {
    throw new Error(`invalid order key: ${key}`)
  }
  return key.slice(0, integerPartLength)
}

function validateOrderKey(key: string, digits: string): void {
  if (key === 'A' + firstChar(digits).repeat(26)) {
    throw new Error(`invalid order key: ${key}`)
  }
  // getIntegerPart will throw if the first character is bad,
  // or the key is too short.
  const i = getIntegerPart(key)
  const f = key.slice(i.length)
  if (f.slice(-1) === firstChar(digits)) {
    throw new Error(`invalid order key: ${key}`)
  }
}

/** Propagate increment through digits array, returns true if carry remains. */
function propagateIncrement(digs: Array<string>, digits: string): boolean {
  for (let i = digs.length - 1; i >= 0; i--) {
    const d = digits.indexOf(digs[i]!) + 1
    if (d === digits.length) {
      digs[i] = firstChar(digits)
      continue
    }
    digs[i] = charAt(digits, d)
    return false
  }
  return true
}

/** Propagate decrement through digits array, returns true if borrow remains. */
function propagateDecrement(digs: Array<string>, digits: string): boolean {
  for (let i = digs.length - 1; i >= 0; i--) {
    const d = digits.indexOf(digs[i]!) - 1
    if (d === -1) {
      digs[i] = digits.slice(-1)
      continue
    }
    digs[i] = charAt(digits, d)
    return false
  }
  return true
}

/** Adjust digits array based on head transition direction. */
function adjustDigitsForHead(
  digs: Array<string>,
  newHead: string,
  boundary: string,
  digitToAdd: string,
  isIncrement: boolean,
): void {
  const shouldPush = isIncrement ? newHead > boundary : newHead < boundary
  const shouldPop = isIncrement ? newHead <= boundary : newHead >= boundary
  if (shouldPush) digs.push(digitToAdd)
  if (shouldPop) digs.pop()
}

/**
 * Increment an integer key. May return null if at maximum.
 */
function incrementInteger(x: string, digits: string): string | null {
  validateInteger(x)
  const head = firstChar(x)
  const digs = [...x].slice(1)

  const carry = propagateIncrement(digs, digits)
  if (!carry) return head + digs.join('')
  if (head === 'Z') return 'a' + firstChar(digits)
  if (head === 'z') return null

  const newHead = String.fromCodePoint((head.codePointAt(0) ?? 0) + 1)
  adjustDigitsForHead(digs, newHead, 'a', firstChar(digits), true)
  return newHead + digs.join('')
}

/**
 * Decrement an integer key. May return null if at minimum.
 */
function decrementInteger(x: string, digits: string): string | null {
  validateInteger(x)
  const head = firstChar(x)
  const digs = [...x].slice(1)

  const borrow = propagateDecrement(digs, digits)
  if (!borrow) return head + digs.join('')
  if (head === 'a') return 'Z' + digits.slice(-1)
  if (head === 'A') return null

  const newHead = String.fromCodePoint((head.codePointAt(0) ?? 0) - 1)
  adjustDigitsForHead(digs, newHead, 'Z', digits.slice(-1), false)
  return newHead + digs.join('')
}

/** Validate order keys and their relationship. */
function validateKeys(
  a: string | null | undefined,
  b: string | null | undefined,
  digits: string,
): void {
  if (a != null) validateOrderKey(a, digits)
  if (b != null) validateOrderKey(b, digits)
  if (a != null && b != null && a >= b) throw new Error(`${a} >= ${b}`)
}

/** Generate key when a is null (before b or at start). */
function generateKeyBeforeB(b: string | null | undefined, digits: string): string {
  if (b == null) return 'a' + firstChar(digits)

  const ib = getIntegerPart(b)
  const fb = b.slice(ib.length)

  if (ib === 'A' + firstChar(digits).repeat(26)) return ib + midpoint('', fb, digits)
  if (ib < b) return ib

  const res = decrementInteger(ib, digits)
  if (res == null) throw new Error('cannot decrement any more')
  return res
}

/** Generate key when b is null (after a). */
function generateKeyAfterA(a: string, digits: string): string {
  const ia = getIntegerPart(a)
  const fa = a.slice(ia.length)
  const i = incrementInteger(ia, digits)
  return i == null ? ia + midpoint(fa, null, digits) : i
}

/** Generate key between two non-null keys. */
function generateKeyBetweenBoth(a: string, b: string, digits: string): string {
  const ia = getIntegerPart(a)
  const fa = a.slice(ia.length)
  const ib = getIntegerPart(b)
  const fb = b.slice(ib.length)

  if (ia === ib) return ia + midpoint(fa, fb, digits)

  const i = incrementInteger(ia, digits)
  if (i == null) throw new Error('cannot increment any more')
  if (i < b) return i
  return ia + midpoint(fa, null, digits)
}

/**
 * Generate a key between `a` and `b`.
 * `a` is an order key or null (START).
 * `b` is an order key or null (END).
 * `a < b` lexicographically if both are non-null.
 */
export function generateKeyBetween(
  a: string | null | undefined,
  b: string | null | undefined,
  digits: string = BASE_62_DIGITS,
): string {
  validateKeys(a, b, digits)

  if (a == null) return generateKeyBeforeB(b, digits)
  if (b == null) return generateKeyAfterA(a, digits)
  return generateKeyBetweenBoth(a, b, digits)
}

/**
 * Generate n distinct keys in sorted order between `a` and `b`.
 * Same preconditions as generateKeyBetween.
 */
export function generateNKeysBetween(
  a: string | null | undefined,
  b: string | null | undefined,
  n: number,
  digits: string = BASE_62_DIGITS,
): Array<string> {
  if (n === 0) {
    return []
  }
  if (n === 1) {
    return [generateKeyBetween(a, b, digits)]
  }

  if (b == null) {
    let c = generateKeyBetween(a, b, digits)
    const result = [c]
    for (let i = 0; i < n - 1; i++) {
      c = generateKeyBetween(c, b, digits)
      result.push(c)
    }
    return result
  }

  if (a == null) {
    let c = generateKeyBetween(a, b, digits)
    const result = [c]
    for (let i = 0; i < n - 1; i++) {
      c = generateKeyBetween(a, c, digits)
      result.push(c)
    }
    result.reverse()
    return result
  }

  const mid = Math.floor(n / 2)
  const c = generateKeyBetween(a, b, digits)
  return [
    ...generateNKeysBetween(a, c, mid, digits),
    c,
    ...generateNKeysBetween(c, b, n - mid - 1, digits),
  ]
}
