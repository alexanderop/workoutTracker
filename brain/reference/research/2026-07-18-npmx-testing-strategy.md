---
type: Research
title: "npmx Testing Strategy: Vitest Browser Mode and Playwright E2E"
description: Comparison of npmx.dev's three test layers with the workout tracker's browser-mode suite and a recommended Playwright E2E boundary.
resource: brain/reference/research/2026-07-18-npmx-testing-strategy.md
tags: [testing, vitest, browser-mode, playwright, e2e, npmx]
timestamp: 2026-07-18T12:01:55Z
---

## Problem Statement

The workout tracker already runs most tests in real Chromium through Vitest
Browser Mode, using Playwright as Vitest's browser provider. It needs a clear
boundary between those tests and a separate Playwright Test end-to-end suite.

This research inspected `npmx-dev/npmx.dev` at commit
`0b7e4a2d961615ef9660948bbe2bc9d2ad87ef6d` (2026-07-17) and compared its
test configuration, examples, scripts, and CI jobs with this repository.

## Key Findings

### Playwright has two different roles

`@vitest/browser-playwright` does not make a Vitest test an end-to-end test.
Vitest still owns discovery, assertions, mocks, and component mounting;
Playwright only provides the real browser. Playwright Test (`@playwright/test`)
is a separate runner that opens the running application at a real URL.

npmx makes this separation explicit:

| Layer | Runner and environment | npmx scope | npmx size |
|---|---|---|---:|
| Unit | Vitest in Node | Pure app, server, shared, and CLI logic | 82 files |
| Component | Vitest Browser Mode with Playwright provider | Mounted Nuxt components, composables, and pages | 55 files |
| E2E | Playwright Test against a built preview server | Cross-page user behavior and production wiring | 13 files |

Its component project calls `mountSuspended()`, freely mocks Nuxt imports and
composables, and inspects component output. Its E2E tests call `goto()`/`page`
against `http://localhost:5678`, observe URLs and network responses, and never
mount or import Vue components.

### npmx treats the built-app boundary as meaningful

The `test:browser` script builds the application in test mode before running
Playwright. `playwright.config.ts` starts the preview server, reuses it locally,
runs isolated Chromium tests, retries only in CI, and records a trace on the
first retry. CI runs unit, component, and E2E suites as separate jobs.

External APIs are deterministic in E2E: Playwright routes return fixtures and
fail loudly for an unhandled external request. Connector behavior uses a mock
HTTP server rather than mocking an imported application composable. The same
scenario is cheaper in component tests, where the composable is replaced with
reactive mock state.

### The workout tracker already has a strong component/integration layer

The current repository has 163 browser-mode spec files, including 94 under
`integration/`. About 94 specs mount the app with `createTestApp()`. They cover
components, routed feature slices, Dexie repository behavior, browser APIs,
accessibility, and visual regression. `fake-indexeddb` and explicit VueUse
singleton resets make these tests deterministic and parallelizable.

There is no independent E2E suite that starts Vite preview and enters through
the application's real URL. Consequently, the current tests do not fully prove
the production entry point, built assets, real browser storage across page
reloads, history/deep links, or service-worker/offline behavior.

## Codebase Patterns

Keep these existing strengths:

- `createTestApp()` plus page objects for fast, exhaustive feature behavior.
- Vitest Browser Mode for Vue components, dialogs, validation, focus, browser
  APIs, and feature-level tests with Vue Router and Dexie.
- `fake-indexeddb` and `resetDatabase()` for isolated component/integration
  tests.
- Separate Vitest projects for accessibility, visual, and architecture tests.
- Property-based tests for converters and domain calculations.

Correct two pieces of terminology when adding E2E:

- A "browser test" is ambiguous because both suites use Chromium. Name the
  layers "Vitest browser component/integration" and "Playwright E2E".
- A full `App` mount inside Vitest can be a valuable integration test, but it
  is not E2E because it bypasses the served build and top-level browser page.

## Recommended Approach

Adopt npmx's three-layer strategy, adjusted for this local-first PWA:

| Question | Put it in | Examples |
|---|---|---|
| Does pure logic return the right result? | Vitest Node project | workout converters, timer math, formatting, schema validation |
| Does a component or feature behave correctly in a real DOM? | Vitest Browser Mode | block editor states, exercise picker, dialogs, keyboard/focus, routed views, rare errors via mocks |
| Can a user complete a critical journey through the served app? | Playwright E2E | first launch, complete workout and reload history, deep link/back, export/import, offline cached launch |

