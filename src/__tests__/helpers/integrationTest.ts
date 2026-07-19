import { test } from 'vitest'
import {
  createTestApp as createApp,
  type CreateTestAppOptions,
  type TestApp,
} from './createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from './integrationSetup'

export type IntegrationTestFixtures = {
  createTestApp: (options?: CreateTestAppOptions) => Promise<TestApp>
}

export const it = test.extend(
  'createTestApp',
  { auto: true },
  // Vitest statically parses fixture parameters and requires object destructuring.
  // oxlint-disable-next-line no-empty-pattern
  async ({}, { onCleanup }): Promise<IntegrationTestFixtures['createTestApp']> => {
    let activeApp: TestApp | undefined

    await setupIntegrationTest()

    onCleanup(async () => {
      activeApp?.cleanup()
      await cleanupIntegrationTest()
    })

    return async (options?: CreateTestAppOptions) => {
      activeApp?.cleanup()
      activeApp = await createApp(options)
      return activeApp
    }
  },
)
