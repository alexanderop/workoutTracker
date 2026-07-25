# Research Gate

The decision machinery behind grill's research phase: how it decides *whether*
and *what* to research (the cascade), and how it guarantees the interview asks
everything needed and nothing answerable by evidence (the surface taxonomy and
coverage ledger). SKILL.md draws on it at step 3 (the cascade), step 5 (the
ledger written into the research doc), step 8 (interview order and question
shape), and step 16 (the coverage gate); steps 3, 5, and 8 link here directly.
The detail lives here so the steps stay tight. How a question is *presented* —
the view that must accompany it — lives in
[QUESTION-FORMAT.md](./QUESTION-FORMAT.md).

## The three-stage cascade (whether / what to research)

Run all three stages every time. The output is a one-line decision announced to
the user.

**(a) Explicit request wins.** If the ticket or user asks for prior art,
alternatives, "what should we borrow", best practices, official docs, or names a
specific external technology to consult, external research is **required** — the
skip signals below do not apply. Only an explicit opt-out ("no web research",
"skip external research") overrides it; honor it and note it in the plan.
Improvement verbs alone ("improve", "make it better") carry no external signal.

**(b) Implicit signals** (only when no explicit request fired). Lean **in** when:

- the topic is high-risk — security, payments, privacy, migrations, compliance,
  or any external API;
- there are **fewer than three direct local examples** of the exact pattern;
- it is an **adjacent-domain match** — a near neighbour exists but not the exact
  case (the team knows the technology layer but maybe not this domain's
  pitfalls; frame the query at the gap, e.g. "has HTTP clients but not webhook
  receivers").

Lean **out** when a strong, recently-touched local pattern with multiple direct
examples already covers it. An **ADR-worthy** decision (hard to reverse,
surprising, trade-off driven) forces the deeper path regardless.

**(c) Classify the intent** so the dispatch (SKILL.md step 4) routes correctly:

| Intent | Means | Route |
|--------|-------|-------|
| implementation-guidance | approach is settled, need exact shapes/pitfalls | doc-verify the library/API directly |
| landscape | what options even exist | delegate to the `research` skill |
| mixed | discover options, then commit to one | **sequential**: `research` first to shortlist, *then* doc-verify the choice |

## Doc-verification and the deprecation gate

For any library, API, SDK, CLI, or cloud service the plan will touch:

- Never trust training data for signatures, config keys, request/response
  shapes, or versions — it drifts. Fetch Context7 (or the configured doc lookup)
  or current official docs, and record the **source URL + version**.
- **Deprecation/sunset check before any external API enters a contract.** Search
  `"<X> deprecated sunset"` and `"<X> breaking changes migration"`, check the
  docs for a deprecation banner, and record `deprecated: no` or
  `deprecated: <date, migration URL>`. An API that fails the gate cannot enter a
  contract — research its replacement instead.
- If explicitly-requested external research cannot run (no web tools, researcher
  failed), record it in the plan as an assumption or open gap — never present the
  plan as externally grounded when it is not.

## The surface taxonomy (the question set)

Seven surfaces. The same taxonomy scopes the scouts (what they resolve) and
enumerates the question set (what the interview must close). Resolved surfaces
are silent; only open rows become questions. This is the dual guarantee:
completeness *and* nothing over-asked.

1. **Contracts** — interface, data, and API shapes.
2. **Lifecycle & state transitions** — the states a thing moves through.
3. **Failure modes & error/retry behavior** — what happens when things break.
4. **Permission & ownership boundaries** — who may do what, who owns what.
5. **Source-of-truth / conflict resolution** — which source wins on conflict.
6. **Experience quality bar** — for experience-bearing work (UI, dashboards,
   reports): the insight the user must get and how "good" is judged. A mandatory
   row — leave it `open` for experience work and the gate blocks; mark it
   `n/a-derived` with a reason for non-experience work.
7. **External / version facts & deprecation** — doc-verified per the gate above.

**Derive, don't checklist.** A surface that genuinely does not apply is
`n/a-derived` *with a one-line reason* (a CLI feature gets no screen-reader row).
The reason is what keeps the taxonomy from ossifying into a generic concern-list.

## Status values

Each surface in the coverage ledger (written into `<slug>.research.md`) carries
one status:

- **`resolved-by-evidence`** — settled against files, docs, or brain; cite the
  finding. Produces **zero** questions.
- **`open-needs-user`** — needs a human decision; becomes an interview question
  carrying a recommended default.
- **`n/a-derived`** — does not apply here, with a one-line reason.

Those three are the statuses at **research-write time** — the only ones a scout
can assign, since two of them are settled by evidence and the third is the
explicit "evidence cannot settle this". The interview then closes every
`open-needs-user` row into exactly one of two **terminal** statuses, and it is
these that the coverage gate and the plan read:

- **`resolved-by-user`** — the user answered. Records the choice, the
  alternatives that lost, and why.
- **`default-accepted`** — the row closed on silence or "your call" against its
  stated default. Carries the `(default accepted — not explicitly confirmed)`
  tag wherever it lands in the plan.

So the full vocabulary is five statuses: three initial, of which
`open-needs-user` is transitional, and two terminal. `open-needs-user` is the
only status that may not survive to the gate — that is exactly what the gate
checks.

At plan-write time the resolved/default-accepted rows become Decisions or
Contracts — with their grounding citation, the alternatives that lost and why,
and the `(default accepted — not explicitly confirmed)` tag on anything resolved
by silence — defer rows become Open Non-Blocking Notes, and the experience-bar
row becomes an Acceptance criterion. The plan is largely a transcription of the
closed ledger, kept current as each row closes rather than written out at the
end.

## Interview order and question shape

Walk `open-needs-user` rows in priority order: **blast-radius and
irreversibility first**, then the experience bar, then edge cases, then
cosmetics. Present each as a quadruple:

> (the view, the question, why it matters / what breaks if unspecified, your
> recommended default-if-silent)

The **view** is the code shape under discussion, rendered in a code block — one
block per option when you are offering options. It comes first because it is
what the user actually reads. See [QUESTION-FORMAT.md](./QUESTION-FORMAT.md) for
the catalog and the exceptions: a pure product-intent question has no shape to
draw, so it stays a **triple** — *(the question, why it matters, your
recommended default-if-silent)*, the quadruple with the view dropped and nothing
else changed. The default is stated and recorded either way.

**Exactly one question per message.** Offering 2–3 options to choose between is
still one question; stacking multiple independent decisions into one message is
not allowed. If several things feel open, ask only the one that unblocks the
rest. Never ask for a vague "any feedback?".

Silence or "your call" resolves a **non-blocking** row to its stated default
(record it in the plan's `## Open Non-Blocking Notes`). An auto-resolved row is
marked `(default accepted — not explicitly confirmed)` wherever it lands in the
plan, so a guess is never laundered into a recorded decision. The
**Stop-and-Ask** surfaces — product intent or acceptable trade-off, an
owner-required business/legal/security/privacy/rollout call, or a
source-of-truth conflict that changes behavior — must be asked as real questions
even when a default exists.

## The coverage gate

The interview ends only when **no surface is left `open`**: every row is
`resolved-by-evidence`, `resolved-by-user`, `default-accepted`, or `n/a-derived`
with a reason. This is an enumerable check against a table the user already saw
previewed in the Background — not a feel for when the decision tree is "resolved
enough".
