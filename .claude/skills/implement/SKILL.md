---
name: implement
description: Use when the agent is about to implement, edit code, execute a plan, fix a bug, build a feature, or make repo changes, especially when task complexity or orchestration needs are unclear. Do not start editing code, writing tests, or running build or test commands directly — load this skill first to triage and route.
---

# Implement

Load this skill before implementation starts. First decide whether the work is
simple enough to do directly or complex enough to justify orchestration.

Simple local changes belong in the main conversation. Complex work uses the
lead-orchestrated shape: the Opus `implement-orchestrator` decides the
architecture, contracts, boundaries, file ownership, data flow, error handling,
and integration order; Sonnet `implementation-worker` agents run bounded local
TDD slices inside those decisions.

## When to Use

Use this skill before any repo-changing implementation work, including:

- Implementing a written plan or a plan from `grill`.
- Editing code, tests, workflows, configuration, docs-as-product, or generated
  artifacts.
- Fixing bugs, building features, refactoring, or wiring integrations.

Do not wait until the task feels complicated. This skill is the gate before
touching files.

## Process

### 1. Triage Complexity

Before editing, classify the task.

The default for any real code change is to orchestrate. Doing it yourself in the
lead is the narrow exception, reserved for changes with no behavior logic to
test.

Do the work directly only when all of these are true:

- The change carries no new or changed behavior that needs a test: docs,
  comments, copy, config values, formatting, or a literal one-line fix.
- It touches one or two files with no unsettled shared interface.
- The expected result is obvious on its face from reading the diff alone.

Use lead-orchestrated slices when any of these are true:

- The change adds or modifies behavior that should be covered by a test. The
  moment the task needs a test written — a new function, a bug fix with a
  regression test, an edge case, a branch — route it through the orchestrator
  and let a worker run the TDD slice. Do not write the implementation and its
  tests yourself in the lead.
- The work spans multiple files, modules, packages, workflows, or UI states.
- The task needs architecture decisions, contracts, sequencing, or integration
  planning.
- Independent slices can be assigned with fixed boundaries and verified
  separately.
- The task involves migrations, security-sensitive code, data flow, external
  APIs, complex tests, or risk that is hard to see in one diff.
- A shared abstraction (component, type, helper, endpoint shape) is introduced
  or changed and then applied across several call sites.
- A plan from `grill` or `plan` (`brain/plans/`) exists,
  or the user provides a worked-out design.

Per-edit size does not downgrade the triage. Many small, near-identical edits
spread across many files is multi-file work — orchestrate it; do not collapse
it into the lead just because each individual diff looks trivial. The fact that
a shared contract must be designed first is the signal to orchestrate, not to do
it all yourself: hand the plan to the orchestrator, which freezes the contract
and then fans the mechanical application out to workers (see the refactor recipe
below).

A finished plan does not downgrade the triage either. "The plan already froze
every contract, so there is nothing left to orchestrate" is a reason to hand the
plan straight to the orchestrator, not a reason to go direct — orchestration
still buys bounded parallel slices and independent per-slice review even when the
architecture is fully decided. Architecture-is-decided and orchestration-adds-no-
value are different claims; do not conflate them.

### 2. Direct Implementation

For genuinely test-free work (docs, config, copy, formatting, a literal
one-liner):

1. Read the target file and its immediate neighbors.
2. Make the smallest change that satisfies the request.
3. Run the narrowest meaningful verification command.
4. Read the diff before reporting completion.

Do not create fake slices, dispatch subagents, or write a heavyweight plan for
genuinely local work. Conversely, if the change needs a test, it is not this
case — go to orchestrated implementation, even when it is one file.

### 3. Orchestrated Implementation

For complex work, hand the plan directly to AFK's read-only orchestrator and
let it do the research and the design:

- `implement-orchestrator`: Opus, read-only, reads the source, decides
  architecture, contracts, slice boundaries, sequencing, and reviews workers.
- `implementation-worker`: Sonnet, edit-capable, owns one fixed local TDD
  slice at a time.

Do not research or design first. The lead does not read the source, decide
which files or modules to change, write a delegation analysis, or build any
part of the implementation before delegating — all of that is the
orchestrator's job. The lead's only inputs to `implement-orchestrator` are:

1. The plan itself, usually `brain/plans/<slug>.md` from `grill` or
   `brain/plans/<slug>/` from `plan`, or the plan/design the user provided —
   locate it under `brain/plans/` and pass it directly.
2. Any constraints or acceptance criteria the user stated that are not already
   captured in the plan.
