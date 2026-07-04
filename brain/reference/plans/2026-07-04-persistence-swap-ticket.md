# Ticket: Swappable Persistence Layer (Phases 1–3)

> **Parent plan:** `brain/reference/plans/persistence-swap-architecture-plan.html`
> **Status:** Ready for development
> **Audience:** Junior developer — every slice is self-contained, tested, and committed before moving on.

## Context

The app uses Dexie (IndexedDB) behind a repository pattern that is ~70% swap-ready:
all repositories have interfaces in `src/db/interfaces.ts`, Dexie lives only in
`src/db/implementations/dexie/`, and a mock provider exists. This ticket closes the
remaining gaps so the storage engine (Dexie today, Jazz later) can be swapped by
changing **one line at bootstrap**. The Jazz spike itself is **not** part of this ticket.

## Reference material

The **Jazz monorepo source** (`2.0.0-alpha.52`) is shallow-cloned locally for reading:

```
/private/tmp/claude-501/-Users-alexanderopalic-Projects-active-workoutTracker/1b9123e4-2e49-40c7-b222-7ef97a43fdb1/scratchpad/jazz
```

⚠️ That path is a temporary session scratchpad and will not survive a reboot/cleanup.
Re-clone anytime with:

```bash
git clone --depth 1 https://github.com/garden-co/jazz.git /tmp/jazz
```

Most useful entry points inside the clone (for the future Jazz adapter, not this ticket):

- `packages/jazz-tools/src/vue/` — official Vue bindings (`JazzProvider`, `useAll`, `useDb`, `useSession`)
- `examples/todo-client-localfirst-vue/` — complete local-first Vue app (schema, permissions, components)
- `packages/jazz-tools/src/dsl.ts` — schema/column types (`s.table`, `s.ref`, `s.json`, …)
- `packages/jazz-tools/src/where-operators.ts` — query operator surface
- `packages/jazz-tools/src/runtime/db.ts` + `src/drivers/types.ts` — storage config, OPFS/memory drivers

## Goal

After this ticket:

1. The active backend is chosen in exactly one place (`src/main.ts` via `setRepositoryProvider()`).
2. Repositories expose **live queries** (`observe*()`), so the UI updates when data changes underneath it (cross-tab today, sync later).
3. The integration test suite is a **contract suite** — it certifies any adapter, not just Dexie.

## Non-goals

- No Jazz code, no new database, no sync, no data migration.
- No behavior changes visible to the user (except live cross-tab updates, which are a bonus).
- No parallel "clean domain model" — the existing persisted types stay the shared document model.

## Ground rules (apply to EVERY task)

- [ ] Read `brain/reference/VUE_STYLE_GUIDE.md` and `brain/reference/vitest-browser-troubleshooting.md` before starting.
- Work on a feature branch: `git checkout -b feat/swappable-persistence`.
- **Definition of Done for each task** (repeat this ritual every single time):
  1. Code compiles: `pnpm type-check`
  2. Lint passes: `pnpm lint`
  3. All tests green: `pnpm test`
  4. Commit with the exact message given in the task (Conventional Commits, scoped).
- Never skip the commit. One task = one commit. If a task feels too big, ask before splitting.
- If a test fails and you don't understand why, **stop and read the failure** — do not delete or `.skip` tests.

## Acceptance criteria (whole ticket)

- [ ] AC1 — `setRepositoryProvider()` exists; `src/main.ts` is the only production file that constructs an adapter.
- [ ] AC2 — `grep -r "implementations/dexie" src --include="*.ts" --include="*.vue" -l` returns only files inside `src/db/` and `src/main.ts`.
- [ ] AC3 — `exerciseProgress` is a member of `RepositoryProvider`; its special-case singleton and reset function are deleted.
- [ ] AC4 — `generateId()` is defined exactly once.
- [ ] AC5 — Repository interfaces expose `observe*()` methods returning `LiveQuery<T>` for: workouts history, settings, active workout, templates, weight entries.
- [ ] AC6 — Opening the app in two browser tabs and completing a workout in tab A updates the history list in tab B without a reload (manual check, documented in the PR).
- [ ] AC7 — No file in `src/__tests__/` imports the raw `db` instance; all seeding/assertions go through repository-backed helpers.
- [ ] AC8 — The integration suite runs against a provider factory, so a second adapter can be certified by passing the same suite.
- [ ] AC9 — Intent-level consistency guarantees are documented as TSDoc on `completeWorkout`, `importAll`, `deleteAll`, `recordSession`, `deleteProgression`.
- [ ] AC10 — `pnpm type-check && pnpm lint && pnpm test` green on the final branch; no new `knip` findings (`pnpm knip`).

