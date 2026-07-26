---
name: grill
description: Use when the user says "grill me", asks to stress-test a plan, wants to be interviewed or asked the questions needed before building, offers a vague feature idea, or wants grounded planning before non-trivial implementation
---

# Grill

Grill turns unclear intent into an implementation-ready plan. It researches
first — grounding itself in the code, docs, and brain and writing a research doc
*before* engaging the user — then interviews only on what that research could not
resolve. The core principle is: ask only questions the repo, docs, glossary,
ADRs, or fetched primary sources cannot answer. A well-grounded grill may ask
very few questions, or none; that is the goal, not a shortcut. Research is
scoped to a fixed surface taxonomy and recorded in a coverage ledger; the
ledger's open rows *are* the question list, so completeness is an enumerable
check rather than a matter of when the interviewer runs out of ideas. See
[RESEARCH-GATE.md](./RESEARCH-GATE.md).

The plan is built **live**: the file exists before the first question and is
re-worked after every answer, so the user steers while there is still something
to steer. Questions carry a *view* — the code shape under discussion, one block
per option — not prose describing one; see
[QUESTION-FORMAT.md](./QUESTION-FORMAT.md).

## When to Use

Use this skill when:

- The user says `grill me`, `stress-test this plan`, or asks for a planning
  interview.
- The user proposes a non-trivial implementation and shared understanding is
  not yet strong enough to code.
- A feature idea, migration, architecture change, domain model, or integration
  has unresolved product intent, trade-offs, boundaries, contracts, or source
  of truth.

Do not use this skill for tiny mechanical edits, direct bug fixes with an
obvious cause, or execution of an already-written plan (`brain/plans/`).

## Process

1. Ground yourself before asking the first question. If the user already
   supplied a ticket, issue, spec, or written idea, read it fully first — it is
   the seed for what to research, not a substitute for researching. Then read the
   relevant code,
   tests, configs, routes, schemas, package manifests, README instructions,
   and any nearby plans or specs. If `brain/codebase/` already maps the area
   you are touching, read that map first and scope your own reading to the gaps
   it leaves — do not re-discover what it already documents. Each map records the
   commit it was mapped at; if `git rev-parse --short HEAD` has moved past that
   and touched the mapped paths, treat the map as history and verify against the
   current files.
2. Read the domain context and project memory from the brain vault. The
   SessionStart hook injects `brain/index.md`; from it read `brain/context.md`
   (the domain glossary), the relevant notes in `brain/decisions/` (ADRs), and
   `brain/principles.md` plus each principle file it links. Ground your
   questions and the plan in those, and do not ask the user to restate anything
   the brain already records. A fresh project may have an empty or missing
   vault — that is fine; do not invent content. When a brain note conflicts with
   what the current code shows, flag the conflict and cite the note's date; never
   let stale memory override present evidence.
3. Decide whether external research adds value, and what kind — run the
   three-stage cascade every time (full detail in
   [RESEARCH-GATE.md](./RESEARCH-GATE.md)). (a) An explicit request wins: if the
   ticket or user asks for prior art, alternatives, best practices, official
   docs, or names an external technology, external research is required; only an
   explicit opt-out overrides it. (b) Otherwise weigh implicit signals — lean in
   on high-risk topics (security, payments, privacy, migrations, compliance,
   external APIs), when there are fewer than three direct local examples, or on
   an adjacent-domain match (a near neighbour exists but not the exact case);
   lean out when a strong, recently-touched local pattern already covers it. An
   ADR-worthy decision forces the deeper path. (c) Classify the intent so step 4
   routes it: implementation-guidance (approach settled → doc-verify), landscape
   (what options exist → delegate to `research`), or mixed (landscape first
   to shortlist, then doc-verify the choice — sequential). Doc-verification is a
   hard prerequisite for any library, API, SDK, CLI, or cloud service the plan
   will touch: never trust training data for signatures, config keys, or
   versions — fetch Context7 or current official docs, record the URL and
   version, and run the deprecation/sunset check before any external API enters a
   contract. Announce the decision in one line.