3. Rulings for any decision in the plan the orchestrator will treat as a hard
   blocker — destructive-migration policy, public-vs-private data, or contested
   shared-interface ownership. Scan the plan for these before dispatch and fold
   the rulings into the first brief. The orchestrator is not reliably resumable
   mid-run; an unresolved blocker can cost a full re-dispatch.

The orchestrator then reads the source, decides the contracts and slice
boundaries, and briefs the workers. Hand it the plan and let it design; do not
pre-chew the architecture for it.

The main conversation still owns final acceptance: after the orchestrator
returns, read the diff, run verification, and decide whether the work is done.

If the packaged agents are unavailable in the current Claude Code version or
plugin loading path, keep the same shape in the main conversation: read the
plan, decide contracts first, then dispatch bounded workers manually.

#### Shared-abstraction refactor (freeze, then fan out)

When the work is "introduce a shared X and apply it across N files" — a new
component, type, helper, or endpoint shape with many call sites — this is the
default orchestration shape, not a direct edit. Hand it to the orchestrator
like any other plan; do not build or freeze the shared abstraction in the lead.
The orchestrator:

1. Freezes the shared abstraction's contract, then sequences a worker to build
   it (with its tests) first. The shared file is the architecture; the
   orchestrator owns the decision, and a worker writes it.
2. Once the contract is frozen, writes one parameterized brief and dispatches
   one `implementation-worker` per call site (or per small group). Each worker
   gets the frozen signature, the exact file, and a concrete migrated example
   to mimic.
3. Runs the call-site workers in parallel once the contract is frozen — the
   file contention that blocked them is gone because nobody is still changing
   the shared file.

Do not collapse this into the lead on the grounds that "each edit is tiny" or
"the brief is longer than the diff." Across N files the brief is written once
and reused; the per-file diff is the wrong unit to measure. The lead's job is
to recognize the shape and route it, not to design or build the abstraction.

### 4. Dispatch Workers

Use the smallest orchestration primitive that fits:

| Primitive | Use for |
|-----------|---------|
| `implement-orchestrator` | Default for complex AFK implementation; read-only architecture and worker delegation |
| Plain subagents | A few self-contained implementation, test, or review slices when packaged agents are unavailable |
| Agent teams | Several long-running peers that need a shared task list, direct communication, or plan approval before edits |
| Dynamic workflows | Dozens to hundreds of repeatable agents for repo-wide audits, migrations, or cross-checked research |

Subagents start with zero context unless explicitly forked. The orchestrator
writes the worker briefs; in the manual fallback the lead does. Each worker
brief must include:

- The full spec or plan for the overall change, in addition to the worker's
  specific slice task. Always include it verbatim — the worker has never seen
  the plan and needs the whole spec to see how its slice fits, even though its
  edits stay inside the boundaries below.
- Exact file paths to create or edit and files to read first.
- The contract: signatures, types, expected behavior, and error cases.
- Code conventions to follow, with a concrete existing file to mimic.
- The local TDD loop: write the failing test, implement the smallest passing
  change, refactor locally, and report evidence.
- The test-quality bar: the test verifies observable behavior through the public
  interface, mocks only at system boundaries (external APIs, database, time,
  randomness) and never internal collaborators, and does not assert on call
  counts/order or verify through a side channel.
- The verification command to run before reporting back.
- Hard boundaries: no neighboring refactors, no new dependencies, no renames,
  and no work outside the brief unless explicitly allowed.

Use `implementation-worker` for edit-capable implementation slices by default.
Only choose a different worker when the task clearly needs a specialized agent
or a cheaper model for mechanical boilerplate.

Each slice is a vertical tracer bullet: one behavior with its test and its
implementation owned by one worker. Never split the work into a tests-only slice
and a separate implementation-only slice — that is horizontal slicing, and it
produces tests written against imagined behavior. Sequence the thinnest
end-to-end path first to prove it works, then add edge cases as incremental
slices.

Maximize parallelism: dispatch independent slices (disjoint files, no shared
contract) concurrently, in the waves the plan provides when it has them. Run
dependent slices sequentially. Never let two workers edit the same file
concurrently.

Nested subagents are supported in modern Claude Code, but use them sparingly.
AFK's default hierarchy is `implement` -> `implement-orchestrator` ->
`implementation-worker`. Do not create deeper trees unless the orchestrator has
several independent review or implementation branches and can keep their
outputs concise.

### 5. Require Local TDD Evidence

For implementation slices, every worker must run red-green-refactor inside its
boundary:

1. Write or update the failing test for the assigned behavior.
2. Implement the smallest passing change.
3. Refactor locally without changing the public contract.
4. Run the slice verification command.
5. Report evidence: failing test observed, passing test observed, and refactor
   verification.

