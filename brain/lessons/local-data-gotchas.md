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