4. Whenever step 3 found research adds value, print the scout brief and then
   dispatch. **Before dispatching, show the user what each scout will
   investigate and where** — one line per scout against the seven surfaces
   ("codebase scout: how rest-timer state persists across reload today, in
   `src/features/rest-timer/` and `src/db/`"), and accept redirection. This is
   the cheapest checkpoint in the whole skill: "you're looking at the wrong
   module" costs one sentence here and a full re-research later. Then dispatch
   bounded read-only subagents in parallel; scale depth to the step-3 signals (a
   throwaway gets the codebase scout only; a payments or migration decision gets
   the full set plus landscape delegation). **Brief scouts non-normatively** —
   ask how the code works today, never how it should change: "how does rest-timer
   state persist across reload" and never "how would we add X". A scout that
   knows the intended change finds evidence for it, and the research doc has to
   stay true for the next three tasks, not just this one. Scouts report findings
   only — never recommendations; prescription is the plan's job.
   - Codebase scout: inspect entrypoints, neighboring files, tests, schemas,
     configs, and existing patterns. Report file paths, current behavior,
     contradictions, untested surfaces, open questions, and the
     three-examples / adjacent-domain verdict from step 3.
   - External research: for landscape or mixed intent, the grill lead calls the
     `research` skill (it forks its own context — never nest it inside a
     scout). For implementation-guidance, doc-verify the specific library, API,
     SDK, or CLI per step 3. Report source URLs, versions, exact API shapes,
     deprecation status, and risks.
   - Domain scout, when useful: read `brain/context.md` and `brain/decisions/`.
     Report glossary conflicts, prior decisions, and terms needing precision.
5. Synthesize the research yourself and write the research doc as your first
   artifact, before you engage the user with a Background or any question. Verify
   important claims against files or fetched sources first — a subagent report is
   not truth, and an absence claim ("there is no X") must be checked against the
   repo before it is recorded. The trigger is positive, not discretionary: if any
   scout ran or any external fact was fetched, you write
   `brain/plans/<slug>.research.md` using [RESEARCH-FORMAT.md](./RESEARCH-FORMAT.md)
   — what the codebase and sources ARE today, citation-heavy, no recommendations,
   opening with a one-line research-value rating (high/moderate/low) and closing
   with the Coverage ledger (the fixed surface taxonomy in
   [RESEARCH-GATE.md](./RESEARCH-GATE.md), each
   surface marked resolved-by-evidence, open-needs-user, or n/a-derived). It is
   the companion to the plan and the reusable input every later phase
   (`implement`, `qa`) reads instead of re-discovering. Skip the doc only
   when no scout ran and no external fact was fetched (a genuinely trivial plan).
6. Open with a Background written like a product owner, after the research doc
   exists and before any question. In a few sentences, restate what the user is
   asking for as a product owner framing the work: the problem, who it is for,
   the outcome they want, and the scope as you currently understand it from the
   request, the ticket, and your research. Ground it in what you found — do not
   invent requirements. Then preview the ledger: list the surfaces research
   already resolved (so the user sees what you will *not* ask about) and how many
   open rows remain ("3 decisions need you; here's the first"), and state your
   read of the intent, inviting correction. This gives the user something
   concrete to react to instead of a cold first question.
7. Create the plan file now, before the first question. Write
   `brain/plans/<slug>.md` as a deliberately empty skeleton — the section
   headings from Output, the Research link, and the step-6 Background written
   into `## Context` (the template has no `## Background`; the Background is how
   you *say* it, `## Context` is where it *lives*) — and tell the user where it
   is. No preamble, no setup, no summaries: the faster
   you reach the first question, the more the user stays engaged. The plan is
   built live from here on, so the user steers while there is still something to
   steer.
8. Now interview the ledger's open-needs-user rows, in priority order
   (blast-radius and irreversibility first, then the experience bar, then edge
   cases, then cosmetics). **Exactly one question per message** — offering 2–3
   options to choose between is still one question, stacking independent
   decisions is not. Ask the one that unblocks the rest, and never ask for a
   vague "any feedback?" (full rule in
   [RESEARCH-GATE.md](./RESEARCH-GATE.md)). Present each question as the
   quadruple — *(the view, the question, why it matters / what breaks, your
   recommended default-if-silent)* — per
   [QUESTION-FORMAT.md](./QUESTION-FORMAT.md): if the decision is about a code
   shape, draw the shape, and give every option its own code block. Silence or
   "your call" resolves a non-blocking row to its stated default — except the
   Stop-and-Ask surfaces below, which must be asked as real questions even when a
   default exists. If research already closed every row, say so and go straight
   to the plan — do not manufacture questions.
9. Re-work the plan after every single answer. Rewrite the affected section so
   the document is a coherent design as of right now — never a Q&A log, never an
   append-only transcript. **Rewriting entire sections as you go is expected, not
   exceptional.** This is what catches the real failure mode: an answer at
   question 9 that invalidates the framing from question 2 gets folded in
   immediately instead of silently contradicting it. Show the user what changed
   when a rewrite is structural.
10. Challenge glossary conflicts immediately. If the user uses a term
    differently from `brain/context.md`, say what the glossary says and ask which
    meaning is authoritative.
11. Sharpen fuzzy or overloaded language. Propose canonical terms when concepts
    such as `account`, `user`, `customer`, `order`, or `cancellation` may mean
    different things.
12. Stress-test decisions with concrete scenarios, edge cases, failure modes,
    permission boundaries, lifecycle states, and cross-system contracts.
    For experience-bearing work — UI, dashboards, reports, anything whose value
    is what the user *understands or can do* — also grill the quality bar, not
    just the data: which insight or outcome the user must get, what must be
    visible at a glance, and how "good" will be judged (legibility,
    scannability). Treat that bar as a contract, not taste — without it,
    implementation ships something that runs but does not deliver, and QA has no
    bar to fail it against.
13. Cross-reference user claims against code and fetched sources. Surface
    contradictions explicitly and ask which source should win. When an answer
    surfaces a new what-is fact, append it to the research doc before the plan
    cites it — research is ground truth, not a write-once snapshot.
14. Update `brain/context.md` immediately when a glossary term is resolved. Use
    it only as a glossary: no implementation details, specs, scratch notes, or
    plan content. If creating it, use [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).
15. Offer an ADR only when the decision is hard to reverse, surprising without
    context, and the result of a real trade-off. If creating one, use
    [ADR-FORMAT.md](./ADR-FORMAT.md).
16. Continue until the coverage ledger closes — the gate in
    [RESEARCH-GATE.md](./RESEARCH-GATE.md): every surface is
    resolved-by-evidence, resolved-by-user, default-accepted, or n/a-derived
    (with a one-line reason) — none left open, since `open-needs-user` is the one
    transitional status and closing it is the whole point. This is an enumerable
    check, not a feel; contracts clear, ambiguous terms defined, key edge cases answered, and
    source-of-truth conflicts settled all fall out of it.
17. If during the interview the user pointed you at a reference repo they cloned
    locally ("do it like that repo", "see the pattern in Y"), read it and record
    it in the plan: its origin (GitHub URL or name) and its local path, so
    implementation reads the real source instead of a remembered pattern.
18. Stop at the coherence gate before anything downstream is written. The ledger
    proves every *surface* was covered; it cannot prove the resulting document
    hangs together, and decision-by-decision construction reliably produces
    locally-correct, globally-incoherent docs. Only a top-to-bottom human read
    catches that, and it has to be asked for explicitly:

    > I think the Decisions and Contracts are complete. Since we've been building
    > them up decision by decision, can you read those two sections top to bottom
    > and confirm they hang together before I write the tasks and waves?

    Do not write the Tasks section without sign-off. This is cheap — nothing
    downstream exists yet.
19. Present the wave breakdown as its own reviewable beat, before filling in any
    implementation detail: slice names, the files each owns, and its
    dependencies — nothing more. Get agreement on the phasing, then fill in the
    rest. Re-phasing a signature-level outline is free; re-phasing a plan full of
    written-out detail means throwing work away, so nobody does it and the bad
    phasing ships.
20. Decide the test scope and write it into the plan as `## Test Scope`. Name the
    exact scoped commands that cover this change — paths, directories, or
    projects, never the bare full tier — so `implement`, `qa`, and `ship-it` run
    the feature's tests instead of re-deriving a scope or falling back to the
    whole suite. The whole browser tier is ~5 minutes locally; CI shards it four
    ways and runs a11y, visual, e2e, and coverage alongside it, so the full
    suite is the PR's job, not the loop's. Derive the scope from what the change
    can break, not from the files it edits: a `src/db/` converter or a shared
    composable pulls in its consumers' specs. Specs live under `src/__tests__/`,
    not beside their source, so map source paths to test paths when you write
    the commands — a filter on `src/features/x` matches nothing. A cross-cutting
    change may honestly scope to the whole tier — if it does, say so and say
    why. The codebase scout's map of neighboring tests is the input; if you
    never identified which specs cover the area, that is an open ledger row, not
    a detail to leave to implementation.
21. Finish the plan at `brain/plans/<slug>.md` — a final consistency pass over
    the document you have been building since step 7, not the first write — and
    add a wikilink to it in `brain/plans/index.md`, creating the vault if it does
    not exist yet. (Do not edit `brain/index.md` — the auto-index hook maintains
    it.) Read it top to bottom yourself and reconcile anything a later answer
    left stale. If you wrote a research doc in step 5, link it from the plan's
    `## Research` line so the plan stays the single entrypoint. Every decision or
    contract that rests on a finding must cite it (`[[<slug>.research#<finding>]]`)
    so the plan's prescription is traceable back to the descriptive evidence; a
    choice made in the interview with no finding behind it carries an explicit
    `(no research — chosen in interview)` tag instead. Every decision that had a
    real alternative records what lost and why (`rejected: <option> (<why>)`) —
    the cheapest possible defence against re-litigation six weeks later. A row
    that closed on silence rather than an explicit answer is marked
    `(default accepted — not explicitly confirmed)` so a guess is never laundered
    into a recorded decision. Keep the finding in research, the choice in the
    plan, never duplicate the prose. Include decisions made, contracts between
    parts, relevant glossary or ADR updates, an explicit `## Acceptance` bar for
    experience-bearing work (the user-visible quality criteria, so `implement`
    has a target and `qa` has a bar), and the implementation task list grouped
    into parallel waves (see Output). Decide the schedule here so `implement`
    does not have to re-derive it: mark which slices are independent (disjoint
    files, no shared contract) so they run concurrently, and which depend on
    earlier slices; give every slice the files it owns and what it depends on.
    Every contract that depends on a library, SDK, or API must cite the source
    URL and version it was doc-verified against (per step 3). Carry the step-20
    `## Test Scope` into this pass too, and point every verification checkbox at
    one of its entries.

## Stop and Ask

STOP and ask the user when:

- Product intent, priority, or acceptable trade-off cannot be inferred from the
  repo, glossary, ADRs, or docs.
- Multiple sources of truth conflict and choosing one would change behavior.
- A required external source, credential, account, environment, or proprietary
  document is unavailable.
- Continuing would require making a business, legal, security, data retention,
  privacy, or rollout decision without an owner.

Do not ask the user about facts that can be discovered by reading the repo or
fetched primary sources.

## Red Flags

| Thought | Reality |
|---------|---------|
| "I can ask the user how the code works." | Read the code first and ask only when the code conflicts with intent or another source. |
| "Let me start interviewing to understand the task." | Research first and write the research doc; the interview opens only after, and only on what research and the ticket left unresolved. |
| "There's a ticket, so I can skip research and just clarify it." | A ticket is the seed for research, not a replacement. Research it, then ask only what stays unclear. |
| "The plan is mostly obvious." | Non-trivial work needs explicit contracts, edge cases, and source-of-truth decisions before implementation. |
| "The data contracts are nailed, so the plan is ready." | For experience-bearing work, contracts aren't the bar. Name the user-visible quality bar (the insight, what's legible at a glance) as `## Acceptance`, or implement ships something that runs but doesn't deliver. |
| "I'll batch glossary updates at the end." | Update `brain/context.md` when the term is resolved so later questions use the canonical meaning. |
| "This decision feels important, so it needs an ADR." | ADRs are only for decisions that are hard to reverse, surprising without context, and trade-off driven. |
| "A subagent report is enough." | The lead must synthesize and verify important claims before asking or planning. |
| "I know this library/API well enough to write the contract." | Training data drifts. Fetch the current docs and verify every API name, parameter, and version before it goes in the plan (per step 3). |
| "The interview feels done." | It's done when every coverage-ledger surface is non-open with a recorded status, not when you run out of questions. |
| "This work is small, so skip the research doc." | Write whenever any scout ran or any external fact was fetched. Skip only when neither happened. |
| "I'll describe the two options in a sentence." | If it's a code shape, draw it. Each option gets its own code block — see [QUESTION-FORMAT.md](./QUESTION-FORMAT.md). |
| "I'll write the plan once the interview is done." | The plan file exists before question 1 and is re-worked after every answer. A plan first read after 12 answers is a plan accepted out of sunk cost. |
| "The answers are all recorded, so the plan is current." | Appending answers produces a Q&A log. Rewrite the affected section so the document is a coherent design as of right now. |
| "The ledger closed, so the document is coherent." | The ledger proves coverage, not coherence. Ask for the top-to-bottom read of Decisions and Contracts before writing tasks. |
| "The decision is recorded, that's enough." | Record what lost and why too, or the same argument gets re-litigated in six weeks with no answer in the plan. |
| "`pnpm test` covers it, so the verification boxes are fine." | The full tier is ~5 minutes and CI already shards it. Name the scoped commands in `## Test Scope` and point every box at one. |
| "Implementation can work out which tests to run." | Then it runs everything or nothing. You did the codebase research; the scope is yours to record. |

