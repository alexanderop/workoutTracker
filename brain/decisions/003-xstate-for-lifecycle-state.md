# ADR 003: XState for lifecycle state

Status: accepted, partially landed. The app boot/resume flow
(`src/features/workout/machines/appInitMachine.ts`) is the first and so far
only machine.

## Decision

XState v5 owns state whose shape is a *lifecycle*: a small set of named states,
async work that belongs to one of them, and terminal states that must stay
terminal. Everything else keeps the existing idioms — `createGlobalState()` for
shared feature stores, discriminated unions for ordinary request/UI state.

Conventions for machines:

- One machine per file under `src/features/<feature>/machines/`.
- Define with `setup({ types, actors, guards, actions }).createMachine(...)` —
  the v5 idiom. `createMachine()` alone loses type inference on named sources.
- Async work is an `invoke`d `fromPromise`, always with `onError`.
- Subscriptions are `fromCallback` actors invoked by the state that needs them,
  so leaving the state unsubscribes.
- Effects bound to Vue scope (the router, per-component composables) stay in
  the composable. The machine owns state; the composable reports outcomes back
  as events.
- Module-lifetime actors are created lazily via `createActor` + `subscribe`,
  not `@xstate/vue`'s `useMachine` — `useMachine` ties the actor to whichever
  component mounted first, which is wrong for app-wide singletons.

## Why

Two bugs in the workout draft lifecycle were each fixed twice, defensively, in
different files: a debounced auto-save resurrecting a completed draft
(`shouldPersist` in `useWorkoutPersistence`) and the resulting phantom draft
being dropped on boot (`useAppInitialization`). Both are the same missing
invariant — *completion is terminal, and terminal states do not auto-save* —
which a union of status strings cannot enforce, because nothing stops a write
from happening in the wrong status.

`useAppInitialization` had the same smell in smaller form: re-entry prevented
by an `if` at the top of the function, and a live query that mutated the status
union from outside, kept safe by a ten-line comment. Both are structural in a
machine — an unhandled event is dropped, and an invoked actor stops when its
state is exited.

## Cost

XState v5 core plus `@xstate/vue` measured **11.6 kB brotli** on the main
bundle (436.95 kB → 448.55 kB); `size-limit` was raised 438 kB → 455 kB to
absorb it. This cost is paid once — further machines are near-free — and it is
not code-splittable, because the boot machine is on the critical startup path
and the budget covers all chunks. Re-measure if XState is ever the only
remaining consumer of that headroom.

## Not adopted for

- **The block timers** (`src/composables/timers/`). They derive elapsed time
  from `Date.now()` deltas specifically because mobile throttles and freezes
  background intervals. XState's `after` is `setTimeout`-based and would
  reintroduce exactly that bug; feeding external ticks into a machine that
  re-derives phase anyway buys nothing.
- **Plain request flows** (e.g. data export/import). A discriminated union is
  sufficient and free.

## Next

The workout session lifecycle (`builder → active → completed`, plus the
completion transaction) is the case that motivated this ADR and is not yet
ported. Doing so should let `shouldPersist` and the completed-draft cleanup on
boot both be deleted rather than kept in sync.
