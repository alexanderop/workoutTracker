# Project brain

Keep this directory deliberately small. The code, tests, Git history, and
[`AGENTS.md`](../AGENTS.md) are authoritative for implementation details,
commands, project structure, and current capabilities.

A brain note belongs here only when it records:

- why a durable architectural decision was made; or
- a project-specific failure mode that is difficult to infer from the code.

Do not store inventories, backlogs, completed plans, audits, tutorials, or
implementation status here. Use the issue tracker for future work and Git
history for past work. Delete a note once a test, type, lint rule, or code
comment makes it redundant.

## Read only when relevant

- [Per-kind block codecs](./decisions/002-per-kind-block-codecs.md) — changing the
  block architecture or codec responsibilities.
- [PR description format](./decisions/003-pr-description-format.md) — opening or
  updating a pull request; the required body sections and QA-oriented contract.
- [Local-data gotchas](./lessons/local-data-gotchas.md) — changing persistence,
  autosave, timers, dates, import/export, or destructive data operations.
- [Testing gotchas](./lessons/testing-gotchas.md) — diagnosing browser-mode,
  IndexedDB, singleton-state, or coverage failures.
