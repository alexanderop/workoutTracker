---
type: Reference
title: "ADR 002: Per-Kind Block Codecs"
description: Consolidate all per-kind representation mappings behind one Block Codec module per kind; supersedes ADR-001.
resource: brain/reference/adr/002-per-kind-block-codecs.md
tags: [reference, adr, blocks, serialization]
timestamp: 2026-07-13T20:00:00Z
---

## ADR 002: Per-Kind Block Codecs

**Status:** Accepted
**Date:** 2026-07-13
**Deciders:** Alex
**Supersedes:** ADR-001 (plugin-based workout architecture)

## Context

"What a block of kind X looks like" is encoded in ~11 production locations per kind (domain type, DB type, template DB type, converter pair, template converter branch, three zod schema files, markdown formatter, markdown parser, parsed-block type) plus test arbitraries. `src/db/converters.ts` maintains a fully-typed `BLOCK_CONVERTERS` registry that is `void`-discarded and two hand-written switches that re-enumerate the same wiring. Adding one field means a ~15-file cascade guarded only by type-check (see `brain/reference/TIL-adding-fields-to-block-types.md`).

ADR-001 proposed full workout-type plugins (lifecycle, components, composables, persistence per plugin). Seven months later `src/plugins/` was never created and the codebase evolved the opposite way — small pure modules (`workoutBlockFactory`, `workoutBlockList`, `emomMath`) with fat orchestrating composables. The plugin machinery is not coming.

## Decision

Each kind gets one folder under `src/blocks/<kind>/` that owns everything per-kind:

```
src/blocks/strength/
  types.ts    # StrengthBlock, DbStrengthBlock, DbTemplateStrengthBlock
  codec.ts    # toDb/fromDb, dbSchema, formatMarkdown/parseMarkdown,
              # toTemplate/fromTemplate, templateSchema
  meta.ts     # label, icon, color, duration display
  create.ts   # createStrengthWorkoutBlock (+ from-template/from-history seeds)
src/blocks/registry.ts   # exhaustive Kind -> { codec, meta, create }
```

