---
type: Reference
title: "VueUse-Style Composables Plan"
description: VueUse authoring and testing conventions to adopt in this app (library/docs machinery excluded), with a gap analysis of all ~65 composables and a prioritized checklist (July 2026).
resource: brain/reference/plans/vueuse-style-composables.md
tags: [reference, plans, composables, vueuse, testing]
timestamp: 2026-07-06T00:00:00Z
---

## VueUse-Style Composables Plan

Distilled from the VueUse 13.x source (`CONTRIBUTING.md`, `packages/guidelines.md`, `packages/guide/best-practice.md`, `packages/shared/utils/types.ts`, `packages/.test/*`, ~25 implementations and test files), then checked against every composable in `src/composables/` and `src/features/*/composables/`.

**Scope decision (2026-07-04):** VueUse's library-distribution machinery is deliberately excluded — per-composable folders with `index.md`/`demo.vue`, auto-generated barrels, monorepo package split, metadata/docs-site tooling. This is an app, not a library; only the authoring and testing conventions apply. Keep the existing flat file layout and `src/__tests__/` structure.

## The VueUse authoring rules (their own internal guide)

1. Import all Vue APIs from `"vue"`.
2. **Prefer `shallowRef` over `ref`**. When deep reactivity is genuinely needed, alias explicitly: `import { ref as deepRef } from 'vue'` — deep reactivity must be a visible choice.
3. Use `ref` instead of `reactive`.
4. **Options object as the last argument**, always defaulted: `options: UseXOptions = {}`. Interface named `Use<Name>Options`, return type `Use<Name>Return`.
5. **Accept `MaybeRefOrGetter` inputs**, resolve with `toValue()` at the point of use — plain value, ref, and getter all work.
6. **Configurable globals** (`ConfigurableWindow` etc.) for any `window`/`document`/`navigator` access — SSR safety and mockability: `const { window = defaultWindow } = options`.
7. Expose an `isSupported` flag for non-universal Web APIs (via a `useSupported()` helper gated on mount).
8. Expose `immediate`/`flush` whenever a `watch` is used internally.
9. **Clean up with `tryOnScopeDispose`** — side effects die with the owning effect scope; no component instance required, no-ops (instead of throwing) outside a scope.
10. Named exports only; no `console.log`; async composables return a `PromiseLike` (awaitable + destructurable).

## Core patterns worth copying

### Signatures

```ts
export function useIntervalFn(
  cb: Fn,
  interval: MaybeRefOrGetter<number> = 1000,
  options: UseIntervalFnOptions = {},
): UseIntervalFnReturn
```

When the return shape depends on an option, use overloads keyed on a literal type (`controls: true` → `{ timestamp, ...Pausable }`, default → bare ref), not a loose union.

### Inputs

```ts
export function useStorage<T>(key: MaybeRefOrGetter<string>, ...) {
  const keyComputed = computed(() => toValue(key)) // reacts to ref OR getter OR plain value
}
```

### Returns — shared control interfaces (defined once, `packages/shared/utils/types.ts`)

```ts
export interface Pausable {
  readonly isActive: Readonly<ShallowRef<boolean>>
  pause: Fn
  resume: Fn
}
export interface Stoppable<StartFnArgs extends any[] = any[]> {
  readonly isPending: Readonly<Ref<boolean>>
  stop: Fn
  start: (...args: StartFnArgs) => void
}
```

Default return is a destructurable object of refs; exposed state is wrapped `shallowReadonly(...)` before returning (readonly to consumers, mutable internally).

### Cleanup

```ts
export function tryOnScopeDispose(fn: Fn): boolean {
  if (getCurrentScope()) { onScopeDispose(fn); return true }
  return false
}
```

Scope-based, not component-based: works in components, `createGlobalState`, nested composables, and bare `effectScope()` in tests. `useEventListener` registers listeners inside a `watch` (`{ flush: 'post' }`) and uses the watcher's `onCleanup`, so re-bind on target change, unmount, and manual `stop()` share one teardown path.

