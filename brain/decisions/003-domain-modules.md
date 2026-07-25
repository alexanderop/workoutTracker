# ADR 003: Domain modules own their vertical

Status: accepted.

## Decision

A *domain module* is a top-level folder under `src/` that owns one domain end
to end and is feature-neutral: `src/blocks/` and `src/exercises/`.

A domain module may contain types, persistence mapping, pure logic, reactive
state, composables, and Vue components. It must not import from
`src/features/**` or `src/views/**`. Any feature or view may import it.

`src/blocks/<kind>/` therefore owns everything specific to that block kind:

- `types.ts`, `codec.ts`, `meta.ts`, `create.ts` (ADR 002, unchanged)
- the kind's timer composable
- `ui/` — the kind's config fields, configure dialog, and runner view

`src/blocks/ui/` holds cross-kind block UI and its controllers;
`src/blocks/shared/` stays the cross-kind codec support from ADR 002.

`src/exercises/` owns the exercise catalog domain: attribute types and value
tuples, the bundled catalog, equipment/muscle metadata, translated labels,
display helpers, the custom-exercise store, search, exercise icons, and the
shared exercise UI (avatar, picker, filters, list item).

## Boundary against features

A domain module holds one domain. A feature holds one user-facing capability
built on top of domains. When the two would carry the same name, the domain
module wins and absorbs the rest: there is no `src/features/exercises/`,
because everything in it — the exercise form, the progress charts, the image
upload — is the exercise catalog, not a capability layered on it. Features like
workout, benchmarks and habits keep their own components and composables.

## Why

Before this ADR, ADR 002 confined `src/blocks/` to representation logic and
said runtime behaviour "remains in `src/features/`". That was not what the code
did: 26 block-only files lived in `src/components/blocks/`,
`src/components/timers/`, `src/composables/` and `src/lib/` because two
features (workout, timers) share them, so no single feature could own them.
The result was that adding a block kind touched four top-level trees, and both
`src/lib` and `src/composables` — nominally leaf utility layers — depended on
`src/blocks`.

The exercise domain had the same shape without even a partial home: attribute
types in `src/types`, catalog in `src/data`, metadata and label helpers in
`src/lib`, search in `src/composables`, state in `src/stores`, and UI in
`src/components` — six top-level trees for one concept.

Naming a domain module and letting it own its vertical keeps the "one concept,
one directory" property while preserving the rule that actually matters: shared
code never depends on features or views.

## Consequences

- `src/lib` and `src/composables` no longer import `@/blocks`; they are leaf
  layers again.
- `src/types` and `src/data` shrink to genuinely cross-domain content.
- `src/components/` (non-`ui/`) holds only app-shell and cross-domain widgets.
- Adding a block kind is one folder; adding an exercise attribute is one file.
- Domain modules are enforced by the same `import-x/no-restricted-paths` zone
  as the other shared trees, and by ArchUnit isolation and Main Sequence tests.