Use this decision rule: choose the lowest realistic layer that can prove the
behavior. Keep branch matrices and edge states in Vitest. Let a small E2E suite
prove representative wiring; do not repeat every assertion from component
tests.

### Initial Playwright E2E scope

Start with five high-value Chromium journeys:

1. First launch completes onboarding and survives reload.
2. Create a strength workout, log a set, complete it, reload, and find it in
   history.
3. Create a template and start a workout from it.
4. Open a deep link, use back/forward navigation, and reload the route.
5. Warm the PWA cache, switch the browser context offline, and reopen the app.

Add one mobile viewport smoke to the critical workout flow. Add WebKit only for
a small smoke subset if Safari-specific risk justifies its CI cost. Playwright's
service-worker automation is Chromium-only, so keep offline/PWA tests there.

### Suggested implementation shape

- Add `@playwright/test` explicitly; the existing `playwright` package used by
  Vitest's provider is not the E2E test-runner dependency.
- Add `playwright.config.ts` with `testDir: './e2e'`, a preview-server
  `webServer`, `baseURL`, CI-only retries, and `trace: 'on-first-retry'`.
- Add `test:e2e`, `test:e2e:ui`, and optionally `test:e2e:update` scripts.
- Build before E2E and serve with `vite preview`; do not import application
  components from E2E specs.
- Give every Playwright test a fresh browser context. Seed through user-visible
  flows or a narrow public fixture helper, then verify IndexedDB persistence by
  reloading within the same test.
- Keep external dependencies offline and deterministic. Do not block service
  workers in the dedicated PWA tests.
- Run E2E as a separate CI job after the build/type/lint gates. Keep the large
  Vitest browser suite sharded as it is.

Moving all pure tests from Browser Mode to a Node Vitest project would match
npmx more closely and improve speed, but it should be a later measured cleanup,
not a prerequisite for Playwright. First establish the missing E2E boundary.

### Implementation status

Implemented on 2026-07-18:

- Added the explicit `@playwright/test` runner alongside the existing
  Playwright browser provider used by Vitest.
- Added production-preview scripts, `playwright.config.ts`, a shared E2E
  fixture, and a dedicated E2E TypeScript project.
- Added three Chromium journeys for onboarding, active-workout reload, and
  completed-workout history persistence.
- Added a separate CI job that downloads the existing production build and
  runs Playwright with an HTML report and first-retry traces.

## Sources

- [npmx.dev repository at inspected commit](https://github.com/npmx-dev/npmx.dev/tree/0b7e4a2d961615ef9660948bbe2bc9d2ad87ef6d) - Source configuration, tests, scripts, and CI.
- [npmx Vite/Vitest configuration](https://github.com/npmx-dev/npmx.dev/blob/0b7e4a2d961615ef9660948bbe2bc9d2ad87ef6d/vite.config.ts) - Separate Node unit and browser component projects.
- [npmx Playwright configuration](https://github.com/npmx-dev/npmx.dev/blob/0b7e4a2d961615ef9660948bbe2bc9d2ad87ef6d/playwright.config.ts) - Built preview server and E2E settings.
- [npmx contributing guide](https://github.com/npmx-dev/npmx.dev/blob/0b7e4a2d961615ef9660948bbe2bc9d2ad87ef6d/CONTRIBUTING.md#testing) - Project's documented test categories and fixture strategy.
- [Vitest Browser Mode component testing](https://vitest.dev/guide/browser/component-testing.html) - Official guidance for real-browser component tests.
- [Vitest Browser Mode](https://vitest.dev/guide/browser/) - Provider, projects, and browser configuration.
- [Vue testing guide](https://vuejs.org/guide/scaling-up/testing.html) - Official unit, component, and E2E taxonomy.
- [Playwright best practices](https://playwright.dev/docs/best-practices) - User-visible locators, isolation, and test independence.
- [Playwright web server](https://playwright.dev/docs/test-webserver) - Starting and reusing an application server.
- [Playwright service workers](https://playwright.dev/docs/service-workers) - Chromium support and service-worker limitations.
- [Playwright browser contexts](https://playwright.dev/docs/api/class-browsercontext) - Isolation, offline emulation, and IndexedDB storage state.
