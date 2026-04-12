# QA Report — PR: auto-start rest timer + resume in-progress workout

**Verdict**: MINOR_ISSUES
**Date**: 2026-04-12

## Summary

Core feature works: rest auto-starts after logging a strength set, reload resumes the same workout with logged sets preserved, and finishing clears the resume affordance. AMRAP blocks are unaffected. Two minor issues observed (accessibility of the rest timer, a "0 blocks" copy bug in the resume dialog), and AC3 (configurable rest seconds per block) is unverifiable — no such UI affordance exists anywhere in template editor, active workout, or Settings, so marked SKIP (fixture contract gap).

## Acceptance Criteria

| # | AC | Result | Evidence |
|---|----|--------|----------|
| 1 | Strength block view with logged-set inputs | PASS | Bench Press block rendered with spinbuttons "Weight/Reps/RIR for set 1..3" and "Mark set N complete" buttons |
| 2 | Auto rest countdown appears on log-set | PASS | After clicking "Mark set 1 complete" → "Complete Set", footer showed `Rest 0:07` counting down (observed via `eval`) — no manual start required |
| 3 | Rest duration matches block-configured seconds | SKIP | **Affordance not discoverable** — no rest-seconds input in template editor, "Edit Sets & Reps" dialog (only Target Reps + Number of Sets), workout options menu, or Settings. Fixture contract gap, not a product bug. |
| 4 | Reload mid-workout resumes same state | PASS | Reloaded after logging 2 sets → "Resume Workout?" dialog → workout reopened on same Strength block with both sets still shown logged (empty # cell = checkmark) |
| 5 | Workouts view shows Resume affordance | PASS (with caveat) | Global "Return to active workout" button visible at bottom of Workouts view while in-progress workout exists; tapping it reopened the same workout (same Bench Press state). Appears to be a global footer rather than a Workouts-page-specific banner. |
| 6 | Finishing clears Resume affordance | PASS | After Finish Workout → summary view → Workouts view: no "Return to active workout" button present |
| 7 | AMRAP regression — own timer, no rest injection | PASS | AMRAP block rendered `AMRAP 10:00 / 0 Rounds / +1 / Pause`; `document.body.innerText.match(/rest/i)` returned **null** — no strength-rest countdown leaked in |

## Bugs / Observations

### Minor — Rest timer not exposed to accessibility tree
- **Severity**: minor (accessibility)
- **Description**: The auto-started rest countdown renders as plain `<span>Rest</span>` + text `0:07` in a footer div. It has no `role="timer"`, no `aria-label`, no `aria-live`. Screen-reader users receive no announcement that a rest countdown has started, nor its remaining time.
- **Steps to reproduce**:
  1. Start workout with strength block
  2. Log a set (fill weight, reps, mark complete, click Complete Set)
  3. Inspect the footer region
- **Expected**: countdown exposed as `role="timer"` with `aria-label="Rest timer"` and `aria-live="polite"` (similar pattern to `timer "Workout duration"` which IS exposed correctly)
- **Actual**: rest timer only visible to sighted users; `snapshot -i` (accessibility tree) shows no rest element, only `eval` finds it in the DOM

### Minor — Resume dialog says "with 0 blocks"
- **Severity**: minor (copy/count bug)
- **Description**: After reload, the resume dialog reads: "You have an unfinished workout: **\[template name\]** with 0 blocks". The template I built had exactly 1 block (Bench Press strength). "0 blocks" is wrong.
- **Expected**: "with 1 block" (or the actual block count)
- **Actual**: always says "with 0 blocks"
- Dialog otherwise functions correctly — Resume Workout button restores state.

### Minor — "Resume" is a global footer, not a Workouts-view banner
- **Severity**: minor / spec mismatch
- **Description**: PR body says "A small 'Resume' banner appears on the Workouts view". What's actually rendered is a global "Return to active workout" button pinned above the bottom navigation, visible on every route (Workouts, Settings, etc.), not specific to Workouts view. Functional outcome is equivalent (user can reopen workout), but it's not a page-local banner.
- Classifying as minor — user flow works, AC5 technically satisfied, but wording in PR doesn't match implementation.

## Accessibility findings

- **Rest timer missing ARIA**: see bug above. This is the main a11y finding.
- **Workout duration timer** at the top IS correctly exposed: `timer "Workout duration": 2:50` — good reference pattern; apply same approach to rest timer.
- **Set-logged state** — after a set is marked complete, the row's `#` cell becomes empty (presumably a visual checkmark icon) but the button accessible name stays "Mark set N complete". A screen reader user cannot tell set 1 is already logged. Consider updating button accessible name to "Set 1 logged — tap to undo" or similar once complete, and/or adding `aria-pressed="true"`.
- **Strength block rest region** needs a landmark or heading so SR users can navigate to it quickly.

## Edge cases / Regression probes

| Test | Result | Note |
|------|--------|------|
| Reload mid-workout, 2 sets already logged | PASS | Both logged sets restored |
| Resume from global footer → reopen same workout id | PASS | No duplicate workout created |
| AMRAP block start — no rest leakage | PASS | `innerText` regex for /rest/i returned null on AMRAP view |
| Finish clears resume | PASS | Footer button removed |

Not attempted (turn budget): mobile viewport check, rapid finish/reload race, visibility-hidden wake-lock double-start.

## Console

- `agent-browser errors` returned empty — no JS errors captured during the run.

## Confidence

| AC | Confidence | Note |
|----|-----------|------|
| 1 | High | Directly observed |
| 2 | Medium-High | Rest countdown confirmed via DOM text read; not via a11y tree (see bug) |
| 3 | N/A | SKIP — fixture gap |
| 4 | High | Reload → Resume → both logged sets still present |
| 5 | Medium | Affordance exists and works; semantic/placement differs from PR description |
| 6 | High | Confirmed absent after finish |
| 7 | High | No rest text in AMRAP DOM |

Overall: **MINOR_ISSUES** — feature works and no user is blocked. Main issues are a missing rest-timer a11y contract and a "0 blocks" copy bug in the resume dialog. AC3 cannot be verified until a rest-seconds input is exposed somewhere in the UI.
