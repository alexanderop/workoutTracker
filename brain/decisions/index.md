# Decisions

Architecture decision records (ADRs), numbered `NNNN-slug.md`. Offered by `grill` for hard-to-reverse, trade-off-driven decisions.

- [[002-per-kind-block-codecs]] — Status: accepted, fully landed. Supersedes the unimplemented full plugin architecture.
- [[003-effect-style-di]] — Status: accepted for new feature services, landed as the habits pilot. Partially superseded by ADR 004: the `Not in scope` clause, for `Db` only, and the 250-line budget clause no longer hold; the `createGlobalState` half of `Not in scope` still stands.
- [[004-db-in-di]] — Status: accepted. Supersedes ADR 003's `Not in scope` clause, for `Db` only.
