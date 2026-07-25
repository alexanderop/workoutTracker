# A type-level guarantee needs a pinned call site

A constrained signature only proves something where code actually calls it. If
no real call site exercises the constraint, the guarantee is a claim about the
type system, not a property of the program — and it will read as true in review
while being false in fact.

Ask, for any type-level guarantee: **what would break if it were removed?** If
the answer is "nothing compiles differently", it is not yet enforced.

The DI service union is the worked example. `makeRuntime` recovered the union
correctly, but `Runtime.get` was unconstrained and `useRuntimeContext()` erases
the union by design (ADR 003/004 *Limits*). Every production call site went
through one of those two, so deleting a layer from `src/appLayers.ts`
type-checked clean — while the app would have thrown `Service not found` at
boot. The signature was right and guaranteed nothing.

Two things were needed, and the second is the one that is easy to skip:

1. Constrain the resolution API (`Runtime.get` got the same overload pair as
   `Context.get`).
2. Pin the **real composition root** with a type test —
   `src/__tests__/types/appLayers.test-d.ts` resolves each service against the
   actual `appLayers` array, so removing a layer is a compile error.

Step 1 alone was insufficient because nothing in `src/` resolved that service
from a typed runtime. A type test over a synthetic runtime would have been
insufficient for the same reason: it proves the kernel, not the app.

Corollaries:

- When a guarantee has a deliberately-erased boundary, record where it stops.
  Overclaiming in an ADR is worse than a narrower guarantee honestly scoped,
  because the next author copies the claim.
- Verify a `@ts-expect-error` actually fires by reverting the fix and watching
  it report `TS2578: Unused '@ts-expect-error' directive`. An expect-error that
  never fires is a silently passing test.
