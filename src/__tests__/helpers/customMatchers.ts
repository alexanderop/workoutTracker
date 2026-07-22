import { expect } from 'vitest'
import type { DbUserSetting } from '@/db/schema'

type ParseResultLike = {
  success: boolean
  error?: { issues?: unknown }
  errors?: unknown
}

type StoredSettingValue<K extends DbUserSetting['key']> = Extract<
  DbUserSetting,
  { key: K }
>['value']

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
  // Vitest's own declaration supplies the type-parameter default; `Matchers`
  // flows into `Assertion`, `expect.poll`, and static asymmetric matchers.
  interface Matchers<T> {
    toBeParseSuccess: () => T
    toHaveRepositoryCount: (expected: number) => T
    toContainStoredSetting: <K extends DbUserSetting['key']>(
      key: K,
      value: StoredSettingValue<K>,
    ) => T
  }
}
