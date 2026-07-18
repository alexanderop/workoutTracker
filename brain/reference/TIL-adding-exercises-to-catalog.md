---
type: TIL
title: Adding Exercises to the Built-in Catalog (Seed Batches)
description: Cascade checklist for extending popularExercises so existing installs receive the new entries.
resource: brain/reference/TIL-adding-exercises-to-catalog.md
tags: [exercises, seeding, dexie, icons, i18n]
timestamp: 2026-07-18T21:40:00Z
---

## Why this exists

`seedPopularExercises` only full-seeds an **empty** database, and the exercise
picker reads exclusively from the DB-backed store — so appending to
`popularExercises` alone never reaches existing installs. Seeding is now
**versioned**: new catalog entries ship as a batch that tops up old databases
exactly once (EGYM Smart Strength was batch 2, added 2026-07).

## Cascade checklist

1. **Catalog** — `src/data/popularExercises.ts`: export the new entries as a
   named batch array (like `egymExercises`) and spread it into
   `popularExercises`. Update the summary comment counts.
2. **Seeder** — `src/db/seedExercises.ts`: append the batch to `SEED_BATCHES`
   with the next version number and bump `CURRENT_SEED_VERSION`. The top-up
   skips names already in the DB and runs once per install (marker in
   localStorage under `exercises_seed_version`), so user deletions are not
   resurrected.
3. **Icons** — every popular exercise MUST resolve to a bundled icon
   (`ExerciseIcon.spec.ts` enforces this). Cheapest path: add the new names as
   `aliases` on existing entries in
   `src/components/exercise-icons/manifest.ts`, then run
   `pnpm generate:exercise-icons` and prettier over `generated/` (the
   generator emits unformatted output).
4. **New equipment value?** Adding to `EQUIPMENT_VALUES` propagates to Zod
   schemas and property tests automatically, but three exhaustive records need
   manual entries (type-check finds them): `EQUIPMENT_LABELS`
   (`src/lib/exerciseLabels.ts`), `EQUIPMENT_ICONS`
   (`src/lib/exercises/equipmentMetadata.ts`), and the i18n
   `exercises.equipment` maps in **both** `src/i18n/messages/en/exercises.ts`
   and `de/exercises.ts`. Also add a `SelectorOption` in
   `src/features/exercises/data/exerciseOptions.ts`.

## Gotchas

- Exercise names are the identity everywhere (seeding dedupe, icon aliases,
  `templateBlock.ts` lookups) — never rename a shipped catalog entry.
- Icon alias uniqueness is checked after normalization (lowercase, dashes →
  spaces); an alias may appear on only one manifest entry.
