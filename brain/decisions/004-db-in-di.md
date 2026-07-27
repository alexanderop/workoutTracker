# ADR 004: Db in DI, and the copyable feature template

Status: accepted. Supersedes ADR 003's `Not in scope` clause, for `Db` only —
the ten `createGlobalState` stores are untouched and CLAUDE.md's
`createGlobalState()` convention for shared feature stores still stands — and
ADR 003's 250-line budget clause, which moves to 280.

## Decision

`Db` enters DI. `src/db/services.ts` declares
`Repositories = Tag<RepositoryProvider>('Repositories')`, tags only, importing
only types from `@/db/interfaces`, so it stays Node unit tier safe.
`src/db/services.live.ts` declares
`RepositoriesLive = scoped(Repositories, () => createDexieRepositoryProvider(), release)`,
browser tiers only. This is the codebase's first genuine acquire/release pair —
ADR 003 named the Dexie connection as exactly the case `Scope` shipped
unvalidated against.

`getRepositoryProvider()` is retained as a deprecated shim, still calling
`createDexieRepositoryProvider()` directly — the same factory `RepositoriesLive`
acquires, so both paths hand out the same kind of instance without the shim
depending on the kernel it is slated to be deleted for. `main.ts` calls
`setRepositoryProvider(runtime.get(Repositories))`, so in the running app the
shim hands out the app runtime's instance. The 92 call sites that still resolve
repositories through `get*Repository()` accessors are explicitly not migrated
here; that migration is the follow-on to this work, not part of it.

### The budget: 250 -> 280 lines

The `wc -l src/lib/di/*.ts` abandon threshold ADR 003 set at 250 moves to 280.
Two changes buy the extra lines: `makeRuntime` now takes an array of layers and
recovers the `Services` union from the element type — so an unprovided service
stays a compile error instead of degrading to a runtime `Service not found`
once a runtime is built from more than one layer — and the new
`src/lib/di/vue.ts` bridge (below). `makeRuntime([layer])` subsumes the
single-layer `makeRuntimeOf`, which is deleted, so the kernel lands at 276. 280
is the new abandon threshold. Growth past it re-opens this ADR, not a raised
number, exactly as ADR 003 stated for 250.

### The copyable template

A second feature converts by producing this shape and nothing outside it:

```text
src/features/<f>/services.ts       # Tags only                      — Node unit tier safe
src/features/<f>/services.live.ts  # the feature's Layer(s)         — browser tiers only
```

- `services.ts` declares the feature's `Tag`s, importing only types.
- `services.live.ts` declares the feature's `Layer`s, resolving their own
  dependencies out of the context rather than reaching into `@/db` directly —
  for example `sync(FooRepo, (ctx) => ctx.unsafeGet(Repositories).foo)`.
- The feature's composable takes `ctx: Context<...>` as a parameter, defaulting
  to `useRuntimeContext<...>()`. Passing an explicit context is what makes the
  composable's spec runnable outside a browser. Only plain `Tag`s belong in that
  union: a `Reference` (`Clock`, `IdGen`) is readable from any context via its
  own default, so listing one would assert a provisioning requirement no layer
  satisfies.
- `src/appLayers.ts` composes the ordered layer array once, for the whole app.
  Both composition roots (`src/main.ts` and
  `src/__tests__/helpers/createTestApp.ts`) build their runtime from it, so the
  ordering contract below is stated in one place rather than re-satisfied per
  root.

The acceptance bar for "bulletproof enough to copy": converting a second
feature touches only that feature's `services.ts`, `services.live.ts`, its
composable's signature, one line in `src/appLayers.ts`, and one line in the
pinned call site `src/__tests__/types/appLayers.test-d.ts`. No edit to
`src/lib/di/`, `src/db/provider.ts`, or either composition root is required.

The pinned call site is the correction the progressions conversion produced.
This section originally said "four edits" and omitted
`src/__tests__/types/appLayers.test-d.ts`, which must gain an
`expectTypeOf(runtime.get(FooRepo)).toEqualTypeOf<FooRepository>()` line per
layer or the layer's absence stops being a compile error — the entire point of
[[../principles/type-guarantees-need-a-pinned-call-site]]. It is not a
violation of the bar (it is none of the three prohibited paths, and the file
exists precisely to grow per layer), but a converter measuring against the old
wording would score five edits against a stated four and think the template had
leaked. Measured on the progressions conversion: exactly those five files, no
edit to `src/lib/di/`, `src/db/provider.ts`, `src/main.ts`, or
`createTestApp.ts`.

### Layer order is positional and load-bearing

`buildAll` gives each layer in the array a snapshot of only the services built
before it. There is no dependency graph and no cycle detection. `appLayers` is
therefore ordered so a dependent layer always follows what it
depends on, for example `[RepositoriesLive, HabitRepoLive, ...]`. Get the order
wrong and the failure is `Service not found` at build time, not silently wrong
behavior — the ordering is a contract enforced by nothing but position, and
every layer array author has to know that.

### `src/lib/di/vue.ts`

