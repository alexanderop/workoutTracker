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
  is simply empty, and a sibling project with its own specs keeps Playwright
  from tripping its "no tests found" guard. `test/e2e/bddGuard.ts` (wired as
  `globalSetup`) fails loudly on a real run. It cannot fire for `playwright test
  --list`, which does not run `globalSetup`.
- Every e2e scenario is Gherkin — `test/e2e/features/*.feature` plus steps in
  `test/e2e/steps/`. There are no plain `.spec.ts` files under `test/e2e`, and
  both Playwright projects read the generated `.features-gen/` directory, so a
  new e2e test means a new scenario, not a new spec file.
- playwright-bdd's step registry is **global** and keyword-typed. Two features
  declaring the same sentence is an ambiguous-step error, not sharing — put
  cross-feature sentences in `test/e2e/steps/app.steps.ts`. And a sentence
  registered with `Given` will not match a `When` step (nor `And` following
  one); register it under the keyword the feature file actually uses.
- Locator actions and `expect.element()` assertions are source-linked in traces.
  Add `page.mark()` or `locator.mark()` only when those automatic action groups
  do not explain a failure; wrap shared assertion helpers in `vi.defineHelper()`
  when the calling test is the useful failure location.
