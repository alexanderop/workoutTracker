# Browser-mode test consolidation ledger

## Current phase and next action

- Phase: complete; 60 active browser-mode cases removed and every required gate
  passes.
- Next action: hand off the consolidation and evidence ledger for review.
- Target: remove at least 60 active browser-mode cases without removing a
  distinct behavior, regression, boundary, accessibility, or persistence
  guarantee.

## Baseline (2026-07-19)

- Worktree before changes: clean.
- Dependencies: `pnpm install --frozen-lockfile` completed successfully because
  this worktree initially had no `node_modules`.
- Authoritative collection: `pnpm exec vitest list --project=default
  --json=tmp/baseline-list.json` listed 1,351 active cases.
- Coverage run: 165 files passed; 1,351 tests passed and 21 skipped (1,372
  collected). Wall time 227.64 s (`real`), Vitest duration 224.51 s.
- Coverage: 86.22% statements (8,961/10,393), 77.09% branches
  (4,213/5,465), 86.55% functions (3,149/3,638), and 87.82% lines
  (8,323/9,477).
- Raw run logs are retained locally as `tmp/baseline-test.log` and
  `tmp/baseline-coverage.log`; collection JSON was temporary and its counts are
  recorded in this ledger.
- Baseline flake: the first non-coverage `pnpm test` run stopped after 45.14 s
  on a 180 ms keypad click timeout in `benchmark-variable-reps.spec.ts`
  (207 passed, 93 skipped, 1 failed at abort). The unchanged suite then passed
  completely under `pnpm test:coverage`; treat this as a transient existing
  risk and require a clean final `pnpm test` run.

## Highest-confidence duplication clusters

1. CSS drag rendering: nine component-style cases in
   `browser/drag-reorder.spec.ts` repeatedly mount the same block list to assert
   independent classes/attributes; the five template drag tests repeat handle,
   container, and initial-order rendering around the one material persisted
   real-drag journey.
2. Numeric input/set logging: component contracts already exhaust keypad/modal
   mechanics while integration files split single touch-entry and set-completion
   journeys into assertion-sized cases. Confirmation, cancellation, locale,
   zero, clamp, focus-commit, out-of-order editing, and persistence must remain.
3. `BenchmarkExerciseList`: two separate reactive-addition cases repeat the
   same list-update contract at the second and third item; one sequential
   reactivity workflow can retain both checkpoints.
4. Barbell hint: 13 rendering cases repeatedly mount the component for kg/lb
   plate counts, labels, and impossible/empty-bar states. These can become a
   small number of cohesive unit-system, accessible-label, and boundary
   contracts without dropping any assertion.
5. Settings: 26 preference integration cases fragment dark mode, locale, sound,
   units, wake lock, rest defaults, and diagnostics into individual assertions.
   Each preference family can be a cohesive change/persist/navigate-or-reload
   journey while delete cancellation/click-outside and repository live-update
   remain distinct.

## Final verification summary

- Active cases: 1,351 before, 1,291 after; exactly 60 removed (4.44%).
- Total collected: 1,372 before, 1,312 after; the same 21 cases remain skipped.
- Final non-coverage suite: 165 files passed in 161.91 s wall time. The baseline
  non-coverage run flaked before completion, so no defensible runtime delta is
  claimed for this command.
- Final coverage suite: 165 files passed in 236.59 s wall time, versus 227.64 s
  at baseline. Coverage instrumentation/browser load varied across runs, so the
  8.95 s increase is reported rather than attributed to consolidation.
- Aggregate coverage moved from 8,961 to 8,959 statements, stayed at 4,213
  branches, moved from 3,149 to 3,147 functions, and moved from 8,323 to 8,322
  lines. This small summary variance is explained: repeated runs of the same
  consolidated suite ranged from 8,958 to 8,961 statements, 4,212 to 4,213
  branches, 3,146 to 3,148 functions, and 8,321 to 8,322 lines. Controlled V8
  JSON comparisons of the eleven edited specs show zero lost statements,
  branches, functions, or lines versus HEAD.
