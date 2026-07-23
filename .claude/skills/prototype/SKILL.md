---
name: prototype
description: Use when the user wants a throwaway prototype, mockup, playable state model, UI variations, or to sanity-check logic/API shape before committed planning or implementation.
---

# Prototype

A prototype is throwaway code that answers one question before AFK commits to a
plan or implementation. Use it when the user needs to try something by hand:
flip between UI directions, push a state model through edge cases, or feel out
an API shape before writing production code.

Prototype is optional and user-driven. It is not a required `ship` phase,
and prototype artifacts are not production evidence.

## When to Use

Use this skill when:

- The user says `prototype`, `mock up`, `try a few designs`, `let me play with
  it`, or asks for UI variations.
- The user wants to sanity-check a state machine, business rule, API shape, data
  model, or interaction flow before implementation.
- The next useful answer is observable behavior, not another verbal planning
  question.

Do not use this skill for:

- Normal implementation of an already-decided feature; use `implement`.
- A planning interview where the user needs decisions, trade-offs, contracts, or
  source-of-truth conflicts resolved; use `grill`.
- Shipping evidence. Prototype output must be deleted or absorbed before the
  real feature can ship.

## Process

### 1. Pick the Branch

Identify the question being answered:

- **Logic/state/API feel:** read [LOGIC.md](LOGIC.md). Build a tiny interactive
  terminal app over a portable pure module.
- **Visual/UI direction:** read [UI.md](UI.md). Build several structurally
  different variants on one route with a `?variant=` switcher.

If the question is genuinely ambiguous and the repo does not settle it, default
from the surrounding code: backend modules and data models use logic; pages and
components use UI. State the assumption at the top of the prototype.

### 2. Follow Prototype Rules

1. Mark the artifact as throwaway from day one. Put it near the code it explores
   and include `prototype` in the file, route, or directory name.
2. Provide one run command using the project's existing task runner. Do not add
   a new runtime or package manager just for the prototype.
3. Keep state in memory unless persistence is the thing being explored. If a
   scratch file or database is necessary, name it `PROTOTYPE-WIPE-ME`.
4. Skip production polish: no tests, no broad abstractions, no defensive error
   handling beyond what keeps the prototype runnable.
5. Surface the full relevant state after every action or variant switch.
6. Do not wire prototypes to real production mutations. Stub writes unless the
   question explicitly requires mutation behavior.
7. When the answer is known, delete the throwaway shell or fold the winning idea
   into real code through `implement`.

### 3. Capture the Verdict

Create or update `brain/prototypes/<slug>.md` before handoff (creating the vault
if it does not exist yet):

```markdown
# <Prototype Name>

Question:
<What this prototype answered.>

Artifact:
<Path and one run command.>

Verdict:
<What the user or session learned.>

Decision:
<Delete, absorb into real implementation, or continue exploring.>
```

If the user is present, ask what the prototype taught them before filling the
verdict. If they are AFK, leave a clear placeholder so the answer can be filled
before the prototype is deleted.

## Stop and Ask

STOP and ask the user when:

- The prototype question is unclear enough that logic and UI branches are both
  plausible and repo context does not break the tie.
- Continuing would require credentials, paid services, private data, destructive
  actions, or real production mutations.
- The user wants the prototype shipped as production code. Route that through a
  normal `implement` task instead.

Do not ask about facts discoverable from routes, components, schemas, package
manifests, existing task runners, or nearby code.

## Output

Return:

- The branch used: logic or UI.
- The artifact path and run command.
- The verdict note path under `brain/prototypes/`.
- The next AFK step: usually `grill` for planning from the learning, or
  `implement` when the winning behavior/design is already decided.

## Red Flags

| Thought | Reality |
|---------|---------|
| "The prototype passed QA." | Prototypes do not produce shipping evidence. Delete or absorb them before QA. |
| "This should be robust in case we keep it." | Keeping it is a separate implementation task. The prototype answers one question fast. |
