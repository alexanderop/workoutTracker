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
- Locator actions and `expect.element()` assertions are source-linked in traces.
  Add `page.mark()` or `locator.mark()` only when those automatic action groups
  do not explain a failure; wrap shared assertion helpers in `vi.defineHelper()`
  when the calling test is the useful failure location.
