# Local-data gotchas

Keep these invariants covered by tests when changing the related code.

- A pending debounced save can recreate a record after a transaction deletes
  it. Gate every writer on terminal domain state or cancel every writer; do
  not rely on transaction ordering alone.
- Walk local calendar days with calendar operations such as `addDays` and
  re-normalize to start-of-day. Fixed 24-hour arithmetic breaks across DST.
- Timers derive elapsed time from timestamps. Interval ticks are throttled
  while the screen sleeps and must not be accumulated as elapsed time.
- Stored history keeps immutable snapshots of mutable catalog data when later
  catalog edits must not rewrite history.
- Every new persisted table or field must be considered separately for schema
  migration, validation, import/export, and delete-all scope. Backup scope and
  destructive-delete scope are not automatically identical.
- New backup properties stay optional at the file boundary when older exports
  must remain importable.
- Never hand a Vue reactive object to a Dexie write. IndexedDB persists via
  `structuredClone`, which throws `DataCloneError` on a `Proxy`. Reading a
  reactive value into a fresh plain object at the boundary (`{ ...nutrients }`)
  is the fix, and the failure surfaces as a rejected write, not as a type
  error — so the browser tier is what catches it.
- Repository sort comparators that tie have no defined order. Adapters stamp
  `createdAt`/`completedAt` with `Date.now()`, so rows written back-to-back
  share a millisecond; the comparator returns `0`, `toSorted` is stable, and
  the result falls through to Dexie's primary-key order over
  `crypto.randomUUID()` — effectively random. This is a production property,
  not just a test one: two progressions created in the same millisecond render
  in arbitrary order on the list screen. Give a comparator a total order (final
  tie-break on `id`) when the order is user-visible, and never assert a
  position in a test that a tie could decide.