- No production code, coverage thresholds, or configuration changed.

## Behaviors being consolidated

- Completed: drag handles, sortable structure, disabled state,
  selection/completion styling, connectors, add-button visibility, initial
  order, legacy-arrow absence, real drag, and persisted/reloaded order.
- Completed: benchmark exercise-list reactivity and barbell plate/hint
  rendering, including accessible labels and impossible-load fallback.
- Completed: numeric keypad/modal rendering and events, calculator-style touch
  entry, modal set completion, cancellation, barbell applicability, page-object
  wiring, and confirmed-value persistence.
- Retained as distinct numeric/set cases outside this consolidation: locale
  separator behavior, RIR zero, clamp feedback/commit, missing-value disabling,
  focused commit, decimal persistence, completed/pending editing, and set data
  persistence.
- Completed: settings theme, language, sounds/volume, weight/height units, wake
  lock, and rest-target journeys. Delete cancel, Escape/click-outside data
  preservation, live repository updates, and diagnostics remain distinct.
- Completed: strength block creation/completion/prefill and set-completion
  boundary/focus workflows.
- Retained as distinct: missing-value validation, incomplete-block non-advance,
  end-workout confirmation, all rest-timer cases, completed-value navigation
  persistence, and builder/resume persistence.

## Removed cases mapped to surviving coverage

### Consolidation 1: drag rendering and persisted reorder (9 removed)

| Removed case | Surviving coverage |
| --- | --- |
| `renders drag handles for each block` | `renders an enabled sortable playlist with handles, connectors, and add action` retains the three-handle count |
| `drag handles have grab cursor class` | Same enabled-playlist survivor checks `cursor-grab` on every handle |
| `shows sortable container with ref` | Same enabled-playlist survivor retains the container/children assertions |
| `shows add block button when not disabled` | Same enabled-playlist survivor retains the add-action assertion |
| `renders connectors between blocks` | Same enabled-playlist survivor retains the two-connector assertion |
| `hides add block button when disabled` | `keeps disabled drag handles in layout but hides them and the add action` retains absence of the add action alongside both hidden handles |
| `shows completed blocks with opacity-60` | `exposes selection and completed-block state independently` retains every completed/non-completed class assertion |
| `does not show move up/down arrow buttons (replaced by drag)` | `renders the sortable blocks in order with handles and no legacy arrow controls` retains both negative role assertions |
| `has sortable container with correct structure` and `displays blocks in correct initial order` were folded into one survivor, reducing one additional case | The same template-rendering survivor retains list visibility, handle target classes, card count, and initial DOM order |

Notes: `shows selected block with aria-pressed` is the named survivor for the
selection/completion workflow (renamed as shown above). The real-drag test remains
separate and unchanged in scope, including DOM reorder, database order, and order
after navigation/reload. Original counts were 9 + 5; survivors are 3 + 2.

### Consolidation 2: benchmark list and barbell hint (11 removed)

| Removed case(s) | Surviving coverage |
| --- | --- |
| `BenchmarkExerciseList: updates when third exercise is added` | `reactively appends second and third exercises with their prescribed reps` now checks initial content, the second append, and the third append (including all names and rep labels); empty-list coverage remains separate |
| Empty-bar cases: kg equality, lb equality, below-bar weight, and impossible 21 kg | `shows the unit-specific empty bar at, below, and near an unachievable weight` rerenders through 20 kg, 45 lb, 10 kg, and 21 kg and retains each visible bar-weight assertion (3 cases removed) |
| Plate cases: 60/100 kg, 135/225 lb, labeled 2.5 kg, and labeled 5 kg | `renders representative kg and lb plate loads, including small labeled plates` retains every load and visible plate-label assertion (5 cases removed) |
| Accessibility cases: empty bar, one 20 kg plate, repeated 20 kg plates | `announces empty, single-plate, and multiple-plate barbell states` retains all three role/name assertions (2 cases removed) |

