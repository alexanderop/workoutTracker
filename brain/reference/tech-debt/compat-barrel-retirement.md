---
type: Reference
title: "Compat-Barrel Retirement (ADR 002 follow-up)"
description: Transitional re-export barrels left over from the per-kind block codec extraction, and the plan to retire them.
resource: brain/reference/tech-debt/compat-barrel-retirement.md
tags: [reference, tech-debt, blocks, adr-002]
timestamp: 2026-07-14T00:00:00Z
---
## Compat-Barrel Retirement (ADR 002 follow-up)

The ADR 002 extraction of `src/blocks/` kept the old import paths working via
transitional re-export barrels. They are compat shims, not architecture —
new code must import from `@/blocks` (the public barrel,
`src/blocks/index.ts`) instead.

### The barrels

- `src/types/blocks.ts` — re-exports block unions, per-kind types, guards,
  and display helpers from `@/blocks/*` (plus the app-owned `WorkoutMode`).
- `src/db/schema.ts` (parts) — re-exports the `Db*` block/template types
  from `@/blocks/*`; the Dexie table types themselves stay.
- `src/lib/workoutBlockFactory.ts` — re-exports the per-kind and
  kind-neutral block creators from `@/blocks/*/create` and `@/blocks/create`.
- `src/features/workout/utils/markdownSpec.ts` — re-exports the markdown
  parse types/helpers and per-kind `Parsed*` intermediates from `@/blocks/*`.

### Retirement plan

1. Migrate remaining importers of the barrels to `@/blocks` (the deep
   imports *inside* the barrels are fine until the barrel itself dies).
2. Delete each barrel once it has no importers left (`WorkoutMode` in
   `src/types/blocks.ts` needs a new home first).
3. Restore the tightened `types` main-sequence threshold: `maxDistance`
   0.3 → 0.25 in `src/__tests__/architecture/metrics/moduleDefinitions.ts`
   and the matching assertion in
   `src/__tests__/architecture/mainSequence.test.ts` (it was loosened
   because the barrels make `src/types` a pure re-export layer).

### Related dead data

`BlockMeta.icon` (`src/blocks/types.ts`) is `icon: ''` in all six
`src/blocks/<kind>/meta.ts` files, so every `BLOCK_ICONS` consumer (the
configure-block dialogs, `WorkoutTimedBlockCard`) binds an empty string.
Either populate the icons or drop the field and `BLOCK_ICONS`.
