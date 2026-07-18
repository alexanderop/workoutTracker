---
type: Research
title: Shadcn-vue patterns for the exercise icon library
description: Adapts shadcn-vue registry, source-ownership, composition, and customization patterns to a synchronous offline exercise icon system.
resource: brain/reference/research/2026-07-18-shadcn-vue-patterns-for-exercise-icons.md
tags: [research, shadcn-vue, exercise-icons, registry, components, architecture]
timestamp: 2026-07-18T10:39:00Z
---

## Research: Shadcn-vue patterns for exercise icons

**Date:** 2026-07-18  
**Status:** Complete

## Problem Statement

The planned Bold Pose exercise artwork needs to behave like a small internal UI
library: easy to customize, easy to extend, type-safe, offline, and free from
hundreds of hand-maintained imports or repeated SVG boilerplate. The project
already uses shadcn-vue, so its source-ownership, registry, and component
composition patterns are a natural reference.

The upstream repository was inspected at commit
`b1e9c7ed1e2cfde9e6b1ac6144307966ab9fcf32`.

## Key Findings

### Borrow source ownership, not hidden package abstractions

Shadcn-vue treats installed components as application-owned source. Consumers
can edit them, and the installer does not silently overwrite changed files.
The exercise icon library should follow the same rule:

- Pose components are normal editable Vue/SVG source files.
- Generated registries are clearly marked and are the only files overwritten
  by generation.
- Custom icon replacements live in an explicit override map or consumer-owned
  components.
- No opaque runtime package should hide the artwork.

### Use a narrow validated manifest

Shadcn-vue validates registry items and generates inventories from authored
source. Exercise icons need a smaller domain-specific manifest rather than the
full generic registry schema.

Recommended authored metadata:

```ts
type ExerciseIconManifestEntry = Readonly<{
  key: string
  title: string
  component: string
  aliases: ReadonlyArray<string>
  poseFamily: string
  equipment: ReadonlyArray<string>
  muscles: ReadonlyArray<string>
}>
```

Generation should fail on duplicate keys/aliases, missing component files, and
unmapped built-in exercises. Semantic aliases must remain explicit product
data; they should not be inferred from folder names.

### Separate authored files from generated inventories

Recommended shape:

```text
src/components/exercise-icons/
├── ExerciseIcon.vue
├── manifest.ts
├── icons/
│   ├── BenchPressIcon.vue
│   └── ...
├── generated/
│   ├── iconRegistry.ts
│   └── iconAliases.ts
├── registry.ts
├── types.ts
└── index.ts
```

The manifest and icon components are authored. Registry maps, alias maps, and
literal key unions are generated and committed for deterministic offline
builds. Only the small public barrel is imported by consumers.

### Follow the thin shadcn component contract

The aggregate renderer should expose a small typed API, caller-overridable
classes, and stable data hooks:

```vue
<component
  :is="resolvedIcon"
  data-slot="exercise-icon"
  :data-icon="iconKey"
  :data-size="size"
  :class="cn(exerciseIconVariants({ size, tone }), props.class)"
/>
```

Use `SVGAttributes['class']` for SVG-facing components. Merge the caller class
last with `cn()`. Use CVA only for genuine presentation axes such as size,
tone, or frame treatment—not for exercise identities.

The artwork should use semantic CSS variables/current color so the whole set
can be rethemed without editing each SVG:

```css
--exercise-icon-body: var(--foreground);
--exercise-icon-equipment: var(--primary);
--exercise-icon-support: var(--muted-foreground);
```

### Keep runtime resolution synchronous

Shadcn-vue contains an asynchronous multi-library icon loader, but it can
temporarily render nothing. That conflicts with the app's local-first and
no-spinner principles. The small curated Bold Pose pack should be synchronously
bundled. Do not introduce dynamic import, blank flashes, or network loading.

### Keep domain artwork outside scaffolded UI primitives

`components.json` points shadcn-vue at `src/components/ui`. Exercise artwork is
domain-specific and shared by exercises, workouts, templates, blocks, and
benchmarks. It belongs at `src/components/exercise-icons`, not:

- `src/components/ui`, which may be regenerated and receives special lint
  treatment intended for scaffolded primitives; or
- `src/features/exercises`, which would create forbidden cross-feature imports.

`src/components/ExerciseAvatar.vue` remains the integration seam with this
priority:

```text
uploaded image → explicit/override icon → bundled canonical icon
→ pose-family fallback → initials
```

