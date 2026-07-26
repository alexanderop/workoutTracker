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
- `bail: 1` is set for local runs (`vitest.config.ts`), so a **failing** browser
  run stops at the first failure and its "N passed" total is a partial count,
  not tier coverage. A green run is complete and trustworthy; a red one is
  truncated. Never cite the count from a truncated run as evidence that the
  tier passed — re-run with `CI=1 pnpm test` (which sets `bail: 0`) to see every
  failure and the real total. The full default project is ~173 files / ~1289
  tests and takes ~5 minutes.
- A Playwright project can silently contribute **zero** tests while the run
  still exits 0: if `bddgen` has not generated `.features-gen/`, the BDD project
  is simply empty, and because the sibling `chromium` project still has tests,
  Playwright never trips its "no tests found" guard. `test/e2e/bddGuard.ts`
  (wired as `globalSetup`) now fails loudly on a real run. It cannot fire for
  `playwright test --list`, which does not run `globalSetup`.
- Locator actions and `expect.element()` assertions are source-linked in traces.
  Add `page.mark()` or `locator.mark()` only when those automatic action groups
  do not explain a failure; wrap shared assertion helpers in `vi.defineHelper()`
  when the calling test is the useful failure location.
