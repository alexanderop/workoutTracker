import { describe, expect, it } from 'vitest'

describe('custom matchers', () => {
  it('prints parse issues from a failed parse', () => {
    const failedParse = {
      success: false,
      errors: [{ message: 'missing workout name' }],
    }

    expect(() => expect(failedParse).toBeParseSuccess()).toThrowError(
      /expected parse to succeed.*missing workout name/s,
    )
  })

  it('prints repository counts in domain language', () => {
    expect(() => expect(2).toHaveRepositoryCount(3)).toThrowError(
      'expected repository to contain 3 records, but found 2',
    )
  })
})