### Stable keys and aliases should mediate names

Canonical exercise names should not become permanent asset identity. Use stable
keys such as `barbell-bench-press`, with aliases mapping current exercise names
to those keys. Existing records can still resolve by name without a database
migration, while future renames can preserve the artwork through aliases.

## Codebase Patterns

- `src/lib/utils.ts` already provides the shadcn-style `cn()` helper.
- `src/components/ui/button` demonstrates CVA variants, scoped barrels, and
  caller class overrides.
- `src/components/ui/avatar` demonstrates compound exports and the current
  avatar seam used by `ExerciseAvatar.vue`.
- Shared components already use `data-slot` outside scaffolded primitives.
- Architecture rules require feature-neutral shared components to remain under
  shared folders and prohibit cross-feature imports.
- `ExerciseAvatar.vue` already centralizes uploaded images and initials for all
  exercise-consuming surfaces, so most callers need no API changes.

## Recommended Approach

Build the first version as an internal source-owned library, not as a public
shadcn registry yet:

1. Create `src/components/exercise-icons` with one renderer, a narrow manifest,
   authored Bold Pose components, generated lookup files, and a scoped barrel.
2. Keep the public API minimal: `ExerciseIcon`, `getExerciseIcon`,
   `ExerciseIconKey`, and override registration.
3. Generate the registry, aliases, and key union from the manifest.
4. Render synchronously and use semantic CSS variables for body, equipment,
   support, and background treatments.
5. Let `ExerciseAvatar` own avatar sizing and apply
   `uploaded image > bundled icon > initials`.
6. Validate every built-in exercise resolves, every alias is unique, and every
   component file exists.
7. Add a per-app override map so customized SVG components survive registry
   regeneration.
8. Consider a namespaced `@workout-icons` shadcn registry only if this library
   is later distributed to other projects. A core `exercise-icon` item and a
   curated `exercise-icon-pack` item are enough; avoid one dependency per icon.

Avoid copying shadcn-vue's parallel style directories, broad registry metadata,
runtime asynchronous icon loader, AST icon-library transforms, or automatic
semantic inference from the filesystem.

## Implementation Status

The pilot library now follows this structure under
`src/components/exercise-icons`. Ten Bold Pose components cover the initial
barbell, kettlebell, dumbbell, and bodyweight examples. `manifest.ts` is the
authored inventory; `pnpm generate:exercise-icons` validates it and rewrites
only `generated/*`. `ExerciseAvatar.vue` resolves uploaded artwork first, then
the bundled icon aliases, and finally initials, so existing consumers and
stored exercise records require no migration.

When extending the set, add one authored icon component, add one manifest entry
with explicit aliases, run the generator, and commit both the authored and
generated files.

## Sources

- [shadcn-vue repository](https://github.com/unovue/shadcn-vue) - Source inspected at commit `b1e9c7e`.
- [Registry schema](https://github.com/unovue/shadcn-vue/blob/b1e9c7ed1e2cfde9e6b1ac6144307966ab9fcf32/packages/cli/src/registry/schema.ts) - Validated item and registry shapes.
- [Registry builder](https://github.com/unovue/shadcn-vue/blob/b1e9c7ed1e2cfde9e6b1ac6144307966ab9fcf32/packages/cli/src/registry/builder.ts) - Dependency resolution and generated registry behavior.
- [File updater](https://github.com/unovue/shadcn-vue/blob/b1e9c7ed1e2cfde9e6b1ac6144307966ab9fcf32/packages/cli/src/utils/updaters/update-files.ts) - Consumer ownership and overwrite behavior.
- [Button component](https://github.com/unovue/shadcn-vue/blob/b1e9c7ed1e2cfde9e6b1ac6144307966ab9fcf32/apps/v4/registry/new-york-v4/ui/button/Button.vue) - Thin component contract, classes, and data hooks.
- [Button variants](https://github.com/unovue/shadcn-vue/blob/b1e9c7ed1e2cfde9e6b1ac6144307966ab9fcf32/apps/v4/registry/new-york-v4/ui/button/index.ts) - CVA and public variant types.
- [Icon loader](https://github.com/unovue/shadcn-vue/blob/b1e9c7ed1e2cfde9e6b1ac6144307966ab9fcf32/apps/v4/registry/icons/create-icon-loader.ts) - Generated async loader pattern intentionally rejected for this offline UI.
- [shadcn-vue introduction](https://www.shadcn-vue.com/docs/introduction) - Source ownership and customization philosophy.
