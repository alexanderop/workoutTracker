---
type: Reference
title: "Vitest Browser Mode Troubleshooting"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/vitest-browser-troubleshooting.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Vitest Browser Mode Troubleshooting

Project-specific troubleshooting for the Vitest + Playwright browser mode setup. For
the original setup rationale see [`./vitest-browser-mode-plan.md`](./vitest-browser-mode-plan.md)
and the writeup in [`./blog/vitest-browser-mode.md`](./blog/vitest-browser-mode.md).

Config lives in [`vitest.config.ts`](../../vitest.config.ts) and the global setup file
is [`src/__tests__/setup.ts`](../../src/__tests__/setup.ts).

## Project Layout

`vitest.config.ts` defines four Vitest **projects**. Each script targets one:

| Script             | Project   | Includes                                                | Runner                        |
| ------------------ | --------- | ------------------------------------------------------- | ----------------------------- |
| `pnpm test`        | `default` | `src/__tests__/**/*.spec.ts` (excl. `a11y/`, `visual/`) | Chromium (headless)           |
| `pnpm test:a11y`   | `a11y`    | `src/__tests__/a11y/**/*.spec.ts`                       | Chromium (headless)           |
| `pnpm test:visual` | `visual`  | `src/__tests__/visual/**/*.spec.ts`                     | Chromium + screenshot compare |
| `pnpm test:arch`   | `arch`    | `src/__tests__/architecture/**/*.test.ts`               | **Node** (no browser)         |

The `arch` project deliberately runs in Node so ArchUnitTS can read the filesystem.
If you put a normal component test under `architecture/` it will fail with
`document is not defined` — move it to `components/` or `integration/`.

## `pnpm test` vs `pnpm test:unit`

**There is no `test:unit` script in this repo.** This is the most common mistake
when copy-pasting from other Vue projects or generic Vitest docs.

```bash
pnpm test           # correct: runs default project once
pnpm test:watch     # watch mode
pnpm test -- src/__tests__/integration/foo.spec.ts   # single file
```

If you see `ERR_PNPM_NO_SCRIPT  Missing script: "test:unit"`, use `pnpm test`.

## Headed vs Headless

```bash
pnpm test           # headless chromium, what CI runs
pnpm test:headed    # headed chromium, watches a real browser window
pnpm test:ui        # opens the Vitest UI in a browser tab
```

Use `test:headed` when:

- A test passes locally headless but fails in CI and you suspect rendering/layout.
- You need to watch hover, focus, or animation behaviour.
- A Playwright locator times out and you want to see _why_ it can't find the element.

Use `test:ui` for picking a single test to step through, inspecting the DOM
snapshot, and re-running on save without restarting the suite.

## `fake-indexeddb` vs Real IndexedDB

`src/__tests__/setup.ts` imports `'fake-indexeddb/auto'` for **all** browser-mode
projects. This is intentional: each test file gets a fresh in-memory IDB so
`fileParallelism: true` works without cross-test contamination via Chromium's
real IndexedDB (which is shared across the page context).

The `arch` project never touches IDB.

## CI Browser and Coverage Setup

The shared test action caches both Playwright browser locations because the
default and accessibility suites run on Linux while visual tests run on macOS:

- Linux: `~/.cache/ms-playwright`
- macOS: `~/Library/Caches/ms-playwright`

GitHub's hosted Ubuntu image already has the libraries needed by headless
Chromium. Do not add `playwright install --with-deps` or `install-deps` to each
test job: those commands repeatedly fetch large font packages and have made
setup take more than 14 minutes. Install Chromium only on a browser-cache miss.

Any standalone workflow that runs `pnpm install --ignore-scripts` and then
invokes a browser-mode test must restore the Playwright cache and run
`pnpm exec playwright install chromium` on a cache miss. The install command
does not download a browser when dependency lifecycle scripts are disabled;
without this explicit setup, Vitest fails with a missing Chromium executable.

Default-suite coverage is collected by the four existing test shards. Each
shard uploads an Istanbul JSON map; `scripts/merge-coverage.mjs` requires the
exact four-file set and applies the thresholds from `coverage-thresholds.json`.
Keep that JSON file as the single threshold source for both local Vitest runs
and CI.

Common errors when this gets mixed up:

- `InvalidStateError: A mutation operation was attempted on a database that did not allow mutations`
  — A test imported a Dexie module before `setup.ts` ran. Make sure new helpers
  do not import `@/db` at module load time before `fake-indexeddb/auto`.
- Stale rows leaking between tests in the same file — you forgot
  `await resetDatabase()` in `beforeEach`. See
  [`src/__tests__/helpers/resetDatabase.ts`](../../src/__tests__/helpers/resetDatabase.ts).
