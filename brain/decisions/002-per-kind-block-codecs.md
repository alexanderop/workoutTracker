# ADR 002: Per-kind block codecs

Status: accepted. Supersedes the unimplemented full plugin architecture.

## Decision

Each workout block kind owns its representations under `src/blocks/<kind>/`:

- `types.ts` defines the kind's domain and stored shapes.
- `codec.ts` owns database, template, validation, and Markdown mappings.
- `meta.ts` owns display metadata.
- `create.ts` owns creation helpers.
- `src/blocks/registry.ts` is the exhaustive runtime dispatch.

`src/blocks/` is feature-neutral and must not import feature modules.
Lifecycle, Vue components, timers, and other runtime behavior remain in
`src/features/`; they are intentionally not codec responsibilities.

## Why

Representation logic was previously repeated across types, converters, Zod
schemas, template conversion, and Markdown import/export. That made a block
field change a large, drift-prone cascade. Co-locating representation logic
and using one exhaustive registry gives TypeScript and round-trip tests a
single boundary to enforce without introducing a kitchen-sink plugin system.
