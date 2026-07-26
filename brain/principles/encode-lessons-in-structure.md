# Encode lessons in structure, not prose

A lesson written down is a lesson someone has to remember to read. A lesson
encoded in a lint rule, a type, a test, or a script is one nobody can skip.

Before writing a brain note, ask whether the same knowledge could be a check
that fails. If it could, write the check — and then the note only if there is
still rationale worth preserving that the check cannot express.

The ranking, best first:

1. **Make it impossible.** A type that will not compile, a required prop with no
   default. `HabitQuantityControl.scope` is required rather than defaulted
   precisely because a caller forgetting it *is* the bug it prevents.
2. **Make it fail loudly.** A test or lint rule.
   `src/__tests__/architecture/appLayerPins.test.ts` fails when a DI layer is
   registered without a pin, replacing "remember to add a line to
   `appLayers.test-d.ts`" — advice that had already been ignored once.
3. **Make it visible.** A focused code comment at the site where someone would
   otherwise make the mistake. Cheaper than a brain note and read at exactly the
   right moment.
4. **Write it down.** A brain note, for rationale and trade-offs that no check
   can carry — why an option was rejected, what a guarantee deliberately does
   not cover.

Two rules of thumb:

- **Twice is the threshold.** The first violation is a mistake; the second is
  evidence the prose is not working. When a principle in this vault gets
  violated a second time, the fix is a check, not a firmer sentence.
- **Verify the check bites.** Encoding a lesson wrongly is worse than not
  encoding it, because the green check reads as protection. Reintroduce the bug
  and watch the check fail before believing it. A habits a11y case was very
  nearly committed claiming to guard a duplicate-DOM-id bug; restoring the
  collision showed it still passed — axe-core dropped `duplicate-id-active`.
  The comment was corrected to say what the case does not cover, and the real
  guard named.

Related: [[principles/type-guarantees-need-a-pinned-call-site]] is a specific
instance — a signature that constrains nothing at any real call site is prose
wearing a type's clothes.