`provideRuntime(runtime: Runtime, app: App): void` and
`useRuntimeContext<S>(): Context<S>` live in one new file. `provideRuntime`
takes `app` as a required second parameter because Vue's bare `provide()` only
works inside a component `setup()`, and both composition roots that call it —
`src/main.ts` and `src/__tests__/helpers/createTestApp.ts` — are outside any
component, so the runtime is published at app level with
`app.provide(...)`. Vue's `inject()` cannot carry the `Services` union — ADR
003's *Limits* already named this as the boundary where the compile-time
guarantee gives out — so the assertion that recovers the union happens exactly
once, here, instead of being repeated at every component call site. This file
must not import `@/db`, for the same reason `services.ts` files must not: it
has to stay reachable from specs that construct their context in-line without
constructing Dexie.

### Test tiering

Node unit tier is the default for a new spec. A spec stays in, or moves to, the
browser tier only when it carries a one-line comment naming the browser
capability it genuinely needs. `src/__tests__/db/habits.spec.ts` is the
exemplar: it stays in the browser tier because it certifies the Dexie adapter
against real IndexedDB, which is exactly a capability the Node tier cannot
provide. Gherkin is scoped to Playwright e2e only, via `playwright-bdd`; domain
rules stay ordinary Node specs, not a second Gherkin runner.

## Why

The habits pilot (ADR 003) proved the DI shape on three files but left `Db`
itself, and 92 call sites, behind a global mutable singleton
(`getRepositoryProvider()`). A template built on top of a global singleton is
not a template worth copying — every feature converted that way would carry
the singleton forward. Inverting the provider seam now, while only one feature
depends on it, is cheaper than inverting it once a second and third feature
have copied the old shape. It is also the one change that unblocks the test
tier inversion this pass is chasing: `useHabits` importing `services.live`
transitively constructs Dexie at import time, which is why its spec was stuck
at 318 lines in the browser tier. Once `Db` resolves from an injected context
instead, that composable — and the tier discipline behind it — becomes provable
on a second feature, not just asserted.

## Limits

- **The compile-time guarantee is still partial at the Vue `inject()`
  boundary.** `src/lib/di/vue.ts` re-asserts the `Services` union once, but that
  is a manual assertion, not a proof; `useRuntimeContext()` inside a component
  is exactly as strong, and exactly as limited, as ADR 003's *Limits* already
  described it.
- **92 files still resolve repositories through the deprecated
  `getRepositoryProvider()` shim.** They are not converted by this ADR.
  Migrating them is the explicit follow-on.
- **The arch test that would fail a new, unjustified browser spec was
  considered and not taken this pass.** Tier discipline rests on the one-line
  comment convention above, not on an enforced gate. Revisit once a second
  feature has actually been converted and there is a real second data point.

  *Second data point, from the progressions conversion:* still not taken, and
  now with evidence rather than deferral. Triaging all 16 surviving browser
  specs against the rule, every one could name a genuine capability — reka-ui
  `Select` pointer events, real confirm dialogs, router navigation, the real
  `setInterval` EMOM, or a DOM render assertion including negatives ("Start
  Session is absent"). Zero violations, so a gate built now would police a
  failure mode that has not occurred in two conversions. What the rule *did*
  buy was a forcing function during triage: it moved a 341-line pure property
  spec and three repository-only tests out of the browser tier. The convention
  earns its keep; the enforcement does not yet. Revisit if a third conversion
  produces a browser spec that cannot name its capability.
- **16 `console.error` calls across `src/features` are un-injected side
  effects** and noise in tests written against this template. A `Logger`
  service is a separate decision, not folded into this one.
- **`release` is wired up but not exercised.** As `src/db/services.live.ts`'s
  header comment states, nothing disposes a `RepositoriesLive` runtime, so no
  test drives `release` through `Scope`. The invariant that makes this safe —
  **no test may call `dispose()` on a runtime built from this layer**, because
  `db` is a process-wide module singleton and disposing any such runtime
  closes the database for the whole process — is enforced by nothing but that
  code comment: no test, no type, no lint rule.
- **Whether `RepositoriesLive` should stay `scoped` or become a plain `sync`
  is open, not settled.** A reviewer proposed `sync`, since nothing exercises
  the finalizer; the plan deliberately kept `scoped` as the codebase's first
  acquire/release pair, and revising it now would change a frozen plan
  contract rather than extend it. Revisit once something actually exercises
  `release`.

## Rejected alternatives

- **Respect ADR 003 as written.** Leaves `Db` behind the global singleton, and
  the copyable template would carry that singleton to every feature it is
  copied to — the opposite of "bulletproof enough to copy."
- **Amend ADR 003 in place instead of writing a new ADR.** ADR 003 already says
  that extending DI to `Db` "is a new decision, not an application of this
  one"; amending it in place would erase the record of what the original
  decision deliberately excluded and why, which is the actual value of an ADR
  trail.
- **Big-bang migration of all 92 `get*Repository()` call sites.** Unreviewable
  as a single change, and unrelated to the actual goal of this pass, which is
  making the template bulletproof, not finishing every call site's migration.
- **A lazy dynamic `import()` inside the composable's default parameter,**
  instead of resolving through an injected context. Keeps the dependency on
  `services.live` intact, hides it from the arch test that walks the unit-tier
  import graph, and makes the composable async for no behavioral benefit.
