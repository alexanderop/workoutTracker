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

  if (a.slice(-1) === zero || (b && b.slice(-1) === zero)) {
    throw new Error('trailing zero')
  }

  if (b) {
    // Remove longest common prefix. Pad `a` with 0s as we go.
    // Note: we don't need to pad `b`, because it can't end before `a`
    // while traversing the common prefix.
    let n = 0
    while ((a[n] ?? zero) === b[n]) {
      n++
    }
    if (n > 0) {
      return b.slice(0, n) + midpoint(a.slice(n), b.slice(n), digits)
    }
  }

  // First digits (or lack of digit) are different
  const digitA = a ? digits.indexOf(firstChar(a)) : 0
  const digitB = b == null ? digits.length : digits.indexOf(firstChar(b))

  if (digitB - digitA > 1) {
    const midDigit = Math.round(0.5 * (digitA + digitB))
    return charAt(digits, midDigit)
  }

  // First digits are consecutive
  if (b && b.length > 1) {
    return b.slice(0, 1)
  }

  // `b` is null or has length 1 (a single digit).
  // The first digit of `a` is the previous digit to `b`,
  // or 9 if `b` is null.
  // Given, for example, midpoint('49', '5'), return
  // '4' + midpoint('9', null), which will become
  // '4' + '9' + midpoint('', null), which is '495'
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

/**
 * Increment an integer key. May return null if at maximum.
 */
function incrementInteger(x: string, digits: string): string | null {
  validateInteger(x)
  const chars = [...x]
  const head = firstChar(x)
  const digs = chars.slice(1)
  let carry = true

  for (let i = digs.length - 1; carry && i >= 0; i--) {
    const d = digits.indexOf(digs[i]!) + 1
    if (d === digits.length) {
      digs[i] = firstChar(digits)
    }
    if (d !== digits.length) {
      digs[i] = charAt(digits, d)
      carry = false
    }
  }

  if (!carry) {
    return head + digs.join('')
  }

  if (head === 'Z') {
    return 'a' + firstChar(digits)
  }

  if (head === 'z') {
    return null
  }

  const h = String.fromCodePoint((head.codePointAt(0) ?? 0) + 1)
  if (h > 'a') {
    digs.push(firstChar(digits))
  }
  if (h <= 'a') {
    digs.pop()
  }
  return h + digs.join('')
}

/**
 * Decrement an integer key. May return null if at minimum.
 */
function decrementInteger(x: string, digits: string): string | null {
  validateInteger(x)
  const chars = [...x]
  const head = firstChar(x)
  const digs = chars.slice(1)
  let borrow = true

  for (let i = digs.length - 1; borrow && i >= 0; i--) {
    const d = digits.indexOf(digs[i]!) - 1
    if (d === -1) {
      digs[i] = digits.slice(-1)
    }
    if (d !== -1) {
      digs[i] = charAt(digits, d)
      borrow = false
    }
  }

  if (!borrow) {
    return head + digs.join('')
  }

  if (head === 'a') {
    return 'Z' + digits.slice(-1)
  }

  if (head === 'A') {
    return null
  }

  const h = String.fromCodePoint((head.codePointAt(0) ?? 0) - 1)
  if (h < 'Z') {
    digs.push(digits.slice(-1))
  }
  if (h >= 'Z') {
    digs.pop()
  }
  return h + digs.join('')
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
  if (a != null) {
    validateOrderKey(a, digits)
  }
  if (b != null) {
    validateOrderKey(b, digits)
  }
  if (a != null && b != null && a >= b) {
    throw new Error(`${a} >= ${b}`)
  }

  if (a == null) {
    if (b == null) {
      return 'a' + firstChar(digits)
    }

    const ib = getIntegerPart(b)
    const fb = b.slice(ib.length)

    if (ib === 'A' + firstChar(digits).repeat(26)) {
      return ib + midpoint('', fb, digits)
    }
    if (ib < b) {
      return ib
    }
    const res = decrementInteger(ib, digits)
    if (res == null) {
      throw new Error('cannot decrement any more')
    }
    return res
  }

  if (b == null) {
    const ia = getIntegerPart(a)
    const fa = a.slice(ia.length)
    const i = incrementInteger(ia, digits)
    return i == null ? ia + midpoint(fa, null, digits) : i
  }

  const ia = getIntegerPart(a)
  const fa = a.slice(ia.length)
  const ib = getIntegerPart(b)
  const fb = b.slice(ib.length)

  if (ia === ib) {
    return ia + midpoint(fa, fb, digits)
  }

  const i = incrementInteger(ia, digits)
  if (i == null) {
    throw new Error('cannot increment any more')
  }
  if (i < b) {
    return i
  }
  return ia + midpoint(fa, null, digits)
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
