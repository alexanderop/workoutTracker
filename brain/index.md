# Brain

## Decisions
- [[decisions/002-per-kind-block-codecs]] — Status: accepted, fully landed. Supersedes the unimplemented full plugin
- [[decisions/003-effect-style-di]] — Status: accepted for new feature services, landed as the habits pilot. `Scope`
- [[decisions/004-db-in-di]] — Status: accepted. Supersedes ADR 003's `Not in scope` clause, for `Db` only —

## Lessons
- [[lessons/local-data-gotchas]] — Keep these invariants covered by tests when changing the related code.
- [[lessons/testing-gotchas]] — Most test configuration and commands are authoritative in `package.json`,

## Principles
- [[principles]] — Project engineering and design principles. One topic per file in `principles/`, linked here as `[[p…
- [[principles/type-guarantees-need-a-pinned-call-site]] — A constrained signature only proves something where code actually calls it. If

## Reference
- [[reference/research/2026-07-19-mobile-modal-keyboard-ux]] — ---
- [[reference/research/2026-07-25-android-pwa-timer-audio-over-music]] — ---

## Other
- [[codebase]] — Durable as-is maps of the project structure, authored by `map-codebase`. One area per file in `code…
- [[context]] — Project domain glossary. Grown by `grill` as terms are resolved. One term per definition; split lar…
