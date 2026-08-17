# Brain

## _archive
- [[_archive/food-logging-surface]] — Archived 2026-08-17 (brain sync): resolved prototype journal for a now-shipped

## Decisions
- [[decisions/002-per-kind-block-codecs]] — Status: accepted, fully landed. Supersedes the unimplemented full plugin
- [[decisions/003-effect-style-di]] — Status: accepted for new feature services, landed as the habits pilot. `Scope`
- [[decisions/004-db-in-di]] — Status: accepted. Supersedes ADR 003's `Not in scope` clause, for `Db` only —

## Lessons
- [[lessons/lazy-dialog-open-watcher]] — Dialogs with non-trivial dependencies (camera, live queries, etc.) are mounted
- [[lessons/local-data-gotchas]] — Keep these invariants covered by tests when changing the related code.
- [[lessons/testing-gotchas]] — Most test configuration and commands are authoritative in `package.json`,

## Principles
- [[principles]] — Project engineering and design principles. One topic per file in `principles/`, linked here as `[[p…
- [[principles/a-fake-must-not-promise-more-than-the-real-thing]] — A test double exists to stand in for a dependency. The moment it guarantees
- [[principles/encode-lessons-in-structure]] — A lesson written down is a lesson someone has to remember to read. A lesson
- [[principles/type-guarantees-need-a-pinned-call-site]] — A constrained signature only proves something where code actually calls it. If

## Reference
- [[reference/research/2026-07-19-mobile-modal-keyboard-ux]] — ---
- [[reference/research/2026-07-25-android-pwa-timer-audio-over-music]] — ---

## Other
- [[codebase]] — Durable as-is maps of the project structure, authored by `map-codebase`. One area per file in `code…
- [[context]] — Project domain glossary. Grown by `grill` as terms are resolved. One term per definition; split lar…