Original counts were 3 + 13; survivors are 2 + 3. No plate calculation was
moved into the component suite; exhaustive plate math remains in
`plateCalculation.spec.ts` and its property suite.

### Consolidation 3: numeric keypad and modal (18 removed)

| Removed case(s) | Surviving coverage |
| --- | --- |
| Component keypad: `renders backspace button` | `renders all digit buttons and the backspace control` retains visibility of 0-9 and the named backspace button |
| Component keypad: `replaces zero with digit...` and `prevents appending zero to zero` | `emits normalized digit updates for existing values and zero` retains existing-value append (25), zero-on-zero no emit, and zero-to-5 replacement |
| Component keypad: `sets to 0 when all digits removed` | `backspaces a multi-digit value and resets a single digit to zero` retains 205→20 and 5→0; max-value enforcement remains separate |
| Modal rendering: `does not render when closed`, button visibility, type title, and contained preset/value/keypad | `renders only when open with type-specific title, unit, presets, value, and keypad` begins closed, opens, and retains every dialog/control/role assertion (4 removed) |
| Modal rendering: smart weight/reps/RIR presets and weight unit | The same rendering survivor rerenders weight→reps→RIR and retains 22.5, 11, 10, and selected `kg` assertions (4 removed) |
| Touch fresh-start: `subsequent digits append...`, `backspace edits existing...`, and `decimal as first input...` | `replaces first input, appends later digits, edits with backspace, and starts decimals at zero` retains exact 70→8, 8→85, 75→7, and existing-value→0.5 checkpoints |
| Touch digit buttons: `appends digits...` and `backspace removes last digit` | `builds single- and multi-digit values and removes the last digit` retains 5, 100, 123, and 123→12 checkpoints; confirmed 85 persistence remains separate |
| Page object: `SetRowPO.fillAndComplete() works in modal mode` | `SetRowPO enters values and completes the set in modal mode` uses `fillAndComplete` (which delegates to `enterValues`) through all three modal triggers, then verifies exact 100/8/2 values and completion |

Original counts were 8 + 14 + 8 + 8; survivors are 4 + 6 + 3 + 7.
The component sub-run initially failed because zero-on-zero was accidentally
checked after entering 5 (which correctly emits 50); the survivor was corrected
to restore the original starting state, then both the component-only and full
four-file focused runs passed. A later full-suite run showed that combining the
touch modal's viewport, unit, and plate interactions could exceed the unchanged
15 s timeout under load. The original open-modal, unit-label, and barbell-hint
cases were restored exactly; the isolated seven-case file then passed. This
deliberate retention reduced the final savings by two cases.

### Consolidation 4: settings journeys (15 removed)

| Removed case(s) | Surviving coverage |
| --- | --- |
| Dark mode: `adds dark class...` and `dark mode preference survives page navigation` | `toggles the document theme, persists it, and survives navigation` retains toggle-state change, localStorage persistence, document class change, and state after away/back navigation |
| Language: `sets html lang attribute...` and `language preference persists to database` | `changes the UI and document language and persists the selection` retains German heading, `html[lang=de]`, and repository value |
| Timer sounds: re-enable, volume persistence, and conditional slider cases | `toggles sounds, controls slider visibility, and persists volume` retains initial enabled state, off/on states and persistence, hidden/visible slider, and 0.7 change persistence (3 removed) |
| Weight unit: reverse kg transition and navigation persistence | `switches both ways, persists, and retains pounds across navigation` retains lbs persistence, away/back selected state, and kg persistence (2 removed) |
| Height unit: reverse cm transition | `switches from cm to ft/in and back, persisting both transitions` retains both repository checkpoints |
| Wake lock: off persistence and re-enable cases | `is visible and enabled by default, then persists off and on transitions` retains visible/default checked, unchecked/false, and checked/true checkpoints (2 removed) |
| Rest timer: 120 persistence, Off persistence, and navigation persistence | `defaults to 90, persists 120 across navigation, and can be disabled` retains default selected 90, repository 120, away/back selected 120, and repository 0 (3 removed) |

