# AGENTS.md

## What this is

A local-first **workout tracking app**. Everything in here is optimized around workouts: logging sessions in the gym, building templates, tracking strength/AMRAP/EMOM/Tabata/ForTime/cardio blocks, benchmarks, progressions, rest timers, and bodyweight. Data lives in the browser (Dexie/IndexedDB) — no backend, no accounts. Mobile-first PWA used on-phone mid-workout, so latency, offline, and wake-lock behavior matter more than they would in a normal web app.

When in doubt about a design call, ask: "does this make logging a set faster or slower?"

## Local-first ideals (Ink & Switch) — design tie-breakers

1. No spinners — instant input, never block on network
2. Not trapped on one device — multi-device sync *(future)*
3. Network optional — fully offline
4. Seamless collaboration — CRDT-style *(future)*
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

- **State**: `createGlobalState()` from VueUse (NOT Pinia). One store per feature, no cross-feature imports.
- **Two-way binding**: `const open = defineModel<boolean>('open')`.
- **UI state**: discriminated unions over boolean flags (see state-machine doc).
- **DB**: all access via `src/db` repositories; schema changes require a converter update for backward compat.

## Structure

```
src/features/      # workout, exercises, templates, benchmarks, timers,
                   # settings, onboarding, progressions, weight, log-past-workout
src/db/            # Dexie schema, converters, repository implementations
src/stores/        # createGlobalState singletons
src/composables/   # Shared reactive logic
src/views/         # Route-level pages
src/components/ui/ # shadcn-vue / reka-ui primitives
src/__tests__/     # Vitest + Playwright browser mode
```

## Further Reading

**IMPORTANT:** Before starting any task, identify which docs below are relevant and read them first.

**IMPORTANT:** After finishing a task, if you learned something non-obvious and worth keeping (a gotcha, a convention, a cascade you had to discover), update the matching doc — or create a new one if none fits. Treat `docs/` as your persistent knowledge graph: the next session only knows what's written there.

- `docs/VUE_STYLE_GUIDE.md` — state, immutability, `tryCatch()`, no cross-feature imports
- `docs/state-machine-pattern.md` — discriminated unions for exclusive UI state
- `docs/REFACTORING_PATTERNS.md` — long component / thin composable / data store patterns
- `docs/workout-block-model.md` — discriminated-union block kinds, result shapes, cascade for new kinds
- `docs/TIL-adding-fields-to-block-types.md` — cascade checklist when changing block types
- `docs/VUEUSE_OPPORTUNITIES.md` — prefer VueUse over manual listeners/timeouts
- `docs/vitest-browser-mode-plan.md` — Vitest + Playwright projects, setup, headless
- `docs/vitest-browser-troubleshooting.md` — flaky tests, singleton leakage, fake-indexeddb, console filtering
- `docs/shadcn-vue-theming.md` — Tailwind v4 OKLCH tokens, reka-ui (not radix-vue), dark mode via `useTheme()`
- `docs/plans/dexie-improvements.md` — liveQuery, transactions, index hygiene
- `docs/reviews/repo-dexie-review.md` — `shallowRef` for large DB structures, validation
- `docs/tech-debt/duplication-analysis.md` — known duplication hotspots to avoid growing
