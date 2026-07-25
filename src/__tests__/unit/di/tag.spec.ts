import { describe, expect, it } from 'vitest'
import { isReference, Reference, Tag } from '@/lib/di/tag'

describe('Tag', () => {
  it('carries the key it was created with', () => {
    const tag = Tag<number>('count')

    expect(tag.key).toBe('count')
  })
})

describe('Reference', () => {
  it('carries the key and a default-value thunk', () => {
    const ref = Reference<number>('count', () => 42)

    expect(ref.key).toBe('count')
    expect(ref.defaultValue()).toBe(42)
  })
})

describe('isReference', () => {
  it('is true for a Reference', () => {
    const ref = Reference<number>('count', () => 42)

    expect(isReference(ref)).toBe(true)
  })

  it('is false for a plain Tag', () => {
    const tag = Tag<number>('count')

    expect(isReference(tag)).toBe(false)
  })
})