### Shared-state factories

| Factory | Lifetime | Use when |
|---|---|---|
| `createGlobalState` | Forever (permanent `effectScope(true)`) | App-wide singleton stores (what we already use) |
| `createSharedComposable` | Ref-counted; tears down with last consumer | Expensive shared resources (one listener for N components) |
| `createInjectionState` | Component subtree via provide/inject | State scoped to a view branch |

### Naming (implicit but perfectly consistent across 200 functions)

| Prefix | Meaning |
|---|---|
| `use*` | Returns reactive state (object of refs) — the default |
| `on*` | Fire-and-forget event binding; returns only a `stop` handle |
| `create*` | Higher-order factory returning a composable/primitive |
| `try*` | Defensive lifecycle wrapper — no-ops outside Vue context |
| `watch*` | Drop-in `watch` replacement with one added behavior |

Renames: keep the old name as a `/** @deprecated use X instead */` re-export until call sites are migrated — never two live implementations.

### Testing

- `useSetup()` helper (≈ our `withSetup()`) mounts a throwaway component whose `setup()` is the test body — but only used when lifecycle is genuinely needed; pure-logic composables are called bare.
- Cleanup tested without a mount:

```ts
const scope = effectScope()
await scope.run(async () => { useIntervalFn(callback, 50) })
await scope.stop()
await vi.advanceTimersByTimeAsync(60)
expect(callback).toHaveBeenCalledTimes(0)
```

- Fake timers always paired (`useFakeTimers`/`useRealTimers`), async variant `advanceTimersByTimeAsync`.
- `await vi.waitFor(() => expect(...))` for async-nondeterministic assertions instead of `nextTick` chains.
- Mocks injected **through options** (Map-backed storage mock passed to `useStorage`) instead of monkey-patching globals; SSR branch tested by passing `{ window: undefined }`.
- Real browser (never mocks) for real APIs: `IntersectionObserver`, scrolling, geometry.
- Every suite opens with `it('should be defined')`; plain-English behavior sentences.

Note: we already run Vitest browser mode for everything — ahead of VueUse here. Import the idioms (scope-based cleanup tests, options-injected mocks, paired fake timers), not the jsdom split.

## What we already do right

`createGlobalState` stores with `$reset()`, discriminated-union state, `shallowRef` for large structures, `onScopeDispose` in the persistence layer (`useFormDraft`, `createPersistenceCore`), zero raw `addEventListener` calls, and `timers/useBaseTimer.ts` is genuinely VueUse-grade (readonly refs, explicit `TRANSITIONS` map, options-object config, thorough fake-timer spec).

## Gap analysis

### GAP 1 — `useLiveQuery` uses component lifecycle instead of scope lifecycle (do now)

`src/composables/useLiveQuery.ts` uses `onMounted`/`onUnmounted`, tying it to component instances — it can't run inside `createGlobalState`, another composable's scope, or bare in a test (hence the `withSetup()` harness in its spec).

```ts
// Current
onMounted(() => {
  const query = make()
  query.get().then(v => { data.value = v })
  stop = query.subscribe(v => { data.value = v })
})
onUnmounted(() => stop?.())

// VueUse-style
const query = make()
query.get().then(v => { data.value = v })
const stop = query.subscribe(v => { data.value = v })
tryOnScopeDispose(stop)
```

If mount-deferral matters for a consumer, make it an option (`{ initOnMounted: true }`) like `useStorage` does.

### GAP 2 — `MaybeRefOrGetter` documented as convention, used in 3/65 files (do now)

Only `useAnimatedCounter`, `useBenchmarkSplitComparison`, `useSummaryStats` accept flexible inputs. Id-keyed composables take raw strings and go stale on route-param changes:

```ts
// Current
export function useExerciseProgress(exerciseId: string) {
  onMounted(() => load(exerciseId)) // id changes ⇒ stale view
}

// VueUse-style
export function useExerciseProgress(exerciseId: MaybeRefOrGetter<string>) {
  watch(() => toValue(exerciseId), id => load(id), { immediate: true })
}
```