## Output

**Document precedence:** `plan > research > brain notes > ticket`. The
**highest-precedence** document wins — not the most recently written one. A
brain note added yesterday does not override a plan decision made last week;
recency settles only conflicts *within* one level, where a later revision of the
plan supersedes an earlier one. The plan is the final authority: a decision
settled there is not re-opened by a stale brain note or by what the ticket
originally asked for, and later phases (`implement`, `qa`) read the plan first
and treat the rest as supporting evidence.

The plan file (`brain/plans/<slug>.md`) is created as an empty skeleton at step 7
and built up live through the interview. Its finished shape:

```markdown
# <Plan Title>

## Research
- [[<slug>.research]] — descriptive findings the scouts produced (omit if none written)

## Context
- <What is being changed and why>
- <Relevant code, glossary, ADR, or external source constraints>
- <Reference repos the user cloned to copy a pattern: origin (GitHub URL) and local path>

## Decisions
- <Resolved decision and rationale> — grounds: [[<slug>.research#<finding>]] (or `(no research — chosen in interview)`) — rejected: <option> (<why it lost>)
- <Decision that closed on silence> — grounds: [[…]] — rejected: <option> (<why>) — (default accepted — not explicitly confirmed)

<`rejected:` is omitted only when there was genuinely no alternative on the
table. The `(default accepted …)` tag is mandatory for any row resolved by
silence rather than an explicit answer.>

## Contracts
- <Interface, data, lifecycle, permission, or ownership contract> — grounds: [[<slug>.research#<finding>]] (or `(no research — chosen in interview)`)

## Acceptance
<For experience-bearing work (UI, dashboards, reports). The user-visible quality
bar — what "good" means, not just that it runs. Each criterion must be
verifiable by QA.>
- <The insight or outcome the user must get, and what makes it good — e.g. the
  90-day trend is legible at a glance, axis scaled to the data range not fixed
  to zero, the key comparison visible without interaction, same insight on mobile>

## Test Scope

The scoped commands that cover this change. Every later phase runs these, not
the full tier — CI runs the full tier on the PR. State the reach, so a reader
can tell whether the scope is right. Filters match **test** paths under
`src/__tests__/`, not source paths; a filter matching nothing exits 1, so a
wrong scope fails loudly rather than passing empty.

**Commands** — the *entries*. Each is one complete, runnable command in
backticks. These, and only these, are what downstream phases execute and turn
into verification boxes.

- `pnpm exec vitest run --project=default src/__tests__/features/<feature>` — <what this covers>
- `pnpm exec vitest run --project=unit src/__tests__/unit/<area>` — <what this covers>

**Notes** — context for the reader. Never executed, never a verification box.

- Widen to: <specs outside the feature this change can break, and why> (or "nothing else — the change is contained")
- Full tier locally: not run — CI shards `default` four ways and runs a11y,
  visual, e2e, and coverage on the PR.

<The split is load-bearing: downstream skills emit one box per **Commands**
entry, so a prose bullet living among them becomes an unrunnable checkbox that
strands the plan at a box nobody can tick. If a note ever needs to be enforced,
promote it to a real command under **Commands**.>

## Open Non-Blocking Notes
- <Known follow-up that does not block implementation>

## Tasks

Group implementation into waves so the orchestrator can delegate the schedule
without re-deriving it. Slices in one wave touch disjoint files and share no
contract, so they run in parallel; each later wave depends on earlier ones. For
every slice, give the files it **owns** and what it **depends on**.

Each slice is one vertical behavior — its test and its implementation together,
never a tests-only slice and a separate implementation-only slice (that is
horizontal slicing). Make Wave 1 the thinnest end-to-end happy path as a tracer
bullet that proves the whole path works; later waves add validation and edge
cases behind it.

- **Wave 1 — parallel:**
  - <slice> · owns `<file(s)>` · depends: none
  - <slice> · owns `<file(s)>` · depends: none
- **Wave 2 — parallel:**
  - <slice> · owns `<file>` · depends: <slice or contract from Wave 1>
- **Wave 3:**
  - <slice> · owns `<file>` · depends: <earlier slices>

**Verification**

Checkboxes, not prose — they are the resume token. A fresh session reads the
plan, finds the first unchecked box, and continues from there; prose
verification cannot be resumed from. Put the exact command inline.

#### Automated Verification:
- [ ] Type checking passes: `pnpm type-check`
- [ ] Lint passes: `pnpm lint`
- [ ] Unit tier passes: `pnpm test:unit`
- [ ] <Test Scope entry 1, command copied verbatim>
- [ ] <Test Scope entry 2, command copied verbatim — one box per entry>
- [ ] Full suite: CI on the PR — not run locally

<Emit **one box per `## Test Scope` Commands entry** — every one, copied
verbatim: whole line, its own `--project`, its own path. Do not collapse several
entries into one box, and do not wrap a path in another prefix: the entries are
already complete commands, so prefixing one yields
`src/__tests__/src/__tests__/…` and matches nothing. A scope with a `unit` and a
`default` command produces two boxes. Take entries only from **Commands** — a
**Notes** bullet ("Widen to: …") is prose and becomes an unrunnable box. A bare
`pnpm test` box does not belong here: the local loop runs the feature's tests,
CI runs the tier.>

#### Manual Verification:  <emit this subsection only when the wave needs one>
- [ ] <specific, actionable step that proves the behavior works — not "it compiles">

<Not every wave requires manual validation. When none is needed, omit the whole
subsection, heading included — do not leave an empty placeholder box. Resume
starts at the first unchecked box, so a box nobody intends to tick strands the
plan short of done and invites invented steps to clear it. When a wave does need
manual proof, the bar is proof the change works, per Acceptance.>
```

End the session by telling the user the plan is ready, naming the exact plan
path (`brain/plans/<slug>.md`) and the research doc if you wrote one
(`brain/plans/<slug>.research.md`), and stating that it is
the input to `implement`
(or `batch` when the plan splits into many independently-mergeable units the
user wants implemented as parallel PRs).
