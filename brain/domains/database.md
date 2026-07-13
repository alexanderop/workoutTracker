---
type: Domain Map
title: Database
description: Routing for Dexie schema, repository, converter, and migration changes.
resource: brain/domains/database.md
tags: [database, dexie, local-first]
timestamp: 2026-06-28T08:05:00Z
---

## Database

Use this map for IndexedDB, Dexie, repository, converter, import/export, and
schema compatibility work.

## Read First

- [Agent database guide](../reference/agent/database.md)
- [Dexie improvements plan](../reference/plans/dexie-improvements.md)
- [Repo Dexie review](../reference/reviews/repo-dexie-review.md)
- [Preserve long-now data](../principles/preserve-long-now-data.md)

## Source Areas

- `src/db/schema.ts`
- `src/db/interfaces.ts`
- `src/db/converters.ts`
- `src/db/index.ts`
- `src/db/provider.ts` — swappable `RepositoryProvider` (get/set/reset); Dexie
  is the current implementation, but call sites resolve repositories through
  this indirection so a future non-Dexie backend can be swapped in.
- `src/db/implementations/dexie/` — concrete repository implementations
- `src/composables/useLiveQuery.ts` — bridges repository `LiveQuery<T>`
  (`observeX()` methods) into Vue reactivity.
- `src/features/settings/utils/validation/`

## Gotchas

- All DB access goes through repositories, resolved via
  `getRepositoryProvider()` in `src/db/provider.ts` — never import
  `src/db/implementations/dexie/*` directly outside of provider setup/tests.
- Schema changes require converter updates for backward compatibility.
- Large DB-backed collections should avoid unnecessarily deep reactivity.
- `TemplatesRepository.create()` always generates its own `id` — there is no
  method to insert a template with a caller-chosen id. Tests must use the `id`
  on the returned template, never a hardcoded literal.
- Under `fake-indexeddb`, pass `Infinity` (not `Number.MAX_SAFE_INTEGER`) for
  "no limit" queries. Real Dexie special-cases `Infinity` to skip the `count`
  argument to `IDBIndex.getAll()`; `Number.MAX_SAFE_INTEGER` gets forwarded
  and exceeds IndexedDB's `[EnforceRange] unsigned long`, throwing under
  `fake-indexeddb`. See `getAllWorkouts()` in
  [`dbAssertions.ts`](../../src/__tests__/helpers/dbAssertions.ts).

## Verification

- Run `pnpm type-check`.
- Run affected repository/converter tests, or `pnpm test` for broad changes.
