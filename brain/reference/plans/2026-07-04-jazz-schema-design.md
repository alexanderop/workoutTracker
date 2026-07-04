# Jazz 2.0 Schema Design — target database structure

> **Parent plan:** `persistence-swap-architecture-plan.html` (§05 Phase 4)
> **Ticket:** `2026-07-04-persistence-swap-ticket.md` (this doc is a prerequisite for the Jazz spike, NOT part of that ticket)
> **Jazz reference source:** cloned monorepo, see "Reference material" in the ticket
> **Status:** Designed, unvalidated — the ⚠️ open questions at the bottom must be answered in the spike

## Design principles

1. **Column vs. payload rule:** a field becomes a real Jazz column **iff** a repository method
   filters or sorts by it (i.e. it is a Dexie index today, or should have been). Everything
   else — above all the block discriminated unions — stays an opaque `s.json()` payload.
   This keeps `converters.ts` and the whole `Db*` document model valid unchanged.
2. **Preserve the document model.** A workout is ONE row with blocks embedded, exactly like
   Dexie today. Blocks are edited as part of a single gym session on a single device, are
   never queried individually, and whole-document writes give clean CRDT merge semantics.
   Normalizing blocks into their own table would buy nothing and break every converter.
3. **Real refs only where the target is a row.** `benchmarkId`, `workoutId`, `progressionId`
   become `s.ref(...)`. `exerciseDefinitionId` does **not** — it can point at a built-in
   catalog exercise that is app code, not a row — it stays a plain string key
   (named `exerciseKey`, deliberately *not* `*Id`, because Jazz enforces that `*Id`/`*_id`
   columns are refs).
4. **Every user-data table carries two invisible columns:**
   - `legacyId: s.string()` — the original Dexie UUID; guarantees migration integrity and
     idempotent re-import. Never shown to the UI.
   - `owner_id: s.string()` — the Jazz session `user_id`. Meaningless while local-only, but
     it is the hook every Jazz permission policy keys on; adding it later means a backfill
     migration. Cheap now, painful later.
5. **Fix the known full-scan by design.** `exerciseProgress` currently scans the whole
   workouts table to build per-exercise history. The Jazz schema gets a derived
   `workoutExercises` index table, written inside the `completeWorkout` transaction.
   (This is the same fix `dexie-improvements.md` Phase 3 proposed for Dexie — here it
   becomes an adapter-internal detail, not a contract change.)
6. **Singletons become slots.** Dexie's fixed-key singleton rows (`'current'`,
   `'current-benchmark'`, `'onboarding'`, draft keys) become one `appState` table with a
   `slot` enum column. One row per slot, enforced by repository-level upsert
   (query-by-slot → update-or-insert), since unique constraints are an open question (Q3).

## Table-by-table mapping

| Dexie table (index def) | Jazz table | Real columns | JSON payload |
|---|---|---|---|
| `customExercises` (`id, name, muscle, equipment, createdAt`) | `exercises` | name, muscle?, equipment?, createdAt, image? (bytes) | exerciseType + metrics config |
| `workouts` (`id, startedAt, completedAt, benchmarkId`) | `workouts` | startedAt, completedAt, benchmarkId → ref | blocks (full `DbWorkoutBlock[]` union) |
| — (new, derived) | `workoutExercises` | workoutId → ref, exerciseKey, completedAt, blockKind | — |
| `templates` (`id, name, createdAt, lastUsedAt`) | `templates` | name, createdAt, lastUsedAt? | blocks (`DbTemplateBlock[]`), tags |
| `benchmarks` (`id, name, createdAt, lastUsedAt`) | `benchmarks` | name, benchmarkType, structureHash, createdAt, lastUsedAt? | rounds (embedded, keeps fractional `orderKey`) |
| `weightEntries` (`id, date, recordedAt`) | `weightEntries` | weightKg, date, recordedAt | — |
| `progressions` (`id, createdAt, lastSessionAt`) | `progressions` | createdAt, lastSessionAt? | config (all remaining `DbProgression` fields) |
| `progressionSessions` (`id, progressionId, completedAt`) | `progressionSessions` | progressionId → ref, completedAt | session payload |
| `settings` (`key`) | `settings` | key | value (per-key typed union, validated by repository) |
| `activeWorkout` + `activeBenchmark` + `onboarding` + `drafts` | `appState` | slot (enum), updatedAt | the full singleton document |

## The schema, concretely

