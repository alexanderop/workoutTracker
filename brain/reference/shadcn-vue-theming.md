---
type: Reference
title: "shadcn-vue & Theming"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/shadcn-vue-theming.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## shadcn-vue & Theming

How shadcn-vue (built on **reka-ui**) and Tailwind v4 theming are wired up in this project.

## Stack at a glance

- **Tailwind v4** (CSS-first config, no `tailwind.config.js`) — see `src/style.css`
- **shadcn-vue** style `new-york`, base color `neutral` — see `components.json`
- **reka-ui** — the Vue port of Radix primitives that shadcn-vue components wrap
- **VueUse `useColorMode`** — drives the `dark` class on `<html>`

## CSS variables (the source of truth)

All design tokens live in `src/style.css`. We use **OKLCH**, not HSL or hex.

`src/style.css:80` defines the light theme on `:root`, `src/style.css:126` overrides for `.dark`:

```css
:root {
  --primary: oklch(0.55 0.25 290); /* purple */
  --primary-foreground: oklch(0.985 0 0);
  --background: oklch(1 0 0);
  /* ... */
}
.dark {
  --primary: oklch(0.75 0.2 290);
  /* ... */
}
```

The `@theme inline { ... }` block (`src/style.css:6`) maps these raw vars to Tailwind utility tokens (`--color-primary`, `--color-background`, etc.) so `bg-primary`, `text-foreground`, `border-border` Just Work.

Custom token families beyond shadcn defaults:

- **Status**: `--success`, `--warning` (+ `-foreground`)
- **Muscle groups**: `--muscle-chest`, `--muscle-back`, `--muscle-legs`, ...
- **Sidebar**: full `--sidebar-*` set
- **Sizing/spacing/typography**: `--size-icon-md`, `--size-touch-target`, `--font-size-page-title`, ...

When adding a new semantic color, add the raw var to **both** `:root` and `.dark`, then expose it in `@theme inline` as `--color-<name>: var(--<name>)`. Skipping the `@theme` mapping means `bg-<name>` won't compile.

## Adding a shadcn-vue component

This project uses the CLI, configured via `components.json`:

```bash
pnpm dlx shadcn-vue@latest add <component>
```

It scaffolds into `src/components/ui/<component>/` (one folder per component, with an `index.ts` barrel — see `src/components/ui/dialog/` for the canonical multi-file shape). Aliases come from `components.json`: `@/components/ui`, `@/lib/utils`, icons from **lucide**.

## reka-ui (NOT radix-vue)

Naming gotcha: shadcn-vue moved off `radix-vue` to its fork **`reka-ui`**. Every UI primitive in `src/components/ui/` imports from `reka-ui`:

```ts
// src/components/ui/button/Button.vue
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
```

Look up primitive props at <https://reka-ui.com> — the API mirrors Radix (Vue) but **the package name is `reka-ui`**. Don't `pnpm add radix-vue`; it doesn't exist here.

## `cn()` — class merging

`src/lib/utils.ts` is a 7-line `clsx` + `tailwind-merge` helper:

```ts
export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}
```

Use it whenever a component accepts a `class` prop or you conditionally toggle utilities. `tailwind-merge` resolves conflicts so the _last_ class wins (`cn('p-2', 'p-4')` → `'p-4'`).

```vue
<!-- src/components/ui/button/Button.vue -->
<Primitive :class="cn(buttonVariants({ variant, size }), props.class)" />
```

## Dark mode

Single source: `src/features/settings/composables/useTheme.ts`. It wraps VueUse `useColorMode` and adds/removes `dark` on `document.documentElement`:

```ts
const colorMode = useColorMode({
  attribute: 'class',
  modes: { light: '', dark: 'dark' },
})

watch(
  () => colorMode.value,
  (newMode) => {
    const method = newMode === 'dark' ? 'add' : 'remove'
    document.documentElement.classList[method]('dark')
  },
  { immediate: true },
)
```

Wiring:

- `src/App.vue:15` calls `useTheme()` once at app root so the class is applied before first paint.
- `src/features/settings/components/SettingsAppearanceSection.vue` exposes the toggle: `<Switch v-model="isDark" />` bound to the `isDark` computed from `useTheme()`.
- The dark variant in CSS uses `@custom-variant dark (&:is(.dark *))` (`src/style.css:4`) — Tailwind v4 syntax, not the v3 `darkMode: 'class'` config key.

Persistence is handled by VueUse (`localStorage`), so no custom store is needed.

## Pitfalls

**Don't edit `src/components/ui/*` files in place.** They are scaffolded and may be re-generated. To customize, either:

1. Pass a `class` prop and let `cn()` merge (preferred — see how `Button` accepts `props.class`), or
2. Wrap the primitive in a feature-level component (e.g. `src/features/workout/components/...`) that composes the UI atom.

**Always use `cn()` when forwarding classes.** Plain string concat (`` `${base} ${extra}` ``) won't dedupe, so callers can't override `p-2` with `p-4` — they'll get both, and Tailwind's source order decides the winner unpredictably.

**Add new colors in three places, not one.** Raw var in `:root`, raw var in `.dark`, mapping in `@theme inline`. Forgetting `@theme inline` is the most common cause of "my new `bg-foo` class does nothing".

**Use OKLCH, not hex.** All tokens are OKLCH so derived utilities like `oklch(from var(--success) l c h / 20%)` (see `.status-success-bg` at `src/style.css:185`) work consistently across light/dark.

**`NumberField`'s `aria-label` lands on the wrong element.** `<NumberField aria-label="...">` (the `ui/number-field` root) forwards unrecognized attrs to `NumberFieldRoot`'s own rendered element (a plain wrapper `<div>`), not to the actual `<input role="spinbutton">` several components deep. The result: the accessible name silently doesn't apply, and `getByRole('spinbutton', { name: ... })` finds nothing in tests. `id`, by contrast, _is_ explicitly threaded through reka-ui's `NumberFieldRoot` context down to the input (see `NumberFieldInput.js`'s render function). Give the `NumberField` an `id` and pair it with a `<Label for="...">` (sr-only if it shouldn't be visible) instead of `aria-label` — this is what `WeightEntryForm.vue`'s `weight-input` already does, and what `HabitTodayList.vue`'s per-row quantity `NumberField` had to be fixed to do (discovered via a failing `getByRole('spinbutton', ...)` in `habit-tracking.spec.ts`).