The **Block Codec** (`codec.ts`) owns every *representation* mapping: domain ⇄ database, database zod schema, markdown format/parse, and template ⇄ workout (collapsing today's two parallel template paths in `dexie/templates.ts` and `workoutBlockFactory.ts`). `meta.ts` and `create.ts` are co-located siblings but stay **off** the codec interface — display and creation are not representation. The **Codec Registry** is the *runtime dispatch* — not a compile-time-only artifact.

Per-kind type declarations move into the kind folders; `src/types/blocks.ts` and `src/db/schema.ts` remain as barrel re-exports (plus the union types) so their large import fan-in doesn't churn.

Delivered in stages, each shipping green:

1. Make the registry the actual dispatch in `converters.ts`; delete both switches. *(Done 2026-07-13: `BLOCK_TO_DB`/`DB_TO_BLOCK` mapped registries with generic indexed-access dispatch — the repo bans type assertions, and one flat registry per direction is what TypeScript can correlate cast-free; the pair-shaped codec object returns at stage 2.)*
2. Create `src/blocks/<kind>/`; move converter pairs and per-kind types (barrels left behind). *(Done 2026-07-13: `types.ts` + `codec.ts` per kind, `shared/` for `BlockExercise`/`Set` converters, unions + `BlockCodec` contract in `src/blocks/types.ts`, pair-shaped `BLOCK_CODECS` registry as the dispatch. The canonical `Set`/`SetStatus` moved here too, killing the old blocks.ts/workout.ts duplicate. Display helpers and guards also moved early — `src/blocks/display.ts` / `guards.ts` — because the main-sequence fitness test correctly flagged that `src/types/blocks.ts` kept only concrete helpers after the type moves. `src/blocks` is registered as a core module in the architecture metrics; `types` and `db` dependency-direction assertions now allow depending on `blocks`.)*
3. Fold the per-kind zod schemas (from `src/features/settings/utils/validation/`) into the codecs. *(Done 2026-07-13: each codec now carries `dbSchema` (typed `z.ZodType<DbBlockByKind[K]>` — zod 4's covariant params make this work); the `schemaFor<DbType>()` compile-time key binding moved to `src/blocks/shared/schemaFor.ts`; generic validation primitives (safeId/safeString/equipment/timestamp) moved to `src/blocks/shared/schemaPrimitives.ts` with the feature's `primitiveSchemas.ts` re-exporting them; `setStatusSchema`/`exerciseRotationSchema` became private to the strength/emom codecs. The `dbWorkoutBlockSchema` discriminated union is built in `registry.ts` from the per-codec schemas. `blockSchemas.ts` and `blockConfigSchemas.ts` are deleted; `templateSchema.ts` imports config schemas and field bases from the codecs until stage 5.)*
4. Fold the per-kind markdown format/parse pairs (from `src/features/workout/utils/`) into the codecs. *(Done 2026-07-13: codecs gained `formatMarkdown: (block: Readonly<DbBlockByKind[K]>) => string` and `parseMarkdown: (name, lines) => ParseResult<ParsedBlockByKind[K]>` — parse returns the kind's Parsed intermediate; exercise-catalog resolution stays in the orchestrator. `Parsed*Block` types live in each kind's `types.ts`; shared markdown helpers (exercise-line format/parse, duration, `FieldParser` loop, `ParseResult`) in `src/blocks/shared/markdown.ts`. `markdownExport.ts` (320→87) and `markdownImport.ts` (801→287) are thin orchestrators dispatching through `BLOCK_CODECS`; `markdownSpec.ts` is a re-export barrel plus workout-level types. One deliberate hardening: unknown-kind checks use `Object.hasOwn(BLOCK_CODECS, type)` so prototype keys like `"constructor"` report "Unknown block type" instead of resolving an inherited member.)*
5. Fold template representation (`DbTemplate*Block`, `templateSchema`, both conversion paths) into the codecs; move display maps and factories into `meta.ts`/`create.ts`. *(Done 2026-07-13 — ADR fully implemented. Codecs gained `toTemplate`, `fromTemplate(templateBlock, context)`, and `templateSchema`; `TemplateInstantiationContext = { orderIndex, generateId }` injects ID generation so `src/blocks` never imports `src/db`. `dbTemplateBlockSchema` union assembled in the registry next to `dbWorkoutBlockSchema`. Per-kind `meta.ts` (label/icon/color) feeds an exhaustive `BLOCK_META` registry; `display.ts` derives `BLOCK_LABELS`/`ICONS`/`COLORS` from it. Per-kind `create.ts` plus `src/blocks/create.ts` orchestration replaced `src/lib/workoutBlockFactory.ts`, now a 14-line re-export barrel. `dexie/templates.ts` shrank 325→163 (converters became codec dispatch); the config schemas and field bases exported for the old `templateSchema.ts` are module-private again. Watch item: `lib`'s main-sequence distance rose to 0.743 (threshold 0.75) because the factory's abstract mass moved to blocks — the barrel can be dropped once callers import from `@/blocks/create` directly. Blocks improved to D 0.165.)*

`src/blocks/` is feature-neutral shared code (features may import it; it imports no features), consistent with the no-cross-feature-imports rule.

## Explicitly out of scope

Lifecycle hooks, per-kind Vue components, and per-kind composables stay in `src/features/` — this ADR deliberately rejects that half of ADR-001. Block *behaviour* (timers, set state machine, completion) is not codec territory; codecs own *representation* only. Display metadata and block creation move into the kind folders for locality but are separate registry entries, not codec members — folding everything into one per-kind object would recreate ADR-001's kitchen-sink plugin.

## Considered options

- **Full plugin architecture (ADR-001):** rejected — never implemented, and the components/lifecycle indirection was the costly part while serialization fan-out was the actual pain.
- **Mechanical registry-as-dispatch only:** rejected as an end state (kept as stage 1) — removes the switch drift but leaves the 11-location fan-out untouched.

## Consequences

- Adding a field to a kind concentrates in that kind's codec folder plus the domain/DB types; the registry's exhaustiveness check enforces coverage once instead of per-switch.
- Zod schemas and markdown codecs physically move out of `features/settings` and `features/workout` into neutral `src/blocks/`.
- The property-test suites (`converters.property.spec.ts`, `markdownRoundtrip.property.spec.ts`, `exportDataSchema.property.spec.ts`) remain the interface tests; they must keep passing unchanged through every stage.
