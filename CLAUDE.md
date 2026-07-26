# CLAUDE.md

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
pnpm exec vitest run --project=default src/__tests__/<area>  # Scoped run — the local default
pnpm test:unit    # Node `unit` tier — pure logic, no DOM/IndexedDB, ~1.5s
pnpm lint         # oxlint + eslint + markdownlint
pnpm type-check   # vue-tsc --build
pnpm build        # Production build
pnpm knip         # Unused exports
pnpm test         # Whole browser tier — ~5 min; CI's job, not yours
CI=1 pnpm test    # Same, with bail:0 — only when you must count a red tier
```

`pnpm test` runs with `bail: 1` locally, so a **failing** run stops at the first
failure and its "N passed" total is partial. Never report that count as tier
coverage — re-run with `CI=1` to get every failure and the real total. A green
run is complete either way.

### Test scope: run your feature's tests, let CI run the rest

The whole browser tier is ~173 files / ~5 minutes on one machine. CI shards it
four ways and runs the a11y, visual, e2e, coverage, and Lighthouse tiers
alongside it (`.github/workflows/ci.yml`), so a local full run buys a slower
copy of a signal the PR gets anyway. **Locally, run only the tests related to
the feature.**

Every plan carries a `## Test Scope` section naming the exact commands that
cover the change — `grill` and `plan` write it, `implement`, `qa`, and `ship-it`
run it. Scope a run with path filters, which are matched against **test** paths:

```bash
pnpm exec vitest run --project=default src/__tests__/features/workout
pnpm exec vitest run --project=default src/__tests__/browser/timer-audio.spec.ts
pnpm exec vitest run --project=unit src/__tests__/unit/habits
# several filters OR together — one run over a feature and its integration specs
pnpm exec vitest run --project=default src/__tests__/features/weight src/__tests__/integration
```

Specs are **not colocated with source**: they live under `src/__tests__/`,
mirroring the source tree (`src/__tests__/features/`, `db/`, `components/`,
`composables/`, `integration/`, `browser/`, `stores/`, …). Filtering on a source
path like `src/features/workout` matches zero files. That fails loudly — Vitest
exits 1 with "No test files found" — so a wrong scope is visible, never a silent
pass. Do not insert a literal `--` before the path; it can make Vitest run the
entire project.

The scope is "what this change can break", not "the file I edited", and the
filter is on test paths, not source paths — so map from one to the other. A
`src/db/` converter change scopes to `src/__tests__/db` **and** the feature
specs that read through it; a shared composable scopes to its consumers'. Run
the full tier locally only when CI is red in a way you cannot reproduce from the
scope, and say why.

## Git workflow

Never work on `main`. Branch first (`<type>/<slug>`), then **commit once per
acceptance criterion** — the behavior, its tests, nothing else. Per-AC commits
are the resume point when a long run dies, the review unit, and the bisect unit.

Commits: Conventional Commits with scope — `feat(workout): add rest timer`.

The husky `pre-commit` hook is the gate and runs on every commit (~15s):
`lint-staged`, `type-check`, `test:unit`, `knip`. Do not use `--no-verify`. The
browser/integration/e2e tiers are too slow for per-commit — run `pnpm lint:check`
plus the plan's `## Test Scope` commands once before pushing, which is what
`ship-it` does. The full suite runs on the PR in CI.

Working plans in `brain/plans/` are gitignored local scratch. Durable outcomes
belong in `brain/decisions/` and `brain/lessons/`.

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
src/blocks/        # Feature-neutral workout block types and codecs (import via @/blocks)
src/db/            # Dexie schema, converters, repository implementations
src/stores/        # Shared app-wide singleton state
src/composables/   # Shared reactive logic (2+ consumers; single-feature code lives in its feature)
src/views/         # Route-level pages; may compose multiple features
src/components/    # App shell + UI shared across features (same 2+ consumer rule)
src/components/ui/ # shadcn-vue / reka-ui primitives
src/__tests__/     # Vitest + Playwright browser mode
```

## Reading PR Feedback

`gh pr view --comments` silently omits review summaries and line-level review comments. For the complete picture — especially when responding to a review — use `pnpm -s pr:comments`, which fetches issue comments, reviews, and line comments in one chronological, labelled listing.

```bash
pnpm -s pr:comments                    # current branch's PR — resolved threads hidden
pnpm -s pr:comments 151                # by PR number; '#151' and full URLs also work
pnpm -s pr:comments --include-resolved # also show threads already marked resolved

# Machine-readable output for jq pipelines — one object per entry.
# Resolved threads and bot noise (Claude/Vercel status comments, CodeRabbit
# walkthroughs) are filtered out; CodeRabbit line comments are reduced to
# their actionable AI-agent prompt.
pnpm -s pr:comments --json | jq '.[] | select(.user == "coderabbitai[bot]")'
```

The `-s` matters: without it pnpm prints a run banner to stdout that corrupts piped output.

### Responding to review feedback

After addressing (or deliberately skipping) a review finding, reply **in the thread**, not in a top-level PR comment — that's what links your action to the finding and lets CodeRabbit verify the fix on its incremental re-review:

```bash
# Reply to a thread (comment_id = the `commentId` field from pr:comments --json)
gh api -X POST repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies -f body='Fixed in <sha> — <what changed>.'

# For skipped findings, state the reason in the reply instead.
```

Resolve a thread only when the finding is actually addressed. CodeRabbit auto-resolves threads it can verify as fixed after a push; for the rest, resolve via GraphQL `resolveReviewThread` using the thread id from the `reviewThreads` query.

## Project Brain

Start at `brain/index.md` only when a task needs architectural rationale or a
known project-specific gotcha. Implementation details, commands, structure,
and current capabilities belong in the code and tests, not in brain notes.

After a task, add a brain note only for a durable lesson that cannot be encoded
more reliably as a test, type, lint rule, or focused code comment. Keep notes
short and delete them when the code becomes authoritative.
