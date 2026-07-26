# A fake must not promise more than the real thing

A test double exists to stand in for a dependency. The moment it guarantees
something the real implementation does not, every test written against it can
pass while production is broken — and the failure is invisible, because the
tier that would have caught it is the tier you moved the test out of.

The bias is always in one direction. Nobody writes a fake that is *harsher*
than reality; that fails immediately and gets fixed. Fakes drift toward being
kinder — more deterministic, more forgiving, more ordered — because that is
what makes them easy to write and pleasant to assert against.

Ask, for any fake: **what does this guarantee that the adapter merely happens
to do?** Then either stop asserting on it, or give the real thing the same
guarantee.

The progressions fake (`src/__tests__/fakes/progressionsRepository.ts`) was
audited method-by-method against its Dexie adapter. It matched on every throw,
every default, the delete cascade, and the advancement gate — and diverged in
four places, all in the kind direction:

1. **It never ties on a timestamp.** Its clock is `tick++`; the adapter's is
   `Date.now()`. Rows written back-to-back tie in production and fall through
   to random-UUID order (see [[../lessons/local-data-gotchas]]). A unit spec
   asserted session history *by position*; it passed forever against the fake
   and described an order the adapter does not provide. The matching browser
   spec, running against real Dexie, flaked at ~20%.
2. **Reads are shallow copies.** `availableWeights` stays aliased to stored
   state where Dexie structured-clones. Closed by the type (`ReadonlyArray`),
   not by the fake.
3. **`update` with an `undefined` value keeps the key.** Dexie's `modify`
   *deletes* it.
4. **Ids are sortable.** `progression-1`, `progression-2` versus
   `crypto.randomUUID()` — a test could lean on ordering that does not exist.

Only #1 had actually bitten. The rest are recorded in the fake's own header so
the next author does not lean on them.

Corollaries:

- **Determinism you add to a fake is a claim about production.** A counter
  clock is the right call — it makes ordering provable rather than incidental —
  but it obliges you to assert sets where production returns sets, and
  sequences only where production guarantees sequences.
- **Certify the adapter separately, in the tier that can.** The Node fake proves
  the logic; a browser-tier spec against real IndexedDB proves the adapter
  honours the same contract. Neither substitutes for the other, and the pair
  is what makes moving specs down a tier safe.
- **The contract lives in the port.** When `src/db/interfaces.ts` documents an
  ordering, a `@throws`, or an intent guarantee, both the fake and the adapter
  spec are asserting *that* — not each other. Two hand-written suites mirroring
  one contract is the known weak spot; a shared contract-suite factory invoked
  once per implementation would remove the drift entirely.
