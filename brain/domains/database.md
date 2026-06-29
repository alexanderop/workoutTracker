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
- `src/db/implementations/dexie/` — concrete repository implementations
- `src/features/settings/utils/validation/`

## Gotchas

- All DB access goes through repositories.
- Schema changes require converter updates for backward compatibility.
- Large DB-backed collections should avoid unnecessarily deep reactivity.

## Verification

- Run `pnpm type-check`.
- Run affected repository/converter tests, or `pnpm test` for broad changes.
