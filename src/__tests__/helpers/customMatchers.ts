/* oxlint-disable typescript/no-explicit-any -- Vitest's matcher augmentation requires its public generic default. */
import { expect } from 'vitest'
import type { DbUserSetting } from '@/db/schema'

type ParseResultLike = {
  success: boolean
  error?: { issues?: unknown }
  errors?: unknown
}

interface CustomMatchers<R = unknown> {
  toBeParseSuccess: () => R
  toHaveRepositoryCount: (expected: number) => R
  toContainStoredSetting: (
    key: DbUserSetting['key'],
    value: DbUserSetting['value'],
  ) => R
}

expect.extend({
  toBeParseSuccess(received: ParseResultLike) {
    const details = received.error?.issues ?? received.errors
    return {
      pass: received.success,
      message: () =>
        received.success
          ? 'expected parse to fail, but it succeeded'
          : `expected parse to succeed, got issues:\n${JSON.stringify(details, null, 2)}`,
    }
  },

  toHaveRepositoryCount(received: number, expected: number) {
    return {
      pass: received === expected,
      message: () => `expected repository to contain ${expected} records, but found ${received}`,
    }
  },

  toContainStoredSetting(
    received: ReadonlyArray<DbUserSetting>,
    key: DbUserSetting['key'],
    value: DbUserSetting['value'],
  ) {
    const setting = received.find((candidate) => candidate.key === key)
    return {
      pass: setting?.value === value,
      message: () =>
        `expected stored setting ${key} to equal ${JSON.stringify(value)}, but received ${JSON.stringify(setting?.value)}`,
    }
  },
})

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends CustomMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
