---
name: qa
description: Use when implementation is done, before shipping, or when the user asks to QA, dogfood, verify that a change actually works, or make a ship/no-ship call on a specific change.
context: fork
---

# QA

QA proves whether the intended user or client can complete the changed flow.
Route by project shape, verify with direct evidence, and end with a clear
SHIP, DO NOT SHIP, or SHIP WITH CAVEATS verdict.

**Core principle:** tests are supporting evidence; QA is the observed behavior
of the real UI, API, CLI, worker, or service contract. A claim without evidence
is not a finding.

## When to Use

Use this skill after `implement`, after any meaningful code change, or when
the user says phrases like "qa this", "verify it", "dogfood this", "check it
actually works", or "can this ship?"

## Process

1. Orient on the target.
   - Identify the flow under test from the plan (`brain/plans/<slug>.md` from
     `grill` or `brain/plans/<slug>/` from `plan`), the recent diff, or
     the user's named target.
   - Capture the change's **stated intent** — what the user should be able to
     understand or do once it ships (the plan's `## Acceptance` bar if present).
   - If the plan links a research doc (`brain/plans/<slug>.research.md`), read it
     for the existing testing patterns, data flow, and entry points it already
     mapped — reuse them instead of re-discovering how the area is exercised.
   - Read local run instructions from `README`, `CLAUDE.md`, package scripts,
     Procfile or compose files, Makefile, and framework config.
   - If the vault has principles, skim `brain/principles.md` for any that set an
     evidence bar (e.g. prove-it-works) and let them shape what counts as proof
     in the verdict.
   - Classify the changed system:
     - **Frontend:** browser-rendered screens, routes, forms, navigation,
       client-side state, visual changes, or accessibility changes.
     - **Backend:** APIs, workers, CLIs, persistence, auth, queues, webhooks,
       or service contracts without a meaningful browser surface.
     - **Hybrid:** backend behavior that must also be proven through a
       user-visible frontend flow.

2. Choose the QA route.
   - Frontend: run Frontend QA.
   - Backend: run Backend QA.
   - Hybrid: run Backend QA for the service contract, then Frontend QA for the
     user-visible integration.
   - If the app cannot run locally because services, migrations, seeds, or
     secrets are missing, capture the exact command and error. Do not replace
     QA with "tests pass".

3. Run Frontend QA when the changed flow has a browser surface.
   - Start the dev server in the background. Wait for its ready banner and use
     the real port it prints. If a server already runs on that port, reuse it.
   - Open a named browser session so state survives across commands:

     ```bash
     agent-browser --session-name afk-qa open http://localhost:<port>
     export AGENT_BROWSER_SESSION=afk-qa
     ```

   - If `agent-browser --help` fails, say so and stop. Do not silently fall
     back to unit tests for browser QA.
   - Derive cases from the plan and expected user behavior, not from the
     implementation: happy path, every acceptance criterion, invalid input,
     empty submit, refresh mid-flow, back button, and double-click submit.
   - For each step:
     1. Wait for a reliable signal with `wait --load networkidle` or
        `wait --text "..."`.
     2. Run `snapshot -i -u`; act on `@eN` refs, not CSS selectors.
        Re-snapshot after every DOM-changing action because refs expire.
     3. Capture screenshots at each state transition under
        `qa/evidence/<slug>/`.
     4. Check what screenshots cannot show: uncaught `errors`, `[error]`
        console lines, relevant input values, and `window.location.href`.
     5. Round-trip created or edited data when possible by navigating away and
        confirming the downstream view updated.
   - After verifying the primary changed flow, record one concise replay under
     `qa/evidence/<slug>/feature-walkthrough.webm`:
     1. Return to a clean starting point.
     2. Run `agent-browser record start qa/evidence/<slug>/feature-walkthrough.webm`.
     3. Re-snapshot because recording creates a fresh browser context, then
        replay only the shortest representative path and visible result.
     4. Run `agent-browser record stop` before writing the report.
     5. Link the recording from the test case's Evidence line. Keep it under
        90 seconds; if the feature fails, record the shortest reproduction.
   - Treat a rendered success screen with a 500, uncaught exception, or
     relevant console error as a failure.
   - Judge the primary view against its stated intent, not just that it
     rendered. For data visualizations specifically, confirm it is legible:
     axes scaled to the data range — not fixed to zero so real movement reads
     as a flat line — the key trend or comparison visible at a glance, and
     units and labels present. A chart that draws a line but hides the trend
     fails its purpose even with no console errors. Name that gap as a defect.
   - When a screen looks broken, triage before reporting: confirm the URL,
     whether `open` landed on `about:blank`, whether the error is a product bug
     or missing local key, and whether direct-loading a client-routed URL needs
     router navigation.
   - When scope allows, also dogfood navigation entry points, empty states,
     loading and error states, mobile viewport, keyboard-only interaction, form
     validation, and basic accessibility signals such as labels, names, focus,
     headings, and image alternatives.

4. Run Backend QA when the changed flow is an API, service, CLI, worker, or
   contract.
   - Start the app with the project's normal local command. Start documented
     local dependencies only when the repo requires them.
   - Record the command, base URL, port, environment, and dependency setup.
   - Find the contract from OpenAPI, GraphQL schema, protobuf definitions,
     route files, controllers, handlers, CLI help, README examples, or the
     plan. Prefer public contracts over implementation internals.
   - Exercise the contract with evidence for:
     1. Health, readiness, or a harmless read endpoint.
     2. Happy path with the smallest realistic payload.
     3. Validation failures: missing required fields, malformed types, invalid
        enum values, and boundary sizes.
     4. Auth or permission failures when auth exists.
     5. Not-found, conflict, or idempotency behavior where the contract implies
        it.
     6. Persistence round trip: create or update, fetch or list, restart or
        refresh if cheap, then verify state remains correct.
     7. Side effects: jobs, emails, webhooks, files, metrics, or audit logs
        when the feature owns them.
   - Capture request and response transcripts in `qa/evidence/<slug>/api/`.
     Redact tokens, cookies, secrets, and personal data. Include status code,
     relevant headers, request body, response body, and the exact command used.
     For GraphQL, include the query or mutation text and variables.
   - After each failure-looking result, triage before reporting: wrong base
     URL, missing migration, missing seed data, absent local secret, clock
     skew, or a contract mismatch. Check logs for stack traces, 5xxs, unhandled
     promise rejections, failed jobs, and unexpected retries.
   - For backend-only work, run the narrow relevant automated test command
     after manual contract checks and include the command and result as
     supporting evidence. Take it from the plan's `## Test Scope`; never
     substitute the full tier, which CI runs on the PR.

5. Clean up.
   - Stop any active recording before closing the browser so the WebM is
     finalized and readable.
   - Close browser sessions or stop background services you started.
   - Keep evidence files that support the report.

## Stop and Ask

STOP and ask before continuing when:

- The target flow or source of truth is ambiguous and cannot be inferred from
  the plan, diff, or user's request.
- Local QA requires credentials, secrets, paid services, destructive production
  actions, or external state the repo does not document.
- The only available path would mutate real user data or send real external
  communications.
- A missing dependency, migration, seed, or service blocks running the app and
  the repo gives no safe local substitute.

If blocked, report the exact command, error, and missing prerequisite. Do not
invent QA coverage from tests or static inspection.

## Red Flags

| Thought | Reality |
|---------|---------|
| "Tests passed, so QA passed." | Tests are supporting evidence; QA needs observed user or contract behavior. |
| "The page showed success, so it worked." | Check console, network-visible failures, persisted state, and downstream views. |
| "It runs with no errors, so it's a SHIP." | Running is necessary, not sufficient. A clean SHIP also requires that the change delivers its stated intent. |
| "The endpoint returned 200 once." | Verify validation, errors, persistence, permissions, and side effects where relevant. |
| "The local setup is broken, but the code looks fine." | That is a blocker or caveat, not a ship verdict. |
| "A finding seems obvious." | Reproduce it and cite evidence from the report. |

## Output

Write the QA report to `qa/<slug>.md` using exactly this shape:

```markdown
# QA: <feature> - <date>

## Verdict: SHIP | DO NOT SHIP | SHIP WITH CAVEATS

## Route
Frontend | Backend | Hybrid, with the reason for that choice.

## TC-01: <name> - PASS/FAIL
Steps:    (numbered, exactly what you did)
Expected: (from the plan)
Actual:   (what happened; quote DOM text, console errors, status codes, or logs)
Evidence: qa/evidence/<slug>/...

## Observations
(environmental noise, local setup caveats, missing keys, and supporting test
commands/results that should not be treated as product defects)
```

A clean SHIP requires both: it works (no functional defects) **and** it delivers
its stated intent (the user can understand or do what the plan promised). When it
runs but does not deliver that intent, the verdict is DO NOT SHIP or SHIP WITH
CAVEATS with the gap named as the caveat — never a clean SHIP.

Failures must be reproducible from the report alone.

Final user response:

```markdown
Verdict: SHIP | DO NOT SHIP | SHIP WITH CAVEATS
Report: qa/<slug>.md
Caveat: <one sentence, only if needed>
```
