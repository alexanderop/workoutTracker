import fs from 'node:fs'
import type { FullConfig } from '@playwright/test'

/**
 * Fails loudly, on an actual `playwright test` run, when the BDD project's
 * generated spec directory is missing or empty -- the failure mode this
 * guards against is the `chromium` project's specs masking the BDD project's
 * absence, so `playwright test` exits 0 while every Gherkin scenario silently
 * contributed zero tests.
 *
 * This is wired as `globalSetup`, not an inline check in the body of
 * `playwright.config.ts`, because `bddgen` itself loads `playwright.config.ts`
 * before it generates anything -- an inline throw there would fire during
 * `bddgen` and break `bddgen && playwright test` outright. `globalSetup` only
 * runs for an actual test run, which is the seam that needs guarding.
 *
 * Known limitation: `globalSetup` does NOT run for `playwright test --list`,
 * so `--list` on its own will still under-report silently if the generated
 * directory is missing. This guard covers every real `playwright test`
 * invocation (the case that actually skips tests), not `--list`.
 */
export default function assertBddSpecsGenerated(config: FullConfig): void {
  const bddProject = config.projects.find((project) => project.name === 'bdd')
  if (!bddProject) {
    throw new Error(
      "bddGuard: no Playwright project named 'bdd' was found in playwright.config.ts. " +
        'The config and this guard have drifted apart -- update one to match the other.',
    )
  }

  const dir = bddProject.testDir
  const hasEntries =
    fs.existsSync(dir) &&
    fs.readdirSync(dir, { recursive: true, withFileTypes: true }).some((entry) => entry.isFile())

  if (!hasEntries) {
    throw new Error(
      `bddGuard: the generated BDD spec directory "${dir}" is missing or empty. ` +
        'Run `bddgen` before `playwright test` -- use `pnpm test:e2e` or ' +
        '`pnpm test:e2e:prebuilt`.',
    )
  }
}
