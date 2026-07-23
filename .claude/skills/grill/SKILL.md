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
4. Whenever step 3 found research adds value, dispatch bounded read-only
   subagents in parallel; scale depth to the step-3 signals (a throwaway gets the
   codebase scout only; a payments or migration decision gets the full set plus
   landscape delegation). Scouts report findings only — never recommendations;
   prescription is the plan's job.
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
   with the Coverage ledger (the fixed surface taxonomy in RESEARCH-GATE.md, each
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
7. Now interview the ledger's open-needs-user rows, in priority order
   (blast-radius and irreversibility first, then the experience bar, then edge
   cases, then cosmetics). Ask one at a time, waiting for each answer, each as
   (the question, why it matters / what breaks, and your recommended
   default-if-silent). Silence or "your call" resolves a non-blocking row to its
   stated default — except the Stop-and-Ask surfaces below, which must be asked
   as real questions even when a default exists. If research already closed every
   row, say so and go straight to the plan — do not manufacture questions.
8. Challenge glossary conflicts immediately. If the user uses a term
   differently from `brain/context.md`, say what the glossary says and ask which
   meaning is authoritative.
9. Sharpen fuzzy or overloaded language. Propose canonical terms when concepts
   such as `account`, `user`, `customer`, `order`, or `cancellation` may mean
   different things.
10. Stress-test decisions with concrete scenarios, edge cases, failure modes,
    permission boundaries, lifecycle states, and cross-system contracts.
    For experience-bearing work — UI, dashboards, reports, anything whose value
    is what the user *understands or can do* — also grill the quality bar, not
    just the data: which insight or outcome the user must get, what must be
    visible at a glance, and how "good" will be judged (legibility,
    scannability). Treat that bar as a contract, not taste — without it,
    implementation ships something that runs but does not deliver, and QA has no
    bar to fail it against.
11. Cross-reference user claims against code and fetched sources. Surface
    contradictions explicitly and ask which source should win. When an answer
    surfaces a new what-is fact, append it to the research doc before the plan
    cites it — research is ground truth, not a write-once snapshot.
12. Update `brain/context.md` immediately when a glossary term is resolved. Use
    it only as a glossary: no implementation details, specs, scratch notes, or
    plan content. If creating it, use [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).
13. Offer an ADR only when the decision is hard to reverse, surprising without
    context, and the result of a real trade-off. If creating one, use
    [ADR-FORMAT.md](./ADR-FORMAT.md).
14. Continue until the coverage ledger closes: every surface is
    resolved-by-evidence, resolved-by-user, default-accepted, or n/a-derived
    (with a one-line reason) — none left open. This is an enumerable check, not a
    feel; contracts clear, ambiguous terms defined, key edge cases answered, and
    source-of-truth conflicts settled all fall out of it.
15. If during the interview the user pointed you at a reference repo they cloned
    locally ("do it like that repo", "see the pattern in Y"), read it and record
    it in the plan: its origin (GitHub URL or name) and its local path, so
    implementation reads the real source instead of a remembered pattern.
16. Write the agreed plan to `brain/plans/<slug>.md` and add a wikilink to it in
    `brain/plans/index.md`, creating the vault if it does not exist yet. (Do not
    edit `brain/index.md` — the auto-index hook maintains it.) If you wrote a
    research doc in step 5, link it from the plan's `## Research` line so the plan
    stays the single entrypoint. Every decision or contract that rests on a
    finding must cite it (`[[<slug>.research#<finding>]]`) so the plan's
    prescription is traceable back to the descriptive evidence; a choice made in
    the interview with no finding behind it carries an explicit
    `(no research — chosen in interview)` tag instead. Keep the finding in
    research, the choice in the plan, never duplicate the prose. Include decisions
    made, contracts between parts, relevant glossary or ADR updates, an explicit
    `## Acceptance` bar for experience-bearing work (the user-visible quality
    criteria, so `implement` has a target and `qa` has a bar), and the
    implementation task list grouped into parallel waves (see Output). Decide the
    schedule here so `implement` does not have to re-derive it: mark which
    slices are independent (disjoint files, no shared contract) so they run
    concurrently, and which depend on earlier slices; give every slice the files
    it owns and what it depends on. Every contract that depends on a library,
    SDK, or API must cite the source URL and version it was doc-verified against
    (per step 3).

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

## Output

Create the plan file (`brain/plans/<slug>.md`) with this shape:

```markdown
# <Plan Title>

## Research
- [[<slug>.research]] — descriptive findings the scouts produced (omit if none written)

## Context
- <What is being changed and why>
- <Relevant code, glossary, ADR, or external source constraints>
- <Reference repos the user cloned to copy a pattern: origin (GitHub URL) and local path>

## Decisions
- <Resolved decision and rationale> — grounds: [[<slug>.research#<finding>]] (or `(no research — chosen in interview)`)

## Contracts
- <Interface, data, lifecycle, permission, or ownership contract> — grounds: [[<slug>.research#<finding>]] (or `(no research — chosen in interview)`)

## Acceptance
<For experience-bearing work (UI, dashboards, reports). The user-visible quality
bar — what "good" means, not just that it runs. Each criterion must be
verifiable by QA.>
- <The insight or outcome the user must get, and what makes it good — e.g. the
  90-day trend is legible at a glance, axis scaled to the data range not fixed
  to zero, the key comparison visible without interaction, same insight on mobile>

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
1. <Verification task or command>
```

End the session by telling the user the plan is ready, naming the exact plan
path (`brain/plans/<slug>.md`) and the research doc if you wrote one
(`brain/plans/<slug>.research.md`), and stating that it is
the input to `implement`
(or `batch` when the plan splits into many independently-mergeable units the
user wants implemented as parallel PRs).
