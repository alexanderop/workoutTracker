# QA Report — PR: auto-start rest timer + resume in-progress workout

**Date**: 2026-04-12
**Tester**: Quinn (QA)
**Verdict**: MINOR_ISSUES

## Summary

Verified the core PR claims end-to-end: auto-rest starts after logging a strength set, mid-workout reload restores the same block/set with logged sets intact, the Workouts view shows a resume affordance, finishing clears it, and AMRAP blocks are unaffected. One acceptance criterion (block-configured rest duration) could not be fully verified because no per-block rest-duration configuration UI was discoverable from the template editor or the in-workout edit dialog.

## Acceptance Criteria

| # | AC | Result |
|---|----|--------|
| 1 | Start workout lands on strength block with set inputs | PASS |
| 2 | Auto rest countdown appears after logging a set | PASS |
| 3 | Rest duration matches block-configured seconds | SKIP (no rest-config UI found) |
| 4 | Reload mid-workout resumes same block/set with logged sets | PASS |
| 5 | Workouts view has Resume affordance that reopens same workout | PASS |
| 6 | Finishing clears the Resume affordance | PASS |
| 7 | AMRAP blocks still render their own timer, no strength rest injected | PASS |

## Evidence

- After logging set 1 of Goblet Squat (20 kg × 12), a `REST 0:04` countdown rendered above the bottom bar and ticked down — no manual "start rest" tap required.
- Reload at `/workout/active` showed a Resume Workout dialog. Resuming returned to Block 2 of 6 (Military Press) and Block 1 still showed all three logged sets (20 × 12, 20 × 12, 20 × 12) with green checkmarks. Workout duration continued from ~3:34 to 4:04.
- Workouts view showed a purple floating pill in the bottom-right with the running duration (`4:33`) labelled "Return to active workout" — clicking it navigated back to `/workout/active` for the same workout (same block/set).
- After End Workout → Finish Workout, the floating resume pill no longer appeared on the Workouts view.
- Created a new AMRAP template (10 min, Burpees) → starting it rendered the dedicated AMRAP circular timer (`10:00`, `0 ROUNDS`, `+1`, Start) with no strength-style rest countdown.

## Bugs / Observations

### Minor — No discoverable UI to configure per-block rest duration
- **Severity**: Minor
- **Steps**: Workouts → open `goku` template → tap "Edit Goblet Squat" → dialog only exposes *Target Reps* and *Number of Sets*. No field for rest seconds. Template block editor also has no rest field.
- **Expected**: Per the PR's AC3, a user should be able to "configure a non-default rest (e.g. 17s or 23s) on the block and observe the initial countdown value." Either a control is missing, or its location is not discoverable from obvious entry points (template edit / in-workout edit).
- **Actual**: Auto-rest does trigger and count down, but the configured duration cannot be verified via the UI.
- **Impact**: AC3 cannot be confirmed. The rest behavior may be correct internally, but manual verification via the UI is blocked.

### Suggestion — Set "logged" state not exposed to accessibility
- **Severity**: Suggestion
- All rows in the set table use the same aria-label `Mark set N complete` whether the set is logged or not; visually set rows turn green, but a screen-reader user cannot distinguish logged vs unlogged sets. The `Status` column cell also lacks an `aria-pressed`/`aria-checked` state.

## Console
- Only `WakeLock` permission warnings and one Dexie "Another connection wants to delete database" warning during fresh-load. No JS errors.

## Tool-sync note
- `agent-browser fill` on spinbuttons sometimes did not wire through v-model reactivity until an additional ArrowUp/Down key was pressed. Worked around by using arrow-key nudges. Not a product bug.

## Confidence
- High on AC1, AC2, AC4, AC5, AC6, AC7.
- Low on AC3 — rest-configurability UI not found; reported as a minor finding rather than a critical failure because the auto-rest itself clearly works.
