---
name: ship
description: Use when the user asks to run the whole AFK flow, ship a feature, take work from idea or plan to a verified pull request, resume an AFK workflow, or make a final ship/no-ship call across planning, implementation, cleanup, QA, and PR creation
disable-model-invocation: true
---

# Ship

Drive AFK's existing skills to an evidence-backed verdict and an open pull
request. This skill orchestrates `grill`, `implement`, `simplify`, `review`,
`qa`, and `ship-it` without replacing their detailed instructions.

Core principle: do not claim something can ship until the relevant AFK phase
artifacts exist or are deliberately skipped with a reason.

This skill is `disable-model-invocation: true` — only the user starts a ship
run. It commits, pushes, and opens pull requests, and none of that should begin
because the code merely looks ready. `ship-it` stays model-invocable so step 8
can chain to it; its own preconditions are what stop an unwanted push.

## When to Use

Use this skill when:

- The user asks to run the full AFK loop, ship something, or take a feature
  from idea, prompt, or plan to verified evidence.
- The user wants to resume a partly completed AFK workflow and needs the next
  phase chosen from repo state.
- The user asks for one command that plans when needed, implements, cleans up,
  and QA-checks the result.

Do not use this skill for:

- A specific phase request such as "grill me", "implement this plan",
  "simplify the diff", "QA this", or "open the PR"; use that named skill
  directly.
- Merging, release notes, or deployment monitoring. AFK Ship stops at an open
  pull request; it does not merge, deploy, or manage releases.

## Process

Always track the run with the TodoWrite tool. As soon as the route is chosen
(steps 1–2), write one todo per phase that will actually run — skipped phases
are omitted — and keep it updated: mark the active phase `in_progress` and each
finished phase `completed` before starting the next. The list gives the user a
live view of the flow, for example:

```
◼ Implement vim-trainer MVP via orchestrator (branch + commit per AC)
◻ Simplify implementation diff
◻ Review diff (review)
◻ QA behavior (qa)
◻ Reflect learnings (reflect)
◻ Push branch and open PR (ship-it)
```

1. Derive the current phase from artifacts, not from memory.

   State lives on disk, so a ship run is resumable from a cold context — after a
   `/clear`, a crashed orchestrator, or a session picked up days later. Never ask
   the user where things stopped; read it:

   ```bash
   git branch --show-current && git status --short
   git log --oneline main..HEAD
   ls brain/plans/ qa/ 2>/dev/null
   ```

   Then route by the first row that matches:

   | Observed state | Phase |
   |---|---|
   | No plan for this work | `grill` |
   | Plan exists, unchecked verification boxes remain | `implement` — resume at the **first unchecked box** |
   | All boxes checked, diff not yet cleaned up | `simplify` |
   | Simplify done, no review findings on record | `review` |
   | Review **Revise** with unresolved high-severity findings | back to `implement` or `simplify` |
   | Review clean, behavior-bearing work, no `qa/<slug>.md` | `qa` |
   | QA verdict recorded, nothing reflected | `reflect` |
   | Verdict `SHIP`/`SHIP WITH CAVEATS`, branch unpushed | `ship-it` |

   Artifacts are evidence, not proof. A checked box whose command you did not
   watch run is a claim — spot-check the cheap ones (`git log`, file existence)
   and re-run anything a later phase depends on. A plan the user supplied by path
   is the source of truth; do not route back to `grill` merely because it is
   terse, and ask only when a specific missing decision blocks implementation.

   If the user explicitly asks only for the route, a dry run, or eval-mode
   explanation, do not invoke child AFK skills. Report the route and gates using
   the output shape below.

2. Choose the planning route.
   - If a plan path was supplied or one relevant plan clearly matches the work,
     read it and continue to implementation.
   - If the work is small, local, and already clear enough to implement, skip
     `grill` and record that planning was skipped because the scope is
     clear.
   - If product intent, contracts, edge cases, glossary terms, or source of
     truth are unresolved, invoke `grill` and use its
     `brain/plans/<slug>.md` output before implementation.

3. Run or resume implementation.
   - Invoke `implement` for repo-changing work, passing the selected plan
     path or clear prompt.
   - If a working-tree diff already exists, inspect it before implementing and
     continue from the current state instead of restarting.
   - Do not accept implementation as complete until relevant verification was
     run or the skip reason is explicit.