---

## Slice 1 — The swap switch (provider injection)

*Vertical slice: after this, an env var decides the backend, end to end, with a test proving it.*

- [ ] **1.1 Add `setRepositoryProvider()`**
  - File: `src/db/provider.ts`
  - Add:
    ```ts
    export function setRepositoryProvider(p: RepositoryProvider): void {
      provider = p
    }
    ```
    Keep `getRepositoryProvider()` (lazy Dexie default) and `resetRepositoryProvider()` as they are.
  - Test: new unit test `src/__tests__/db/provider.spec.ts` — inject the mock provider from
    `src/__tests__/helpers/mockRepositories.ts` via `setRepositoryProvider()`, assert
    `getWorkoutsRepository()` returns the mock's repo; then `resetRepositoryProvider()` and
    assert the default comes back.
  - ✅ DoD ritual, then commit: `feat(db): add setRepositoryProvider injection seam`

- [ ] **1.2 Select the adapter at bootstrap**
  - File: `src/main.ts`
  - Before the app mounts:
    ```ts
    import { setRepositoryProvider } from '@/db/provider'
    import { createDexieRepositoryProvider } from '@/db/implementations/dexie'

    setRepositoryProvider(createDexieRepositoryProvider())
    ```
    (Reading `import.meta.env.VITE_DATA_BACKEND` comes later when a second adapter exists —
    do NOT add a switch statement for backends that don't exist yet.)
  - Verify in the browser: `pnpm dev`, log a set, check history still works.
  - ✅ DoD ritual, then commit: `feat(app): construct repository provider at bootstrap`

- [ ] **1.3 Route the one bypassing view through the getter**
  - File: `src/views/ActiveBenchmarkWorkout.vue` (lines ~14 and ~108)
  - Replace `import { getRepositoryProvider } from '@/db/provider'` +
    `getRepositoryProvider().benchmarks` with `import { getBenchmarksRepository } from '@/db'` +
    `getBenchmarksRepository()`.
  - Test: the existing benchmark integration tests must stay green — that IS the test.
  - ✅ DoD ritual, then commit: `refactor(benchmarks): use repository getter in ActiveBenchmarkWorkout`

- [ ] **1.4 Deduplicate `generateId()`**
  - It is defined in BOTH `src/db/index.ts:100` and `src/db/implementations/dexie/database.ts:131`.
  - Keep the one in `src/db/index.ts` as the single source; make the Dexie file import it (or delete its copy if unused internally). Check all imports still resolve.
  - ✅ DoD ritual, then commit: `refactor(db): single source for generateId`

---

## Slice 2 — Fold `exerciseProgress` into the provider

*Vertical slice: the last repository outside the seam moves inside it.*

- [ ] **2.1 Extend the provider type**
  - File: `src/db/interfaces.ts` — add `exerciseProgress: ExerciseProgressRepository` to `RepositoryProvider`.
  - File: `src/db/implementations/dexie/index.ts` — construct it in `createDexieRepositoryProvider()` like the other 12.
  - File: `src/__tests__/helpers/mockRepositories.ts` — add the mocked member (copy the pattern of any other repo there).
  - `pnpm type-check` will now list every place that breaks — that's your worklist.

- [ ] **2.2 Delete the special-case singleton**
  - File: `src/db/index.ts:76–83` — reimplement `getExerciseProgressRepository()` as
    `() => getRepositoryProvider().exerciseProgress` (same one-liner style as the other getters).
    Delete `resetExerciseProgressRepository()` and its cache.
  - File: `src/__tests__/helpers/resetDatabase.ts` — remove the call to the deleted reset function.
  - Test: run the full suite; exercise-progress integration tests prove the fold worked.
  - ✅ DoD ritual, then commit: `refactor(db): fold exerciseProgress into RepositoryProvider`

---

## Slice 3 — Reactivity port + first live consumer (recent workouts)

*Vertical slice: interface → Dexie implementation → Vue bridge → one real screen updates live. This is the template every later live conversion copies.*

- [ ] **3.1 Define the `LiveQuery` contract**
  - File: `src/db/interfaces.ts`
    ```ts
    /** A reactive read. `get()` resolves from local storage immediately;
     *  `subscribe()` fires with a fresh snapshot on every change (including
     *  changes from other tabs — and, with a sync backend, other devices). */
    export interface LiveQuery<T> {
      get(): Promise<T>
      subscribe(onChange: (value: T) => void): () => void
    }
    ```
  - Add to `WorkoutsRepository`: `observeHistory(limit?: number): LiveQuery<DbCompletedWorkout[]>`
  - ✅ DoD ritual (type-check will pass — nothing implements it yet? No: the interface change breaks the Dexie impl and mock — implement 3.2/3.3 in the same commit if needed). **Do 3.1 + 3.2 + 3.3 as ONE commit.**

- [ ] **3.2 Implement it in the Dexie adapter**
  - File: `src/db/implementations/dexie/workouts.ts`
  - Use Dexie's own `liveQuery()`:
    ```ts
    import { liveQuery } from 'dexie'

    observeHistory(limit) {
      const run = () => /* same query getHistory() uses */
      return {
        get: () => run(),
        subscribe(onChange) {
          const sub = liveQuery(run).subscribe({ next: onChange })
          return () => sub.unsubscribe()
        },
      }
    }
    ```
  - Also add the member to `mockRepositories.ts` (a `vi.fn()` returning `{ get: vi.fn(), subscribe: vi.fn(() => vi.fn()) }`).

- [ ] **3.3 Write the single Vue bridge**
  - New file: `src/composables/useLiveQuery.ts`
    ```ts
    import { onMounted, onUnmounted, shallowRef } from 'vue'
    import type { LiveQuery } from '@/db'

    export function useLiveQuery<T>(make: () => LiveQuery<T>) {
      const data = shallowRef<T>()
      let stop: (() => void) | undefined
      onMounted(() => {
        const q = make()
        q.get().then(v => { data.value = v })
        stop = q.subscribe(v => { data.value = v })
      })
      onUnmounted(() => stop?.())
      return { data }
    }
    ```
    (`shallowRef` is deliberate — see `brain/reference/reviews/repo-dexie-review.md`.)
  - Test: `src/__tests__/composables/useLiveQuery.spec.ts` using the composable-testing
    helpers (see `brain/reference/` composable testing docs): fake `LiveQuery` object,
    assert initial `get()` snapshot lands in `data`, assert a pushed `subscribe` value
    replaces it, assert unsubscribe is called on unmount.
  - ✅ DoD ritual, then ONE commit for 3.1–3.3: `feat(db): add LiveQuery reactivity port with Dexie liveQuery adapter`

- [ ] **3.4 Convert the first consumer: `useRecentWorkouts`**
  - File: `src/composables/useRecentWorkouts.ts` — replace the `onMounted` → `loadRecent()`
    pattern with `useLiveQuery(() => getWorkoutsRepository().observeHistory(N))`.
    Delete the now-unneeded manual refresh calls at its call sites (search for who calls the reload).
  - Test: existing integration tests for home/history must stay green. Add one assertion if
    coverage is thin: complete a workout, assert the recent list updates **without** an
    explicit reload call.
  - Manual check (document in PR): two tabs open (`pnpm dev`), finish a workout in tab A,
    watch tab B update. This is AC6.
  - ✅ DoD ritual, then commit: `feat(workout): recent workouts list updates live`

---

## Slice 4 — Live settings + active workout

*Vertical slice: the two hottest cross-tab data sets go live, copying the Slice 3 template.*

- [ ] **4.1 `SettingsRepository.observeAll(): LiveQuery<DbUserSetting[]>`**
  - Interface + Dexie impl + mock member (same 3-file pattern as Slice 3).
  - Convert `src/stores/settings.ts` to consume it (careful: it's a `createGlobalState`
    singleton, not a component — subscribe once inside the store, no `onMounted`;
    keep an explicit `stop()` if the store exposes teardown for tests).
  - Test: settings-preferences integration spec stays green; add a case: change a setting,
    assert the store ref updates without calling a manual reload.
  - ✅ DoD ritual, then commit: `feat(settings): settings store reads live`

- [ ] **4.2 `ActiveWorkoutRepository.observe(): LiveQuery<DbActiveWorkout | undefined>`**
  - Same 3-file pattern. Convert the composable/store that loads the active workout
    (find it via `getActiveWorkoutRepository()` usages).
  - Test: timer-workout-logging + workout flow integration specs stay green.
  - ✅ DoD ritual, then commit: `feat(workout): active workout state reads live`

---

## Slice 5 — Live templates + weight

- [ ] **5.1 `TemplatesRepository.observeAll(): LiveQuery<DbWorkoutTemplate[]>`** — convert the
  templates list composable. Existing template specs stay green.
  - ✅ Commit: `feat(templates): template list reads live`
- [ ] **5.2 `WeightRepository.observeEntries(): LiveQuery<DbWeightEntry[]>`** — convert
  `useWeightEntries`. Weight specs stay green.
  - ✅ Commit: `feat(weight): weight entries read live`
- [ ] **5.3 Update the brain**: mark Phase 2 of `brain/reference/plans/dexie-improvements.md`
  as superseded by this ticket (one-line note + link).
  - ✅ Commit: `docs(brain): mark dexie-improvements phase 2 superseded by reactivity port`

---

## Slice 6 — Test debt: repositories instead of raw `db`

*Vertical slice: the test suite stops knowing Dexie exists. Do it in three batches so each commit stays reviewable.*

- [ ] **6.1 Extend the shared helpers**
  - Files: `src/__tests__/helpers/dbAssertions.ts`, `src/__tests__/integration/helpers/benchmarkHelpers.ts`
  - Every seed/assert that tests currently do with raw `db` must have a repository-backed
    helper equivalent (e.g. `seedCompletedWorkout(...)` calling the workouts repository,
    `expectWorkoutCount(n)` reading through it). Add what's missing; don't change tests yet.
  - ✅ Commit: `test(helpers): repository-backed seed and assertion helpers`

- [ ] **6.2 Migrate integration specs, batch 1 (workout + history)**
  - Files: `home-delete-workout`, `history-delete-workout`, `history-edge-cases`,
    `workout-duration-edit`, `workout-calendar`, `workout-detail-copy-markdown`,
    `timer-workout-logging`, `log-past-workout`, `isometric-prefill`, `exercise-prefill` specs.
  - Replace every `import { db } from '@/db'` with helper calls. Behavior of the tests must
    not change — if an assertion can't be expressed through a repository, add the missing
    helper (or repository read method) rather than keeping raw access.
  - ✅ Commit: `test(workout): integration specs use repository helpers, drop raw db`

- [ ] **6.3 Migrate integration specs, batch 2 (templates, benchmarks, data, drafts, settings)**
  - Files: the remaining specs listed in the audit (`template-*`, `data-*`,
    `form-draft-persistence`, `settings-preferences`, `benchmarkHelpers` users,
    `seedExercises.spec.ts`, `seedTemplates.spec.ts`).
  - Exit check: `grep -rl "import { db }" src/__tests__` returns **nothing**.
  - ✅ Commit: `test(db): remove all raw db imports from test suite`

---

## Slice 7 — Contract suite + intent semantics

- [ ] **7.1 Parametrize the suite over a provider factory**
  - New file: `src/__tests__/helpers/providerUnderTest.ts`:
    ```ts
    import { setRepositoryProvider, resetRepositoryProvider } from '@/db/provider'
    import { createDexieRepositoryProvider } from '@/db/implementations/dexie'

    /** The adapter being certified by the integration suite.
     *  A future adapter (e.g. Jazz) is certified by swapping this factory. */
    export function installProviderUnderTest() {
      setRepositoryProvider(createDexieRepositoryProvider())
    }
    ```
  - Wire it into the shared test setup (where `resetDatabase` runs) so every integration
    spec goes through it. Today it still returns Dexie — the point is the single seam.
  - ✅ Commit: `test(db): integration suite runs against injectable provider (contract suite)`

- [ ] **7.2 Document intent guarantees as TSDoc**
  - File: `src/db/interfaces.ts` — on `completeWorkout`, `importAll`, `deleteAll`,
    `recordSession`, `deleteProgression` add TSDoc stating the required guarantee, e.g.:
    ```ts
    /** Atomically moves the active workout into history: after resolution the
     *  history entry exists AND the active workout is cleared — an adapter must
     *  never leave both visible or neither. Idempotent for the same workout id. */
    ```
    (Wording for all five is in §04 Move 4 of the parent plan.)
  - ✅ Commit: `docs(db): document intent-level consistency contracts on repository interfaces`

- [ ] **7.3 Final sweep**
  - Run all AC grep checks from the top of this ticket and tick AC1–AC10.
  - `pnpm knip` — remove anything it flags that this ticket introduced.
  - Update `brain/reference/` if you hit any gotcha worth keeping (per project convention).
  - ✅ Commit: `chore(db): finalize swappable persistence phase 1-3`
  - Open the PR (use `/pr`), include the two-tab live-update note for AC6.

---

## Out of scope / follow-up tickets

- **Jazz spike** (parent plan Phase 4): implement `createJazzRepositoryProvider()` for
  workouts + settings + activeWorkout against `jazz-tools@alpha`, certify with the contract
  suite, measure bundle/cold-start on a phone. Gated on this ticket.
- **`Db*` → `Stored*` rename** (mechanical alias pass, ~40 files) — separate PR, zero logic.
- **Migration + sync enablement** (parent plan Phase 5) — gated on Jazz 2.0 stable.
