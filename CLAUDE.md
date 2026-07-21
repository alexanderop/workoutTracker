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

## Writing a PR description

Every PR body follows one fixed, QA-oriented contract so a browser QA pass can
run straight from the description without reading the diff. Fill every section,
omit no header. Title is Conventional Commits with scope
(`feat(workout): add rest timer`). Required sections, in order: **Summary**,
**User Impact**, **Acceptance Criteria** (3-5 checkbox "User can ..." bullets),
**QA Scope**, **Risk Areas**, **Manual Test Scenarios** (numbered Given / When /
Then with exact UI labels), **CI Checks** (`pnpm type-check`, `pnpm lint`,
`pnpm test`). Ban vague phrasing like "works correctly" — prefer exact flows,
labels, values, and validation messages.

Generate PRs with the `pr` skill; the authoritative body shape is
`.claude/skills/pr/references/template.md`. Rationale and the full section
checklist live in [`brain/decisions/003-pr-description-format.md`](brain/decisions/003-pr-description-format.md).

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
