# Agent Browser QA Report

Date: 2026-06-21
App URL: http://localhost:5174/
Method: `agent-browser` CLI plus repo gates
Verdict: Pass

## Summary

Manual browser QA covered first load/onboarding, home, exercises, active workout, timers, weight, settings, workouts hub, template create/detail/start flow, benchmark create/detail/active flow, progression create/detail/session flow, and log-past-workout blank save/history round-trip. Automated gates passed after fixes:

- `pnpm type-check`
- `pnpm lint`
- `pnpm test`

## Fixed Bugs

### BUG-001: Weight chart render warning with a single entry

Status: Fixed and retested.

Evidence:

- Before fix: `tmp/qa-agent-browser/logs/14-settings-console.txt` contained Vue render/update warnings in `WeightChart`.
- Retest: `tmp/qa-agent-browser/logs/15-weight-retest-console.txt` has no `WeightChart`, `Vue warn`, `Unhandled`, or `intlify` warnings.
- Screenshot: `tmp/qa-agent-browser/screenshots/15-weight-retest.png`.

Fix:

- `src/features/weight/components/WeightChart.vue` now renders a single-entry fallback instead of mounting the Unovis line chart with only one data point.
- Added `weight.singleDataPoint` copy in English and German.

### BUG-002: Missing exercise form i18n keys

Status: Fixed.

Evidence:

- Before fix: `tmp/qa-agent-browser/logs/14-settings-console.txt` contained missing keys for `exercises.form.saveError` and `exercises.form.saveErrorTitle`.
- Retest: no i18n warnings in `tmp/qa-agent-browser/logs/15-weight-retest-console.txt`.

Fix:

- Added `exercises.form.saveError` and `exercises.form.saveErrorTitle` in English and German.

### BUG-003: Missing common options i18n key

Status: Fixed and retested.

Evidence:

- Before fix: `tmp/qa-agent-browser/logs/deep-05-benchmark-console.txt` warned that `common.buttons.options` was missing.
- Retest: `tmp/qa-agent-browser/logs/deep-26-benchmark-options-retest.txt` shows the button as `Options`, and `tmp/qa-agent-browser/logs/deep-26-benchmark-options-console.txt` is clean.

Fix:

- Added `common.buttons.options` in English and German.

### BUG-004: Unlabeled progression icon buttons

Status: Fixed and retested.

Evidence:

- Before fix: progression detail/session snapshots exposed unnamed buttons in `tmp/qa-agent-browser/logs/deep-09-progression-detail.txt` and `tmp/qa-agent-browser/logs/deep-10-progression-session.txt`.
- Retest: `tmp/qa-agent-browser/logs/deep-29-progression-detail-label-retest.txt` shows `Delete progression`, and `tmp/qa-agent-browser/logs/deep-30-progression-session-label-retest.txt` shows `Tap to start`.

Fix:

- Added an accessible label for the progression delete icon button.
- Added an accessible label for the circular progression-session start button.

### BUG-005: Finish dialog duration model accepted only numbers

Status: Fixed and retested.

Evidence:

- Before fix: `tmp/qa-agent-browser/logs/test-final-current.log` contained a Vue prop warning for `WorkoutFinishDialog` receiving `durationMinutes=""`.
- Retest: `tmp/qa-agent-browser/logs/test-final-after-duration-fix.log` has no `durationMinutes`, `Invalid prop`, `WorkoutFinishDialog`, or `Vue warn` matches.

Fix:

- `src/components/WorkoutFinishDialog.vue` now allows the transient empty-string state produced by clearing a `v-model.number` input, then normalizes to numeric seconds on confirm.
- Documented the pattern in `brain/reference/VUE_STYLE_GUIDE.md`.

## Test Cases

| ID | Area | Result | Evidence |
|---|---|---|---|
| TC-01 | Fresh first load / onboarding | Pass | `logs/01-onboarding-snapshot.txt`, `screenshots/01-onboarding.png` |
| TC-02 | Home/dashboard | Pass | `logs/02-home-snapshot.txt`, `screenshots/02-home.png` |
| TC-03 | Exercise list/create | Pass | `logs/05-exercise-created-snapshot.txt`, `screenshots/05-exercise-created.png` |
| TC-04 | Timers AMRAP preset/start | Pass | `logs/10-timer-amrap-started.txt`, `screenshots/09-timer-amrap-running.png` |
| TC-05 | Weight add entry | Pass after fix | `logs/15-weight-retest-snapshot.txt`, `screenshots/15-weight-retest.png` |
| TC-06 | Settings controls | Pass | `logs/14-settings-toggled.txt` |
| TC-07 | Active workout builder/active mode | Pass with CLI caveat | `logs/30-active-workout-started.txt`, `screenshots/30-active-workout-started.png` |
| TC-08 | Workouts hub tabs | Pass | `logs/32-workouts-after-discard.txt`, `logs/33-workouts-benchmarks-tab.txt`, `logs/34-workouts-progressions-tab.txt` |
| TC-09 | Benchmark create/detail/active | Pass after i18n fix | `logs/deep-04-benchmark-exercise-added.txt`, `logs/deep-05-benchmark-detail.txt`, `logs/deep-06-benchmark-active.txt`, `logs/deep-26-benchmark-options-retest.txt` |
| TC-10 | Progression create/detail/session | Pass after a11y fix | `logs/deep-09-progression-detail.txt`, `logs/deep-10-progression-session.txt`, `logs/deep-29-progression-detail-label-retest.txt`, `logs/deep-30-progression-session-label-retest.txt` |
| TC-11 | Log past workout blank save/history/detail | Pass | `logs/deep-20-log-past-builder-empty.txt`, `logs/deep-21-log-past-builder-with-block.txt`, `logs/deep-22-history-after-log-past-save.txt`, `logs/deep-25-workout-detail-role-click.txt` |
| TC-12 | Template create/detail/start workout | Pass | `logs/deep-33-template-block-added.txt`, `logs/deep-34-template-detail.txt`, `logs/deep-35-template-start-active.txt`, `screenshots/deep-35-template-start-active.png` |

## Observations

- `agent-browser --profile` was ignored while a daemon was already running; closing all sessions and reopening without the stale custom profile fixed the blank-page symptom.
- Custom `--profile` paths also reproduced empty `#app` mounts in this project while plain `--session` mode worked. This is documented in `brain/reference/TIL-agent-browser-qa-gotchas.md`.
- `agent-browser click @ref` was unreliable inside long scrollable picker/card surfaces. DOM `click()` from page context successfully added `QA Sled Push` to the workout, while `agent-browser click @e138` closed the dialog without adding. I treated this as a CLI/ref caveat because the same product handler worked via DOM click and direct composable state showed the block added.
- The global resume-workout dialog correctly appeared after an active workout existed and could be resumed/discarded.

## Automated Gate Results

- `pnpm type-check`: pass (`logs/type-check-final-after-duration-fix.log`)
- `pnpm lint`: pass with existing warnings only (`logs/lint-final-after-duration-fix.log`)
- `pnpm test`: pass, 91 files / 830 tests / 21 skipped (`logs/test-final-after-duration-fix.log`)
- `pnpm lint:md`: pass after final report update (`logs/lint-md-final-final.log`)

## Residual Risk

No known product bugs remain from this QA pass. The only caveat is `agent-browser` tooling behavior on custom profiles and some generated refs; the product flows were verified with exact DOM clicks where refs were unreliable.