4. Run cleanup when useful.
   - Invoke `simplify` when the implementation diff is meaningful and
     non-mechanical.
   - Skip simplify only for tiny, mechanical, generated, formatting-only, or
     documentation-only changes, and say why.

5. Review before QA.
   - Invoke `review` on the implementation diff to get a principle-grounded,
     no-changes read before behavioral verification. Run it after simplify so
     review judges the cleaned-up diff.
   - Review only diagnoses; it never edits. If review returns **Revise**
     (high-severity findings), loop back to `implement` or `simplify` to
     resolve them before QA, or carry the unresolved findings as a caveat or
     `DO NOT SHIP`. Do not advance to QA pretending high-severity findings are
     absent.
   - Skip review for the same changes that skip simplify (step 4), and say why.

6. Run QA for behavior-bearing work.
   - Invoke `qa` when the change affects user-visible behavior, an API,
     CLI, worker, persistence, integration, or service contract.
   - QA must produce a `qa/<slug>.md` report with `SHIP`, `DO NOT SHIP`, or
     `SHIP WITH CAVEATS`.
   - For pure prose, metadata, or non-behavioral cleanup, skip QA with the
     specific reason and cite the verification used instead.

7. Persist learnings to the brain.
   - Once the verdict is known, invoke `reflect` to capture durable
     learnings from the run — corrections, gotchas, decisions, and rationale —
     into `brain/` (or route skill-process fixes into the relevant skill).
   - Skip only when the run produced nothing durable (a tiny mechanical change
     with no new knowledge); say so. Reflection persists knowledge; it never
     changes the ship verdict.

8. Push the branch and open the PR.
   - On a `SHIP` or `SHIP WITH CAVEATS` verdict, invoke `ship-it` to run the
     full gate, rebase, push, and open the pull request. Verified work that
     never leaves the machine is not shipped.
   - On `DO NOT SHIP`, or with unresolved high-severity `review` findings, do
     not invoke `ship-it`. Report the blocker and the next skill to run.
   - Skip only when the user explicitly asked to stay local; say so.

9. Finish with a ship report.
   - Summarize the phase route taken, changed files, verification, review
     verdict, QA report, final verdict, and what was reflected into the brain.
   - Always include the `Route`, `Plan`, `Verification`, `Review`, `QA`,
     `Memory`, and `PR` fields even when phases were skipped.
   - If any phase could not run, report the blocker as a caveat or
     `DO NOT SHIP`; do not soften missing evidence into success.

## Stop and Ask

STOP and ask the user when:

- More than one plan could plausibly own the requested work and repo state does
  not identify the right one.
- Continuing would require product intent, credentials, paid services,
  destructive actions, or external state that the repo does not provide.
- The user wants a merge, deployment, or release management; AFK Ship stops at
  an open pull request.

Do not ask about facts discoverable from plans, diffs, docs, tests, or QA
artifacts.

## Red Flags

| Thought | Reality |
|---------|---------|
| "Ship should copy the other skills so it is self-contained." | Ship is an orchestrator. Load the phase skill that owns the detailed work. |
| "There is a QA report, so QA is done." | Reuse it only if it still matches the current diff and requested behavior. |
| "Tests passed, so the final verdict is SHIP." | Tests are verification. Behavior-bearing work still needs `qa` evidence. |
| "The work is almost done, so report success." | Missing phase evidence is a caveat or blocker, not success. |
| "Everything is green locally, so the run is done." | Green and local is not shipped. Run `ship-it` unless the user asked to stay local. |

## Output

Return this compact shape:

```markdown
Verdict: SHIP | DO NOT SHIP | SHIP WITH CAVEATS
Route: grill skipped/used -> implement -> simplify skipped/used -> review skipped/used -> qa skipped/used -> reflect skipped/used -> ship-it skipped/used
Plan: brain/plans/<slug>.md or "none, reason"
Changed: <files or summary>
Verification: <commands/results>
Review: accept | accept with notes | revise, or "skipped, reason"
QA: qa/<slug>.md or "skipped, reason"
Memory: <brain files written/updated, or "skipped, reason">
PR: <url, or "skipped, reason">
Caveat: <one sentence, only if needed>
```

If the work stops before a final verdict, report the current phase, exact
blocker, and the next AFK skill to run.
