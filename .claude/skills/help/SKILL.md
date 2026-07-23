---
name: help
description: Use when the user asks for help, afk help, what to do next, where am I, which AFK skill to use, AFK workflow orientation, or a broad catalog explanation
---

# Help

Orient the user in the AFK workflow and recommend the next useful step.

Core principle: be specific, not encyclopedic. Ground the answer in observed
project state and surface only the skills relevant to the current state or the
user's question.

## When to Use

Use this skill when the user asks for AFK help, workflow orientation, the next
AFK step, where they are in the process, which AFK skill to run, or an
explanation of AFK itself.

## Sources

- Catalog: [afk-help.csv](./afk-help.csv)
- AFK familiarity: does `brain/` exist? Present = the user has used AFK here
  before (returning); absent = this is a fresh project (first contact).
- Domain glossary: `brain/context.md`
- Decisions: `brain/decisions/`
- Plans: `brain/plans/` (from `grill` and `plan`)
- External grounding: `brain/sources/` (from `research`)
- Codebase maps: `brain/codebase/` (from `map-codebase`)
- QA evidence: `qa/`
- Current implementation state: `git status --short` and `git diff --stat`

## Process

1. Read the catalog.
2. Inspect the available artifacts listed above, including whether `brain/`
   exists (fresh vs returning).
3. If this is a fresh project (no `brain/`), lead with the onboarding path
   before any other routing — see "Fresh project" below.
4. Classify the user intent:
   - General orientation: explain where they are and the next step.
   - Specific skill question: explain that skill, when to use it, and what it
     produces.
   - End-to-end lifecycle request: recommend `ship`.
   - "What now?": recommend exactly one next skill unless the state is truly
     ambiguous.
5. Give the invocation, e.g. `write-good-goal`, `grill`,
   `ship`, `implement`, `batch`, `simplify`, or `qa`.
6. If one next step is clearly right, offer to run it now.

## Routing rules

- **Fresh project (no `brain/` directory):** the user is new to AFK here.
  Before routing on intent, orient them on the eval-first / TDD habit AFK
  encourages: write a failing eval first, then implement against it. Recommend
  `write-evals` to capture the behavior as a failing eval, then
  `implement` to make it pass. Mention `init-brain` so the memory vault
  exists for future runs. Skip this lead-in once `brain/` is present.
- The user asks for `/goal` help, objective shaping, success criteria, a
  completion condition, or a definition of done for long-running agent work:
  recommend `write-good-goal`.
- The user asks to run the whole AFK flow, ship a feature, resume an AFK
  lifecycle, or get from idea/plan to a ship/no-ship verdict: recommend
  `ship`.
- The user asks to prototype, mock up, try a few designs, create UI variants,
  make something playable, or sanity-check a state model/API/data shape by
  interacting with it: recommend `prototype`.
- The user asks for prior art, external best practice, how other teams or
  libraries solve a problem, competitor patterns, or a scan of the landscape
  before planning: recommend `research` to turn the open question into an
  external-grounding digest. It feeds `grill`.
- No concrete plan in `brain/plans/`: recommend `grill` to
  interview a vague idea into a plan, or `plan` to decompose an
  already-clear task into phased plans. Both feed `implement`.
- A plan exists and there is little or no implementation diff: recommend
  `implement`. If that plan splits into many independently-mergeable units
  (a codebase-wide migration, rename, or repeated pattern change) and the user
  wants parallel PRs, recommend `batch` instead.
- There is an implementation diff after a plan: recommend `simplify`.
- The user asks for verification, browser QA, API/service QA, screenshots,
  request/response evidence, or a ship/no-ship call after implementation:
  recommend `qa`. It is the closer for the `implement` path; `batch`
  opens its own PRs, and `ship` stops at the QA verdict.
- The user asks about persistent memory, project principles, capturing
  learnings, or the `brain/` vault: recommend the memory skills — `reflect`
  to capture a session, `ruminate` to mine past conversations, `meditate`
  to audit and prune, `brain` for direct read/write, `init-brain` to
  scaffold, `map-codebase` to map an existing area as-is, `plan` for
  phased plans, and `review` for a principle-grounded review. These run
  anytime, not as a fixed flow phase.
- The user asks about AFK itself: answer from the catalog and this plugin's
  README-level flow.
- The user asks for release checks beyond browser QA: recommend the project's
  normal tests first, then `qa` for real user-flow evidence.

## Missing Artifacts

If a file or directory is missing, treat that as workflow signal. Do not invent
project-specific progress, decisions, plans, implementation, or QA evidence.

When the catalog is missing or unreadable, STOP and say that the help catalog is
unavailable. Give only the recommendation that can be justified from the
observed project state.

## If AFK skills don't auto-trigger

AFK relies on Claude Code injecting each skill's description so it fires on
intent. On some Claude Code versions plugin skills are not auto-discovered, or a
crowded install drops less-used descriptions from the skill listing. When a
skill does not trigger on its own, invoke it explicitly:

`/help`, `/write-good-goal`, `/prototype`, `/grill`,
`/implement`, `/batch`, `/simplify`, `/qa`, `/ship`.

If auto-trigger keeps failing, run `/doctor` to check plugin/skill loading, and
raise `skillListingBudgetFraction` in settings so more descriptions stay listed.

## Stop and Ask

STOP and ask a clarifying question when two or more next skills are equally
plausible and the project state does not break the tie.

Ask only for the missing intent or source of truth needed to choose the next
AFK step.

## Red Flags

| Thought | Reality |
|---------|---------|
| "The user asked for help, so list every skill." | List only relevant skills unless they ask to show everything. |
| "The plan probably exists somewhere." | Inspect `brain/plans/`; missing artifacts are workflow signal. |
| "There is a diff, so QA is next." | After a plan plus implementation diff, recommend `simplify` before QA unless the user explicitly asks for verification. |
| "The user said ship, so recommend QA only." | `ship` owns the full route to a verdict; QA is just the final evidence phase. |
| "Just route on intent; familiarity doesn't matter." | No `brain/` means a fresh project — lead with the eval-first onboarding (`write-evals` then `implement`) before intent routing. |

## Output

Use this compact shape:

- **Where you are:** one sentence grounded in observed files or git state.
- **Next step:** `[menu-code] Display Name` and skill invocation.
- **Why:** one sentence.
- **Expected output:** the artifact or state the skill should produce.

When the user asks a broad catalog question, list only the relevant skills.
When the user asks "show me everything", show the full catalog grouped by
phase.
