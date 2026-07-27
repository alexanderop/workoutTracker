# ADR 003: Effect-style dependency injection

Status: accepted for new feature services, landed as the habits pilot. `Scope`
ships unvalidated — see Limits. ADR 002 is the governing precedent for how much
machinery is acceptable: enough to remove a drift-prone cascade, not a
framework. Partially superseded by
[ADR 004](004-db-in-di.md): the `Not in scope` clause (for `Db` only) and the
250-line budget clause no longer hold.

## Decision

`src/lib/di/` provides plain-TypeScript DI modelled on Effect's vocabulary.
Effect itself is not a dependency and is not added to `package.json`.

- `Tag<S>` names a service and carries its type. `Reference<S>` is a `Tag` that
  additionally carries its own default and is readable from any context.
- `Context` is an immutable tag → implementation map. Its `Services` union sits
  in a contravariant position, so reading an unprovided `Tag` is a compile
  error rather than a runtime surprise.
- `Layer<S>` declares how a service is built. Layers are memoized per
  `makeRuntime` build; `fresh` opts out.
- `Scope` holds finalizers and runs them in reverse registration order on
  dispose. A throwing finalizer does not abort the rest — every finalizer runs
  and failures surface together as an `AggregateError`.

New feature services follow the shape the habits pilot established:

```text
src/features/<f>/services.ts       # Tags only            — Node unit tier safe
src/features/<f>/services.live.ts  # Layers reaching @/db — browser tiers only
```

That split is structural, not stylistic. Importing `@/db` constructs a Dexie
database at import time, which needs an `indexedDB` global the Node `unit` tier
does not have, so a Tag sharing a module with its Live Layer would drag the
whole database into every unit spec that names the service. The rule is
enforced by `src/__tests__/architecture/unitTierImports.test.ts`, which walks
the runtime import graph — imports *and* re-exports, skipping type-only edges —
from every unit spec.

Missing services resolve in three layers, mirroring Effect rather than picking
one policy:

1. **Type level (primary).** An unprovided `Tag` fails to compile.
2. **Defaults.** `Reference` tags carry their own default and are readable from
   any context. Membership is limited to stateless ambient capabilities —
   `Clock` and `IdGen` today. A repository or domain service is never a
   `Reference`.
3. **Runtime backstop.** `unsafeGet` throws `Service not found: ${key}`;
   `getOption` and `getOrElse` are the safe variants.

Pure functions in `lib/` keep taking an explicit `now: number` parameter. Only
the imperative shell resolves `Clock` from a context.

## Not in scope

`Db` stays behind `getRepositoryProvider()`, and the ten `createGlobalState`
stores keep their existing reset lists — CLAUDE.md's `createGlobalState()`
convention for shared feature stores is unchanged. Extending DI to either is a
new decision, not an application of this one. Superseded for `Db` by
[ADR 004](004-db-in-di.md); the `createGlobalState` half still stands.

## Why

The codebase had exactly one deliberate seam (`RepositoryProvider`) and
everything else — time, global state, browser capabilities — was ambient.
Because consumers resolved their own dependencies at point of use, the only way
to control them was to boot the whole app. The suite drifted to 98
full-app-mount specs against 36 unit-level ones, and the composable specs that
did exist reset a real database and monkey-patched the singleton repository to
reach error branches.

DI here is the enabler, not the goal: the point is a tiered test strategy where
edge cases (DST boundaries, midnight rollover, streak arithmetic at archive
boundaries) are reachable at all. Those cases were not previously expressible.

## Limits

- **The compile-time guarantee is partial.** Effect's check is total because
  every resolution goes through `Context`. Services resolved via Vue `inject()`
  inside a component cannot carry the `Services` union, so layer 1 protects
  only code taking an explicit `Context`. It is strongest in the unit tier and
  weakest in components, which fall back to layers 2 and 3.
- **`Scope` is the least-proven primitive.** Habits has nothing to release — no
  `AudioContext`, no wake lock, no interval — so `Scope` ships exercised only by
  trivial finalizers. The one genuine acquire/release pair in the codebase is
  the Dexie connection, which this ADR defers. Do not read the pilot as having
  validated it.
- **The library sits at 248 lines against the 250-line budget** the pilot set as
  its abandon threshold. Growth past that is a signal to re-open this ADR, not
  to raise the number. Superseded: [ADR 004](004-db-in-di.md) moves the budget
  to 280 lines to admit `Db` into DI.
