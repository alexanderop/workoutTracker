---
type: Reference
title: Nutrition Tracking Model
description: Canonical local-first data model and persistence rules for nutrition goals, foods, and diary entries.
resource: brain/reference/nutrition-tracking-model.md
tags: [reference, nutrition, dexie, local-first]
timestamp: 2026-07-19T08:00:00Z
---

## Nutrition Tracking Model

Nutrition is a feature module under `src/features/nutrition`; other feature
modules must not import it. Route-level views may compose it with workout,
weight, and habits UI.

## Stored Data

- `nutritionGoals` contains one `id: 'current'` row with daily calorie and
  macro targets.
- `foods` is the user's reusable, on-device food library. Nutrients are stored
  per 100 grams so any serving size can be calculated consistently.
- `nutritionDiaryEntries` stores a local `YYYY-MM-DD` key, meal, grams, and an
  immutable food snapshot. The snapshot is required: editing a reusable food
  later must not rewrite historical nutrition totals.

Daily totals are derived from diary entries and never stored. New foods and
their first diary entry are written in one Dexie transaction.

## Persistence Cascade

When adding nutrition fields or tables, update all of:

1. `src/db/schema.ts` and `src/db/interfaces.ts`.
2. The next Dexie schema version in `src/db/implementations/dexie/database.ts`.
3. The Dexie nutrition repository and provider getter.
4. Export/import tables and Zod validation. New backup properties remain
   optional at the file boundary so older backups still import as empty arrays.
5. Mock repository providers, calculation tests, repository round-trip tests,
   and the dashboard browser flow.