Original count was 26; 11 survivors remain. `cancelling delete dialog
preserves all data` and `pressing Escape in delete dialog preserves data` remain
separate because button and keyboard cancellation exit modes are protected.
The live cross-tab repository update and diagnostics expand/collapse contracts
also remain separate.

### Consolidation 5: strength/set completion (7 removed)

| Removed case(s) | Surviving coverage |
| --- | --- |
| Strength workflow: `displays strength block UI and allows completing all sets` and `prefills values from previous set when advancing` | `builds a strength block, prefills later sets, and completes the block` retains the real start/add dialog path, table/heading/type rendering, first-set completion, all-field prefill, second-set count, third-set completion dialog (2 removed) |
| Completion: `pre-fills next set with values from completed set` | `completes a set and prefills the next set with all values` retains completed state and exact weight/reps/RIR prefill |
| Completion: `auto-advances to next block when all sets are complete` | `can complete multiple sets in sequence` retains initial block 1, two-set count, final-set action, block 2 auto-advance, and Deadlift rendering |
| Boundary: `completes set with RIR of 0 (training to failure)` | `completes consecutive sets with zero weight and zero RIR boundaries` retains separate completed-state checkpoints for weight 0 and RIR 0 |
| Focus timing: single-tap completion and typed-value persistence cases | `enables one-tap completion while focused and persists the typed values` retains the enabled footer check while RIR is focused, one row-checkmark tap, completed state, and exact persisted 60/10/2 values (2 removed) |

Original counts were 3 + 19; survivors are 1 + 14. Protected timer,
persistence, missing-field, incomplete-block, and explicit end-workout cases were
not merged.

### Renamed anchor survivors (26 names changed, zero additional reduction)

The final collection name diff contains 86 old names because 26 retained anchor
cases were renamed to describe their broader cohesive workflow. The 60-case
numerical reduction is `1,351 - 1,291`; these renamed anchors account for the
difference between the 86 missing old names and the 60 fewer collected cases.

| Original anchor name | New surviving name |
| --- | --- |
| `BenchmarkExerciseList: updates the list when new exercises are added` | `reactively appends second and third exercises with their prescribed reps` |
| Drag: `renders drag handles for each block` | `renders an enabled sortable playlist with handles, connectors, and add action` |
| Drag: `hides drag handles with opacity-0 when disabled` | `keeps disabled drag handles in layout but hides them and the add action` |
| Drag: `shows selected block with aria-pressed` | `exposes selection and completed-block state independently` |
| Template drag: `shows drag handle on each block for reordering` | `renders the sortable blocks in order with handles and no legacy arrow controls` |
| Barbell: kg empty-bar equality | `shows the unit-specific empty bar at, below, and near an unachievable weight` |
| Barbell: 60 kg plate rendering | `renders representative kg and lb plate loads, including small labeled plates` |
| Barbell: accessible empty-bar label | `announces empty, single-plate, and multiple-plate barbell states` |
| Modal component: `renders as fullscreen dialog when open` | `renders only when open with type-specific title, unit, presets, value, and keypad` |
| Keypad component: `renders all digit buttons 0-9` | `renders all digit buttons and the backspace control` |
| Keypad component: `emits update when digit is pressed` | `emits normalized digit updates for existing values and zero` |
| Keypad component: `removes last digit on backspace` | `backspaces a multi-digit value and resets a single digit to zero` |
| Touch modal: `SetRowPO.enterValues() works in modal mode` | `SetRowPO enters values and completes the set in modal mode`; the survivor exercises `enterValues` through `fillAndComplete`, then verifies exact 100/8/2 values and completion |
| Touch keypad: `first digit replaces existing value instead of appending` | `replaces first input, appends later digits, edits with backspace, and starts decimals at zero` |
| Touch keypad: `updates value when tapping digit button` | `builds single- and multi-digit values and removes the last digit` |
| Settings: `toggles dark mode and persists preference` | `toggles the document theme, persists it, and survives navigation` |
| Settings: `changes language and updates UI text` | `changes the UI and document language and persists the selection` |
| Settings: `timer sounds can be toggled off and persists` | `toggles sounds, controls slider visibility, and persists volume` |
| Settings: `switches from kg to lbs and persists` | `switches both ways, persists, and retains pounds across navigation` |
| Settings: `switches from cm to ft/in and persists` | `switches from cm to ft/in and back, persisting both transitions` |
| Settings: `screen wake lock toggle is visible and defaults to enabled` | `is visible and enabled by default, then persists off and on transitions` |
| Settings: `defaults to 90 seconds` | `defaults to 90, persists 120 across navigation, and can be disabled` |
| Strength: `advances to the next set after completing a set` | `builds a strength block, prefills later sets, and completes the block` |
| Completion: `completes set and shows completed badge` | `completes a set and prefills the next set with all values` |
| Completion: `completes set with 0 weight for bodyweight exercises` | `completes consecutive sets with zero weight and zero RIR boundaries` |
| Focus: footer CTA enabled while last input is focused | `enables one-tap completion while focused and persists the typed values` |