```ts
// src/db/implementations/jazz/schema.ts  (future file — spike phase)
import { schema as s } from "jazz-tools"; // pin @alpha (2.0)

const BLOCK_KINDS = ["strength", "emom", "amrap", "tabata", "fortime", "cardio"] as const;

const APP_STATE_SLOTS = [
  "active-workout",      // DbActiveWorkout        (Dexie id 'current')
  "active-benchmark",    // DbActiveBenchmarkWorkout (Dexie id 'current-benchmark')
  "onboarding",          // DbOnboarding           (Dexie id 'onboarding')
  "draft:benchmark-create", // DbFormDraft
  "draft:template-create",  // DbFormDraft
] as const;

export const jazzSchema = {
  exercises: s.table({
    name: s.string(),
    muscle: s.string().optional(),
    equipment: s.string().optional(),
    createdAt: s.timestamp(),
    image: s.bytes().optional(),        // Dexie Blob → Uint8Array (see Q2)
    definition: s.json(),               // exerciseType + metrics config
    legacyId: s.string(),
    owner_id: s.string(),
  }),

  workouts: s.table({
    startedAt: s.timestamp(),
    completedAt: s.timestamp(),
    benchmarkId: s.ref("benchmarks").optional(),
    blocks: s.json(),                   // DbWorkoutBlock[] — verbatim, converters.ts untouched
    legacyId: s.string(),
    owner_id: s.string(),
  }),

  // Derived read-model for ExerciseProgressRepository — written in the same
  // transaction as the workout row; NEVER read by anything except exerciseProgress.
  workoutExercises: s.table({
    workoutId: s.ref("workouts"),
    exerciseKey: s.string(),            // exerciseDefinitionId: built-in slug OR exercises legacy/row id
    blockKind: s.enum(BLOCK_KINDS),
    completedAt: s.timestamp(),         // denormalized from the workout for indexed sorting
    owner_id: s.string(),
  }),

  templates: s.table({
    name: s.string(),
    createdAt: s.timestamp(),
    lastUsedAt: s.timestamp().optional(),
    blocks: s.json(),                   // DbTemplateBlock[]
    tags: s.json(),                     // string[] (s.array(s.string()) if it proves queryable — Q4)
    legacyId: s.string(),
    owner_id: s.string(),
  }),

  benchmarks: s.table({
    name: s.string(),
    benchmarkType: s.string(),
    structureHash: s.string(),
    createdAt: s.timestamp(),
    lastUsedAt: s.timestamp().optional(),
    rounds: s.json(),                   // embedded rounds incl. fractional orderKey — unchanged
    legacyId: s.string(),
    owner_id: s.string(),
  }),

  weightEntries: s.table({
    weightKg: s.float(),
    date: s.timestamp(),                // day-start ts; ONE entry per day (repository upsert, Q3)
    recordedAt: s.timestamp(),
    legacyId: s.string(),
    owner_id: s.string(),
  }),

  progressions: s.table({
    createdAt: s.timestamp(),
    lastSessionAt: s.timestamp().optional(),
    config: s.json(),                   // remaining DbProgression fields
    legacyId: s.string(),
    owner_id: s.string(),
  }),

  progressionSessions: s.table({
    progressionId: s.ref("progressions"),
    completedAt: s.timestamp(),
    payload: s.json(),
    legacyId: s.string(),
    owner_id: s.string(),
  }),

  settings: s.table({
    key: s.string(),                    // DbUserSetting discriminated-union key
    value: s.json(),                    // repository validates per-key value shape
    owner_id: s.string(),
  }),

  appState: s.table({
    slot: s.enum(APP_STATE_SLOTS),
    payload: s.json(),                  // the full singleton document for that slot
    updatedAt: s.timestamp(),
    owner_id: s.string(),
  }),
};

export const app = s.defineApp(jazzSchema);
```

## How today's hot queries map

| Repository method (contract) | Dexie today | Jazz query |
|---|---|---|
| `workouts.getHistory(limit)` / `observeHistory` | index on `completedAt` | `app.workouts.orderBy("completedAt","desc").limit(n)` |
| `workouts.getByBenchmark(id)` | index on `benchmarkId` | `app.workouts.where({ benchmarkId }).orderBy("completedAt","desc")` |
| calendar range | `startedAt` index | `app.workouts.where({ startedAt: { gte: from, lt: to } })` |
| `exerciseProgress.getHistory(exerciseKey)` | **full table scan** | `app.workoutExercises.where({ exerciseKey }).orderBy("completedAt","desc").limit(n)` then load the referenced workouts |
| `templates.getAll()` sorted | `lastUsedAt`/`createdAt` index | `app.templates.orderBy("lastUsedAt","desc")` |
| `weight.getEntries()` | `date` index | `app.weightEntries.orderBy("date","desc")` |
| `progressions.getSessions(id)` | `progressionId` index | `app.progressionSessions.where({ progressionId }).orderBy("completedAt","desc")` |
| `settings.get(key)` | primary key `key` | `app.settings.where({ key }).limit(1)` |
| `activeWorkout.get()` | primary key `'current'` | `app.appState.where({ slot: { eq: "active-workout" } }).limit(1)` |

