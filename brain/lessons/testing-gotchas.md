# Testing gotchas

Most test configuration and commands are authoritative in `package.json`,
`vitest.config.ts`, and `src/__tests__/`. Preserve only these non-obvious
failure modes here:

- Browser tests use fake IndexedDB. Integration tests should use the shared
  setup and cleanup helpers, which reset the database and relevant global
  state. When adding global state, add an explicit reset at the appropriate
  shared test boundary.
- For an unlimited Dexie query under `fake-indexeddb`, use `Infinity`, not
  `Number.MAX_SAFE_INTEGER`; the latter exceeds IndexedDB's unsigned-long
  range when forwarded to `getAll()`.
- Before adding tests for an uncovered function, find its production callers.
  Honest user-flow tests cannot cover dead or unreachable code.
- A suite hidden behind `describe.skipIf(isBrowserMode)` does not contribute
  coverage because the default project is browser mode.
- The text coverage table can omit files that exist in collected coverage.
  Use `coverage/coverage-final.json` for a per-file audit.
- Prefer retrying browser locators and wait for a stable visible element after
  render or navigation; raw synchronous element access exposes init races.
- Run one default-project file with
  `pnpm exec vitest run --project=default <file>`. Do not insert a literal `--`
  before the path; it can cause Vitest to run the entire default project.
- Scoped runs filter on **test** paths, and specs are not colocated with source:
  they live under `src/__tests__/`, mirroring the source tree. A filter on
  `src/features/x` or `src/db` therefore matches zero files. That exits 1 with
  "No test files found" rather than passing empty — so a mis-scoped run is loud,
  but only if you read the file count. Several filters OR together in one run:
  `pnpm exec vitest run --project=default src/__tests__/features/weight src/__tests__/integration`.
  The `unit` project is narrower still (`src/__tests__/unit/**/*.spec.ts` only),
  and the `default` project excludes `unit/`, `a11y/`, and `visual/`.
- Failed browser tests retain Playwright traces under `.vitest/traces/` and
  related screenshots under `.vitest-attachments/`. Failed CI shards upload
  both in `vitest-debug-shard-<number>` artifacts. Open a downloaded trace with
  `pnpm exec playwright show-trace <trace.zip>`.
- Those traces will fill the disk on a local full-tier run. `retain-on-failure`
  still records every test before deciding to discard, and one
  `pnpm test:coverage` over the whole `default` project wrote **~29 GB** to
  `.vitest/traces`, hitting `ENOSPC` and killing the run mid-way — which
  presents as an unrelated browser-connection crash, not as a disk error. If a
  full local run dies strangely, `du -sh .vitest` first. `rm -rf .vitest`
  reclaims it, and `--browser.trace.mode=off` avoids it for a run where you do
  not need traces.
- Ordering assertions against the real Dexie adapters can tie and flip; see
  [[local-data-gotchas]]. A fake with a counter clock never ties, so a spec that
  passes in the Node tier can still be asserting an order production does not
  provide.
- `bail: 1` is set for local runs (`vitest.config.ts`), so a **failing** browser
  run stops at the first failure and its "N passed" total is a partial count,
  not tier coverage. A green run is complete and trustworthy; a red one is
  truncated. Never cite the count from a truncated run as evidence that the
  tier passed — re-run with `CI=1 pnpm test` (which sets `bail: 0`) to see every
  failure and the real total. The full default project is ~185 files and takes
  ~5 minutes (test count grows with the suite; re-check via a full run rather
  than trusting a stale figure here).
- A Playwright project can silently contribute **zero** tests while the run
  still exits 0: if `bddgen` has not generated `.features-gen/`, the BDD project
  is simply empty, and because the sibling `chromium` project still has tests,
  Playwright never trips its "no tests found" guard. `test/e2e/bddGuard.ts`
  (wired as `globalSetup`) now fails loudly on a real run. It cannot fire for
  `playwright test --list`, which does not run `globalSetup`.
- A layout assertion that only proves an element **exists** proves nothing about
  whether it is readable. The habits week header shared its grid template with
  the rows beneath it exactly — and every one of its seven labels needed 12–21px
  in a 9.14px column, so they overflowed and painted over each other into one
  smear. The spec was green throughout, because "the header exists" and "it
  shares `HABIT_ROW_GRID_COLUMNS`" were both true. When a test covers text in a
  constrained box, measure: `scrollWidth > clientWidth` per element is the
  assertion, and `getBoundingClientRect().width` is the one for "is this column
  wide enough to tell two truncated names apart". Verify such a test by
  restoring the old geometry and watching it fail — an unverified layout
  assertion is usually asserting the wrong thing.
- Screenshots are not enough on their own either, and neither is axe. axe-core
  dropped `duplicate-id-active`, and `form-field-multiple-labels` does not fire
  when the *second* of two same-id inputs is the unlabelled one — so two
  components rendering a control for the same entity can collide on a DOM id
  and leave one control nameless with the a11y tier green. Assert the control is
  reachable **by accessible name** while both are mounted.
- A CI browser failure reading `locator.click: Timeout 620ms exceeded` with a
  call log that says **"locator resolved to `<button …>`"** is shard load, not a
  broken selector. Nothing configures 620ms: Vitest browser derives an action's
  timeout from what remains of the test budget (`testTimeout` is 15s in CI), so
  a sub-second figure means the test had already spent ~14s before reaching that
  click. The element was found; there was simply no budget left to act on it.
  Check the spec in isolation before touching anything — on 2026-07-26 a shard-1
  `numeric-keypad.spec.ts` failure (1 failed / 356 passed, setup alone 140s)
  passed 3/3 locally and referenced nothing in the PR's diff.
- The `visual` tier cannot be run on Linux. Every tracked baseline is
  `*-chromium-darwin.png` because CI runs `test-visual` on a macOS runner, so a
  local Linux run finds no reference, *creates* `*-chromium-linux.png`, and fails
  with "No existing reference screenshot found" — which reads exactly like a
  regression and is not one. Delete the generated `*-linux.png` files afterwards;
  committing them would plant bogus baselines. Corollary: a change that alters a
  snapshotted screen cannot be verified locally, so either scope the change away
  from that screen or hand the baseline regeneration to someone on macOS.
- `expect.element(...)` on something that never appears burns the whole
  `testTimeout` and reports "Test timed out in 8000ms" at the `it()` line, with
  no locator in the message. It looks like a hang, not an assertion failure. The
  failure screenshot under `__screenshots__/` shows the real DOM state and is
  usually faster to read than the stack — check it first.
- Locator actions and `expect.element()` assertions are source-linked in traces.
  Add `page.mark()` or `locator.mark()` only when those automatic action groups
  do not explain a failure; wrap shared assertion helpers in `vi.defineHelper()`
  when the calling test is the useful failure location.
