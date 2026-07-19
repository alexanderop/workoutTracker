# AGENTS.md

## What this is

A local-first **workout tracking app**. Everything in here is optimized around workouts: logging sessions in the gym, building templates, tracking strength/AMRAP/EMOM/Tabata/ForTime/cardio blocks, benchmarks, progressions, rest timers, and bodyweight. Data lives in the browser (Dexie/IndexedDB) — no backend, no accounts. Mobile-first PWA used on-phone mid-workout, so latency, offline, and wake-lock behavior matter more than they would in a normal web app.

When in doubt about a design call, ask: "does this make logging a set faster or slower?"

## Local-first ideals (Ink & Switch) — design tie-breakers

1. No spinners — instant input, never block on network
2. Not trapped on one device — multi-device sync _(future)_
3. Network optional — fully offline
4. Seamless collaboration — CRDT-style _(future)_
5. The Long Now — data readable after the app dies (export, schema stability)
6. Security & privacy by default — on-device; E2E if sync ships
7. Ownership & control — user owns data, no accounts, exportable

## Stack

Vue 3.5+, TypeScript (strict), Vite, Dexie, Vitest (browser mode), shadcn-vue, Tailwind.

## Commands

```bash
pnpm dev          # Dev server
pnpm test         # Vitest (browser mode) — NOT test:unit
pnpm lint         # oxlint + eslint + markdownlint
pnpm type-check   # tsc --noEmit
pnpm build        # Production build
pnpm knip         # Unused exports (occasional)
```

Run `pnpm type-check && pnpm lint && pnpm test` before committing.
Commits: Conventional Commits with scope — `feat(workout): add rest timer`.

## Critical Conventions

- **State**: prefer VueUse `createGlobalState()` for shared feature stores (NOT
  Pinia). Module-scoped refs may hold non-persistent app-wide state. Features
  never import from other features.
- **Two-way binding**: `const open = defineModel<boolean>('open')`.
- **UI state**: use discriminated unions when multiple exclusive flags could
  form invalid combinations; ordinary independent toggles may stay booleans.
- **DB**: all access via `src/db` repositories; schema changes require a converter update for backward compat.

## Structure

```
src/features/      # Feature-owned UI, state, composables, and domain logic
src/blocks/        # Feature-neutral workout block types and codecs
src/db/            # Dexie schema, converters, repository implementations
src/stores/        # Shared app-wide singleton state
src/composables/   # Shared reactive logic
src/views/         # Route-level pages
src/components/ui/ # shadcn-vue / reka-ui primitives
src/__tests__/     # Vitest + Playwright browser mode
```

## Project Brain

Start at `brain/index.md` only when a task needs architectural rationale or a
known project-specific gotcha. Implementation details, commands, structure,
and current capabilities belong in the code and tests, not in brain notes.

After a task, add a brain note only for a durable lesson that cannot be encoded
more reliably as a test, type, lint rule, or focused code comment. Keep notes
short and delete them when the code becomes authoritative.