Apply to `useExerciseProgress`, `useBenchmarkAttemptHistory`, `useWorkoutDetail`, and other id/param-keyed composables. Callers passing plain strings keep working.

### GAP 3 — Two competing list-loading idioms mid-migration (do next)

**Update (2026-07-06):** `useWorkoutsList` and `useWeightEntries` have since been migrated to `useLiveQuery` (via the persistence-swap ticket's Slice 5). `useBenchmarksList` and `useWorkoutCalendar` still hand-roll `onMounted` fetch + manual reload-after-mutation — finish those two. Also fix the drift: `useBenchmarksList` calls the repository **without `tryCatch`** (its previous point of comparison, `useWorkoutsList`, no longer calls the repository directly at all — it reads through `observeAll()`/`useLiveQuery` instead).

### GAP 4 — Shared `Pausable`/`Stoppable` interfaces + readonly returns (do next)

The five timer composables each declare their own control surface. `useBaseTimer` wraps exposed refs in `readonly()`; `useRestTimer` returns a mutable `elapsedSeconds`. Define `Pausable`/`Stoppable` once (e.g. `src/composables/types.ts`), have timers return them, make `readonly()`-before-return the rule.

### GAP 5 — Unguarded browser APIs in `useTheme` / `useLanguage` (later)

`useTheme` touches `document.documentElement`, `useLanguage` reads `navigator.language` directly. No SSR target so it's a test-ergonomics issue, not a crash risk — a light configurable-globals option (`const { navigator = window.navigator } = options`) makes both testable without stubbing globals.

### GAP 6 — `useWorkout` is a 580-line outlier with a dual API surface (later)

~Half of its ~25 returned members are legacy "exercise" aliases for the newer "block" API. Deprecate the aliases with `/** @deprecated */`, migrate call sites, delete. Everything else stays under ~150 lines.

### GAP 7 — One JSDoc description line per composable (later)

Several thin wrappers (`useWorkoutDetail`, `useBenchmarkDetail`, `useExerciseForm`, …) have no JSDoc. One `/** Reactive X for Y */` line each gives humans and agents a free catalog. Full folder-per-composable colocation is **not** worth importing — the integration-test-first philosophy is deliberate and the flat layout works at 65 files.

## Adoption checklist (dependency order)

| # | Action | Touches | Effort |
|---|---|---|---|
| 1 | Rewrite `useLiveQuery` on `tryOnScopeDispose`; subscribe immediately | `useLiveQuery.ts` + spec | Small |
| 2 | Create shared `Pausable`/`Stoppable`/configurable-globals types module | new `src/composables/types.ts` | Small |
| 3 | `MaybeRefOrGetter` + `toValue` + `watch immediate` for id-keyed composables | ~6 data composables | Medium |
| 4 | Migrate remaining list composables to `useLiveQuery` (done: `useWorkoutsList`, `useWeightEntries`; remaining: `useBenchmarksList`, `useWorkoutCalendar`); add missing `tryCatch` in `useBenchmarksList` | 2 list composables | Medium |
| 5 | Timers return `Pausable`; `readonly()` all exposed refs (fix `useRestTimer`) | `timers/*` | Small |
| 6 | Deprecate `useWorkout` legacy aliases with `@deprecated`, then remove | `useWorkout.ts` + call sites | Large |
| 7 | One-line JSDoc description on every composable; fold conventions into `brain/reference/agent/composables.md` | sweep | Small |

## Rule of thumb for every new composable

Options object last (`UseXOptions = {}`) · reactive inputs as `MaybeRefOrGetter` read via `toValue()` · `shallowRef` unless deep is proven (then alias `deepRef`) · return a readonly object of refs implementing shared control interfaces · clean up via `tryOnScopeDispose` · one JSDoc description line · a test that verifies cleanup with a bare `effectScope()`.