## Command results

| Phase | Command | Result |
| --- | --- | --- |
| Environment | `pnpm install --frozen-lockfile` | Pass (11.3 s) |
| Baseline | `pnpm test` | Transient existing click-timeout flake; 45.14 s wall |
| Baseline collection | `pnpm exec vitest list --project=default --json=tmp/baseline-list.json` | Pass; 1,351 active cases |
| Baseline coverage | `pnpm test:coverage` | Pass; 1,351 passed, 21 skipped; 227.64 s wall; coverage recorded above |
| Consolidation 1 focused | `pnpm exec vitest run --project=default src/__tests__/browser/drag-reorder.spec.ts src/__tests__/integration/template-drag-reorder.spec.ts` | Pass; 2 files, 5 tests; 4.11 s Vitest duration |
| Consolidation 2 focused | `pnpm exec vitest run --project=default src/__tests__/components/BenchmarkExerciseList.spec.ts src/__tests__/components/barbell-hint/BarbellPlateHint.spec.ts` | Pass; 2 files, 5 tests; 2.99 s Vitest duration |
| Consolidation 3 component attempt | Numeric component files | Failed 1 assertion due to non-equivalent ordering (zero after 5); corrected before continuing |
| Consolidation 3 component corrected | Numeric component files | Pass; 2 files, 10 tests; 4.49 s Vitest duration |
| Consolidation 3 focused | Four numeric component/integration files before retained split | Pass; 4 files, 18 tests; 18.92 s Vitest duration |
| Consolidation 4 focused | `pnpm exec vitest run --project=default src/__tests__/integration/settings-preferences.spec.ts` | Pass; 1 file, 11 tests; 5.15 s Vitest duration |
| Consolidation 5 focused | `pnpm exec vitest run --project=default src/__tests__/integration/strength-workflows.spec.ts src/__tests__/integration/workout-set-completion.spec.ts` | Pass; 2 files, 15 tests; 19.75 s Vitest duration |
| Pre-retention collection | `pnpm exec vitest list --project=default --json=tmp/final-list.json` | Pass; 1,289 active cases; superseded after the timeout-driven retention |
| Final static | `pnpm type-check` | Pass; 11.93 s wall |
| Final lint | `pnpm lint` | Pass; 15.35 s wall; Markdown and design tokens clean |
| Full test attempt | `pnpm test` | Failed on merged touch-modal case at unchanged 15 s timeout; 501 passed before abort; case split back into original contracts |
| Retained touch-modal focused | `pnpm exec vitest run --project=default src/__tests__/integration/numeric-input-modal.spec.ts` | Pass; 1 file, 7 tests; 20.17 s Vitest duration |
| Final full test | `pnpm test` | Pass; 165 files, 1,291 passed, 21 skipped (1,312 collected); 156.37 s wall |
| Final coverage attempt 1 | `pnpm test:coverage` | Failed on an unchanged numeric-input viewport assertion and unrelated queue-cleanup rejections; rerun unchanged |
| Final coverage attempt 2 | `pnpm test:coverage` | Failed on untouched `benchmark-gap-flows` at the unchanged 15 s timeout after 894 passed; rerun unchanged |
| Final coverage attempt 3 | `pnpm test:coverage` | Pass; 165 files, 1,291 passed, 21 skipped; 211.49 s wall; aggregate delta investigated below |
| Focused coverage comparison | JSON V8 coverage for the 11 edited specs at HEAD vs consolidated state | Ten stable specs had identical execution maps; touch-modal survivor initially missed three statements, one branch, two functions, and one line in `WorkoutActiveStrengthView.vue` |
| Corrected touch-modal coverage | JSON V8 coverage for `numeric-input-modal.spec.ts` at HEAD vs consolidated state | Pass; zero lost statements, branches, functions, or lines with the final three-modal `fillAndComplete` survivor |
| Final coverage attempt 4 | `pnpm test:coverage` | Failed at unchanged 15 s timeout because the six-modal coverage correction was too long under full-suite load; survivor shortened to one three-modal `fillAndComplete` workflow |
| Final coverage | `pnpm test:coverage` | Pass; 165 files, 1,291 passed, 21 skipped; 236.59 s wall; 86.20% statements, 77.09% branches, 86.50% functions, 87.81% lines |
| Final full test after correction | `pnpm test` | Pass; 165 files, 1,291 passed, 21 skipped (1,312 collected); 161.91 s wall |
| Final type-check | `pnpm type-check` | Pass; 11.44 s wall |
| Final lint | `pnpm lint` | Pass; 12.06 s wall; Markdown and design tokens clean |

