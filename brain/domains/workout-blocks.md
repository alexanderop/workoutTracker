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

- `src/types/blocks.ts`
- `src/types/workout.ts`
- `src/features/workout/composables/useWorkout.ts`
- `src/db/schema.ts`
- `src/db/converters.ts`
- `src/features/settings/utils/validation/`
- `src/features/workout/utils/markdownExport.ts`
- `src/features/workout/utils/markdownImport.ts`
- `src/__tests__/factories/`

## Gotchas

- Strength completion lives in `sets[].status`; non-strength completion usually
  lives in `result !== null`.
- Tabata uses `exercise`, not `exercises`.
- Cardio has a result but is not a timed block.
- Converter registries and runtime switches must stay in sync.

## Verification

- Run `pnpm type-check`.
- Add or update a browser-mode integration test for create, persist, reload, and
  render when the user-facing flow changes.