For behavior-preserving rewrites and migrations, a characterization or
golden-master baseline captured before the change and kept green throughout is a
valid substitute for per-slice red-green: the captured baseline is the
failing-first signal — any drift turns it red. In that mode, brief workers to
keep the baseline byte-identical rather than to author a new failing test per
slice.

### 6. Review Every Result

A worker's "done" report is a claim, not a fact.

After each worker returns:

1. Read the actual diff with `git diff`, not just the summary.
2. Run the verification command yourself.
3. If the result is wrong, re-dispatch once with the relevant diff and a
   specific correction.
4. If it is wrong twice, treat the brief or model choice as the problem and
   finish the fix in the lead context.

When all slices land, run the full relevant test suite and read the complete
diff end-to-end for integration issues that slice reviews could not see. The
static gate — typecheck, unit tests, file existence — does not exercise runtime
behavior or cross-slice interactions. Before accepting:

- **Frontend slices:** boot the app and do a minimal live-render smoke check —
  the affected page actually renders and key components are not blank. A green
  unit suite does not prove the page renders.
- **Forms and API contracts:** round-trip at least one real value against the
  actual server, not just typecheck — e.g. a form field whose serialized shape
  the server must accept.
- **Migrations, schema, cross-cutting constraints:** run the end-to-end command
  chain that exercises the new constraint against existing flows (e.g. a
  re-import after a new foreign key), not only per-slice checks. Isolated slice
  verification cannot see cross-slice runtime interactions.

## Stop and Ask

STOP before dispatching workers when:

- Shared interfaces, ownership, or integration order are undecided.
- Two workers would need to edit the same file at the same time. If the shared
  file is a contract still being designed, that is a sequencing problem, not a
  reason to abandon orchestration: freeze it in the lead first, then fan the
  call-site edits out.
- The requested change depends on product intent, credentials, private data,
  or an external source of truth that is not available.
- The task is a migration, security-sensitive change, or destructive action
  and the safe boundary is unclear.

Ask only for the missing decision or permission. Otherwise, decide in the lead
context and keep moving.

## Red Flags

| Thought | Reality |
|---------|---------|
| "I'll start coding and load the skill if it gets complicated" | This skill is the gate before implementation. Triage first, then act. |
| "Any implementation task should use subagents" | Simple local work is faster and safer in the main conversation. Orchestrate only when complexity justifies it. |
| "It's one file, I'll just write the code and the test myself" | A test means behavior worth verifying. One file or not, route it through `implement-orchestrator` and let a worker run the TDD slice. Only test-free changes stay in the lead. |
| "A worker can explore and decide the approach" | Workers get decided contracts. The orchestrator reads the source and decides architecture first, then briefs — workers never explore and pick the approach themselves. |
| "The brief is getting long, I'll just say 'follow the plan'" | The subagent has never seen the plan. Always paste the full spec verbatim, alongside the slice task. |
| "It reported success and tests pass" | Whose tests? Read the diff. Workers can delete failing tests, hardcode fixtures, or stub the hard part with a TODO. |
| "The orchestrator is read-only, so it verified everything" | Read-only means no shell verification. The main conversation must run final checks after workers edit. |
| "This task is too hard for sonnet, I'll write a smarter prompt" | If it needs a smarter prompt, it needs a smarter model: do it yourself. |
| "The edits are tiny, so I'll just do all N inline" | Per-edit size doesn't change the triage. N near-identical edits across N files is multi-file work: freeze the shared contract, then fan out. |
| "The brief would be longer than the diff" | True for one-off local work, not a fan-out. Across N files you write one parameterized brief and reuse it — the per-file diff is the wrong unit. |
| "The shared component keeps changing, so workers would collide" | That's a sequencing problem, not a reason to stay direct. The orchestrator freezes the shared file first, then dispatches the call-site edits in parallel. |
| "I'll design the shared contract in the lead and just hand workers the call sites" | Contract design is the orchestrator's job. Designing it yourself is delegated architecture in reverse. Hand it the plan; let it freeze the contract and fan out the work. |
| "The plan already fixed every contract, so I'll just execute it directly" | A decided plan is the orchestrator's input, not a reason to skip it. Frozen contracts still need bounded parallel slices and independent review. Hand the plan to `implement-orchestrator`. |
| "The test passes, so it's a good test" | A green test that mocks internal collaborators, asserts call counts/order, tests private methods, or verifies through a side channel is coupled to implementation and breaks on refactor. Reject it; tests verify observable behavior through the public interface. |

## Output

Final responses after implementation should include:

- Changed files.
- What changed and why.
- Verification commands and results.
- Any known gaps, follow-up risks, or blocked checks.

When everything is green, suggest `simplify` as the next step.