## Unresolved risks or blockers

- No completion blockers remain.
- Existing 180 ms browser click timeout can abort a run under load; the final
  suite passed without weakening the timeout or changing production behavior.
- Existing 15 s end-to-end browser timeouts can also surface under coverage
  instrumentation; two unrelated/untouched cases have flaked during final
  coverage attempts. The final unchanged suite passed.
- Vitest's JSON list excludes the 21 skipped cases. Reduction accounting uses
  active cases (baseline 1,351) and also reports total collected where available.
- Coverage equivalence is assessed by retained assertions plus final aggregate
  coverage. The first passing final aggregate showed a small delta; line-level
  before/after JSON isolated it to the combined page-object workflow, and the
  survivor was strengthened until its execution map had zero losses.
- Achieved reduction: 60 active cases (1,351 to 1,291; 4.44%).

## Files changed

- `src/__tests__/browser/drag-reorder.spec.ts`
- `src/__tests__/components/BenchmarkExerciseList.spec.ts`
- `src/__tests__/components/barbell-hint/BarbellPlateHint.spec.ts`
- `src/__tests__/components/numeric-input/NumericInputModal.spec.ts`
- `src/__tests__/components/numeric-input/NumericKeypad.spec.ts`
- `src/__tests__/integration/numeric-input-modal.spec.ts`
- `src/__tests__/integration/numeric-keypad.spec.ts`
- `src/__tests__/integration/settings-preferences.spec.ts`
- `src/__tests__/integration/strength-workflows.spec.ts`
- `src/__tests__/integration/template-drag-reorder.spec.ts`
- `src/__tests__/integration/workout-set-completion.spec.ts`
- `tmp/markdown.md` (this ledger)

## Remaining consolidation opportunities

- Further set-context/options merging was deliberately retained because
  keyboard, long-press/touch, duplicate/delete, and confirmation paths are
  materially distinct.
- Timer, audio, wake-lock, converter/property, visual/viewport, accessibility,
  retry/error, and persistence suites remain intentionally exhaustive or at
  their appropriate pure-function/composable layer.
- Additional numeric locale, clamp, cancellation, and out-of-order edit cases
  remain separate because the focused evidence did not establish defensible
  equivalence.
