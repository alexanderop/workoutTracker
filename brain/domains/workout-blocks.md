---
type: Domain Map
title: Workout blocks
description: Routing for strength, timed, cardio, template, and import/export block changes.
resource: brain/domains/workout-blocks.md
tags: [workout, blocks, domain-model]
timestamp: 2026-06-28T08:05:00Z
---

## Workout Blocks

Use this map before changing workout block kinds, block fields, results, or
template/import/export behavior.

## Read First

- [Workout block model](../reference/workout-block-model.md)
- [TIL: adding fields to block types](../reference/TIL-adding-fields-to-block-types.md)
- [Workout domain skill](../../.agents/skills/workout-domain/SKILL.md)

## Source Areas

- `src/blocks/<kind>/` — canonical home of per-kind types and Block Codecs
  (ADR 002); `src/blocks/registry.ts` is the runtime dispatch
- `src/types/blocks.ts` — compat barrel re-exporting from `src/blocks/`
- `src/types/workout.ts`
- `src/features/workout/composables/useWorkout.ts`
- `src/db/schema.ts` — workout/template/exercise DB types; block DB types are
  re-exported from `src/blocks/`
- `src/db/converters.ts` — workout-level conversion only; per-kind conversion
  lives in the codecs
- `src/features/settings/utils/validation/`
- `src/features/workout/utils/markdownExport.ts`
- `src/features/workout/utils/markdownImport.ts`
- `src/__tests__/factories/`

## Gotchas

- Strength completion lives in `sets[].status`; non-strength completion usually
  lives in `result !== null`.
- Tabata uses `exercise`, not `exercises`.
- Cardio has a result but is not a timed block.
- The Codec Registry (`src/blocks/registry.ts`) is the single dispatch; there
  are no parallel per-kind switches anymore. Adding a kind = new folder +
  registry entry; the mapped registry type fails compilation until complete.

## Verification

- Run `pnpm type-check`.
- Add or update a browser-mode integration test for create, persist, reload, and
  render when the user-facing flow changes.