- `db is not defined` only in the `arch` project — you cannot use Dexie there;
  move the test out of `architecture/`.

## Console Noise Filtering

`vitest.config.ts` has an `onConsoleLog` hook that drops `[WakeLock]` stderr
messages (the Wake Lock API is not granted in headless Chromium and spams the
log). If you need to silence another noisy API:

```ts
onConsoleLog(log, type) {
  if (type === 'stderr' && log.includes('[WakeLock]')) return false
  if (type === 'stderr' && log.includes('[YourThing]')) return false
}
```

Do **not** silence real test failures — only filter known-benign warnings from
APIs the headless browser cannot satisfy.

## Coverage Returning `0/0`

If `pnpm test:coverage` prints `Unknown% (0/0)`, check project include/exclude
patterns before changing providers. Vitest copies test include patterns into its
coverage ignore list; negated `include` entries such as
`!src/__tests__/a11y/**` can cause browser-mode V8 coverage to ignore every
`src` file. Keep positive test globs in `include` and move suite exclusions to
`exclude`:

```ts
include: ['src/__tests__/**/*.spec.ts'],
exclude: [...sharedTestConfig.exclude, 'src/__tests__/a11y/**', 'src/__tests__/visual/**'],
```

Also give each browser project instance a unique `name` so coverage remapping
can distinguish the default, a11y, and visual projects.

## Coverage Text Table Silently Omits Files

The `text` coverage reporter can drop rows for files that ARE covered — during
the habits build (2026-07) 8 of 16 files with collected data (several at 100%)
simply never appeared in the printed table, under both the `v8` and `istanbul`
providers. Do not conclude a file is untested (or dead) from the table alone.
To audit per-file coverage, add the `json` reporter and read
`coverage/coverage-final.json` — count `s`/`f`/`b` hits per file; the
`statementMap` start lines give exact uncovered lines. CLI overrides like
`--coverage.include=...` are merged with (not substituted for) the config
arrays, so scoping a coverage audit requires temporarily editing
`vitest.config.ts`.

## Flaky Test Diagnosis

Three causes account for almost every flake in this repo, in order:

1. **Singleton store leakage.** All global stores use `createGlobalState()` from
   VueUse (not Pinia), so they survive across tests in the same file. The fix
   is `await resetDatabase()` in `beforeEach` — it resets every singleton listed
   in [`resetDatabase.ts`](../../src/__tests__/helpers/resetDatabase.ts) (settings,
   exercises, onboarding, workout, benchmark timer, repo provider). For
   integration tests prefer `setupIntegrationTest()` /
   `cleanupIntegrationTest()` from
   [`integrationSetup.ts`](../../src/__tests__/helpers/integrationSetup.ts).
   If you add a new singleton, register its reset there or your test suite
   will become flaky six commits later.

2. **Playwright locator timing.** Use `await expect.element(locator).toBeVisible()`
   from `vitest-browser-vue` rather than synchronous `getByText().element()`.
   Locators auto-retry; raw element access does not.

3. **Routing/init races.** Components that read from `useAppInitialization()`
   need `resetInitState()` (already inside `setupIntegrationTest`). If a test
   navigates immediately after `page.render()`, await a stable selector before
   asserting.

`bail: 1` is set, so a single flake stops the run. Re-run the failing file
in isolation before assuming it's environmental:

```bash
pnpm test -- src/__tests__/integration/the-flaky-one.spec.ts
pnpm test:headed -- src/__tests__/integration/the-flaky-one.spec.ts
```

## Oxlint and Page Object `fill()` Methods

Oxlint's `unicorn/no-array-fill-with-reference-type` can flag a Page Object
method call such as `row.fill({ kg: 60, reps: 10 })` even when `row` is not an
array. Prefer a domain-specific method name such as `enterValues()` for Page
Objects that accept structured form data. This avoids the false positive and
makes the test action clearer without disabling the rule globally.

## Debugging Cheatsheet

```bash
# single file
pnpm test -- src/__tests__/components/MyThing.spec.ts

# single test by name
pnpm test -- -t "renders empty state"

# headed, single file (watch the real browser)
pnpm test:headed -- src/__tests__/integration/workout-flow.spec.ts

# Vitest UI (pick tests in browser)
pnpm test:ui

# update visual snapshots after intentional UI change
pnpm test:visual:update
```

If Vite hangs on first run after a dependency change, delete
`node_modules/.vite` — `optimizeDeps.include: ['workbox-window']` is the only
forced pre-bundle and stale caches occasionally confuse the PWA plugin in
browser mode.
