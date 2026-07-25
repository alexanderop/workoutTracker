import { createBdd, test as base } from 'playwright-bdd'
import { e2eFixtures, type E2EFixtures } from './test-utils'

// Same fixtures as the plain-spec `test` in ./test-utils, layered onto
// playwright-bdd's base — `createBdd` only accepts a test derived from it.
export const test = base.extend<E2EFixtures>(e2eFixtures)

export const { Given, When, Then } = createBdd(test)

export { expect } from '@playwright/test'