All of these run through the driver's `indexed_columns` — every column used in a `where`
or `orderBy` above must be declared indexed (mechanism: Q1).

## Write-path semantics (the intent contracts, per adapter)

| Intent | Jazz implementation |
|---|---|
| `completeWorkout()` | ONE `db.transaction`: insert `workouts` row → insert one `workoutExercises` row per exercise appearing in blocks → delete `appState` slot `active-workout`. |
| `completeBenchmarkWorkout()` | Same, plus `benchmarkId` ref set and `appState` slot `active-benchmark` cleared. |
| `importAll()` | Batched transactions in dependency order (below). On failure: delete everything carrying the import's tag/`legacyId` set — the rollback story replaces ACID. |
| `deleteAll()` | One transaction iterating all tables; `appState` slot `onboarding` optionally preserved. |
| `recordSession()` | One transaction: insert `progressionSessions` row + update parent `lastSessionAt`. |
| `saveWeightEntry()` | Repository upsert: query by `date`, update if exists else insert (Q3). |
| `deleteWorkout()` | One transaction: delete workout row + its `workoutExercises` rows (mirror of the manual progression cascade Dexie does today). |

**Durability tier:** everything defaults to `"local"` — never block a set log on network.
If sync ships, history/settings may confirm at `"edge"` in the background; `appState`
(active workout) stays local-first always.

## Migration order & ID remapping

Old Dexie UUIDs land in `legacyId`; refs are remapped via an in-memory `Map<legacyId, jazzRowId>`:

1. `exercises` (no deps) — build exercise map
2. `benchmarks` (no deps)
3. `templates` (no deps)
4. `progressions` → then `progressionSessions` (remap `progressionId`)
5. `workouts` (remap `benchmarkId`) → **backfill `workoutExercises`** from each workout's blocks
6. `weightEntries`, `settings`
7. `appState` slots (active workout carried over so a mid-migration in-progress workout isn't lost; drafts + onboarding)

`exerciseKey` needs care: if it pointed at a custom exercise's Dexie UUID, remap it to the
new `exercises` row id; if it's a built-in catalog slug, copy verbatim.

Verification before flipping the backend flag: row counts per table match, every ref
resolves, spot-check N random workouts by deep-equal of the `blocks` payload against Dexie.

## Explicit decisions (mini-ADRs)

- **D1 — Blocks stay embedded JSON, not a table.** Whole-workout CRDT merges, zero converter
  churn, and nothing ever queries inside a block. Cost: block fields are not indexable —
  accepted, `workoutExercises` covers the one real need.
- **D2 — One `appState` slot table instead of four singleton tables.** Uniform
  upsert-by-slot logic in one place; repositories still expose fully typed interfaces per
  slot. Cost: payloads are stringly-typed at the storage level — accepted, same as Dexie today.
- **D3 — `exerciseKey` is a string, not a ref.** Built-in exercises are app code, not rows.
  Promoting the built-in catalog into the DB was considered and rejected (seed-data
  versioning pain, no query benefit).
- **D4 — `settings` stays its own key/value table** (not merged into `appState`): it already
  is a key/value store with a typed union, and per-key subscriptions are hot (theme, units).
- **D5 — `owner_id` + `legacyId` on day one.** See principle 4.

## ⚠️ Open questions — MUST be answered in the Phase 4 spike

- **Q1 — Index declaration surface.** The driver schema has `indexed_columns`, but how the
  2.0 DSL exposes it (per-column `.indexed()`? table option?) is unverified. Every query in
  the mapping table depends on this. → Check `packages/jazz-tools/src/dsl.ts` in the clone.
- **Q2 — `s.bytes()` size limits for exercise images.** Are multi-hundred-KB blobs OK in a
  row, or does 2.0 have a FileStream equivalent? Fallback: keep images out of Jazz (OPFS
  file next to the DB, path in the row).
- **Q3 — Unique constraints / upsert.** Is there a native unique index or upsert? If not,
  the repository-level query-then-write upsert for `weightEntries.date` and `appState.slot`
  has a (single-user, negligible) race — and a documented merge rule once sync ships:
  latest `recordedAt`/`updatedAt` wins, duplicates compacted on read.
- **Q4 — `s.array(s.string())` queryability** for template tags (`contains` operator?) —
  else tags stay JSON and tag-filtering happens in memory (fine at template counts).
- **Q5 — Transaction API shape** (`db.transaction` exists in runtime — confirm the public
  surface and whether multi-table batches are atomic per commit).

Answering Q1–Q5 (and updating this doc with the answers) is **task #1 of the Jazz spike**,
before any repository is implemented.
