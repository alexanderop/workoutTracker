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

- **State**: `createGlobalState()` from VueUse (NOT Pinia). One store per feature, no cross-feature imports.
- **Two-way binding**: `const open = defineModel<boolean>('open')`.
- **UI state**: use discriminated unions when multiple exclusive flags could
  form invalid combinations; ordinary independent toggles may stay booleans
  (see state-machine doc).
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

**IMPORTANT:** Before reading scattered docs, start at `brain/index.md`. The
brain is the agent memory router: it uses OKF-style markdown frontmatter,
domain maps, principles, and lessons to point you to the current canonical
brain references.

**IMPORTANT:** Before starting any task, identify which docs below are relevant and read them first.

**IMPORTANT:** After finishing a task, if you learned something non-obvious and worth keeping (a gotcha, a convention, a cascade you had to discover), update the matching doc — or create a new one if none fits. Treat `brain/reference/` as your persistent knowledge graph: the next session only knows what's written there.

- `brain/reference/VUE_STYLE_GUIDE.md` — state, immutability, `tryCatch()`, no cross-feature imports
- `brain/reference/state-machine-pattern.md` — discriminated unions for exclusive UI state
- `brain/reference/REFACTORING_PATTERNS.md` — long component / thin composable / data store patterns
- `brain/reference/workout-block-model.md` — discriminated-union block kinds, result shapes, cascade for new kinds
- `brain/reference/TIL-adding-fields-to-block-types.md` — cascade checklist when changing block types
- `brain/reference/VUEUSE_OPPORTUNITIES.md` — prefer VueUse over manual listeners/timeouts
- `brain/reference/vitest-browser-mode-plan.md` — Vitest + Playwright projects, setup, headless
- `brain/reference/vitest-browser-troubleshooting.md` — flaky tests, singleton leakage, fake-indexeddb, console filtering
- `brain/reference/shadcn-vue-theming.md` — Tailwind v4 OKLCH tokens, reka-ui (not radix-vue), dark mode via `useTheme()`
- `brain/reference/plans/dexie-improvements.md` — liveQuery, transactions, index hygiene
- `brain/reference/reviews/repo-dexie-review.md` — `shallowRef` for large DB structures, validation
- `brain/reference/tech-debt/duplication-analysis.md` — known duplication hotspots to avoid growing
