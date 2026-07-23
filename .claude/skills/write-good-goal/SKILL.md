---
name: write-good-goal
description: Use when the user asks to write, refine, draft, or validate a /goal, completion condition, objective, success criteria, definition of done, or bounded outcome for long-running agent work
---

# Write Good Goal

Turn the user's intent into a concrete `/goal` condition.

Core principle: write the goal text only. Do not start the goal, run `/goal`,
or begin implementation unless the user explicitly approves the final wording
and asks you to set it.

## When to Use

This skill shapes the `/goal` wording — nothing more. Do not use it to interview
a vague feature into a plan (that is `grill`) or to do the work the goal
describes. Reach for it when an objective needs to become a single,
transcript-checkable completion condition before a long-running run.

## Process

1. Identify the user's intended outcome.
2. If the request is vague, see **Stop and Ask** below.
3. Convert the intent into a single completion condition that an agent can
   evaluate from its own transcript.
4. Include the desired end state, proof, constraints, and a stop bound when the
   work could run too long.
5. Avoid goals that depend on hidden state, unstated preferences, or subjective
   quality judgment.
6. Match verification to the project shape. For frontend work, include
   end-to-end browser evidence with `agent-browser` when the app can be run
   locally and the outcome is user-visible. For backend, CLI, library, or docs
   work, prefer the narrow contract, test, build, or artifact proof that best
   matches the change.
7. Present the recommended goal without starting the work.

## Good Goal Shape

Use this structure:

```text
Achieve [specific outcome]. Prove it by [verification]. Preserve [constraints]. Stop if [limit].
```

If a shorter form is clearer, keep the same information but remove labels.

## Stop and Ask

Ask one to three focused questions only when the goal cannot be made
verifiable from the user's message.

STOP before drafting if any of these are missing and cannot be inferred:

- Product intent: what outcome should exist when the work is done.
- Scope boundary: which repo, feature, file set, issue, plan, or artifact owns
  the work.
- Source of truth: which plan, ticket, acceptance criteria, screenshot, or
  failing command defines success.
- Verification: which observable evidence should prove completion when no
  reasonable default fits the project shape.

Do not ask when the user gave enough detail.

## Quality Checks

Before presenting the final goal, check that it is:

- Specific: names the thing to change, build, finish, or verify.
- Measurable: has a test, command, metric, count, artifact, checklist, or
  observable acceptance criterion.
- Non-ambiguous: avoids words like "better", "clean", "done", or "complete"
  unless they are defined by concrete evidence.

## Red Flags

| Thought | Reality |
|---------|---------|
| "Make this better" | Define what "better" means and how to prove it. |
| "Finish the migration" | Name the migration scope and verification command. |
| "Fix all bugs" | Name the bug source, queue, issue label, failing command, or maximum number of issues. |
| "Clean up the code" | Define target files and measurable cleanup criteria. |
| "The agent will know when it is done" | The goal must include transcript-observable proof. |

## Output

Return this compact shape:

```markdown
Recommended `/goal`:
<single command or condition>

Why this works:
<one or two sentences>

Assumptions:
<short bullets, or "None">

Optional tighter version:
<only include when a safer or more bounded variant is useful>
```

Omit `Optional tighter version` when it does not add a safer or more bounded
alternative.
