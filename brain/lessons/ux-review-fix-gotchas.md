---
type: Lesson
title: Gotchas from fixing the 2026-07-04 UX review
description: Enum drift prevention, reka-ui NumberField/DropdownMenu traps, autofocus tap-stealing in sheets, and deleteAll scope vs backup scope.
resource: brain/lessons/ux-review-fix-gotchas.md
tags: [lesson, reka-ui, zod, i18n, dexie, a11y, touch]
timestamp: 2026-07-04T18:00:00Z
---

## Gotchas from Fixing the 2026-07-04 UX Review

Learned while fixing all findings in
[the UX/UI review](../reference/reviews/ux-ui-review-2026-07-04.md). Each of
these caused a real, shipped bug or a real test failure.

### Zod enums must derive from the TS union, or they drift

The import validation enums in `src/features/settings/utils/validation/`
drifted from `src/types/exercises.ts` (missing `isometric`, `battle-rope`),
which made the app's own export fail its own import. Fix pattern in
`primitiveSchemas.ts`: `enumValuesFrom<Union>(record: Record<Union, true>)` —
TS checks the record bidirectionally (missing or extra keys fail
`type-check`), and a `for...in` loop over `Record<Union, true>` narrows keys
to `Union` with no cast (`Object.keys()` would return `string[]`). Never
hand-copy an enum list; there was a second hand-written copy in
`blockConfigSchemas.ts` too.

### reka-ui NumberField commits on blur/Enter only

`@input` on `NumberFieldInput` only updates its internal display buffer; the
model value commits on blur. Consequences:

- Any computed reading store state (footer CTA, row checkmark) is stale while
  an input is focused — and a `disabled` button can never receive the click
  that would flush the input. Deadlock.
- Do NOT force commit-on-input: reformatting mid-keystroke breaks decimal
  entry ("60." becomes "60").
- Pattern used in `WorkoutActiveMode.vue`/`WorkoutActiveStrengthView.vue`: a
  live-typed-values shadow buffer (fed by a delegated `@input` listener, keyed
  by set id) drives enablement, and action handlers blur
  `document.activeElement` first, then re-fetch the target object fresh by id
  (immutable updates replace objects, so captured refs go stale).

### reka-ui DropdownMenu testing traps

- `DropdownMenuContent` gets `aria-labelledby` pointing at the trigger, which
  beats any `aria-label` on the content — the menu's accessible name is the
  trigger's label. Don't assert a static menu name.
- A modal dropdown calls `hideOthers()` and sets
  `document.body.style.pointerEvents = 'none'`, so role-based "click outside"
  helpers can't find anything. Dispatch a raw `pointerdown` on
  `document.body` instead; the dismissable layer still sees it.

### `autofocus` in a mobile bottom sheet steals the first tap

`ExercisePickerContent.vue`'s search `autofocus` popped the on-screen keyboard
as the sheet opened, reflowing the list under the user's finger → silent
tap-miss (the review's "tap Bench Press does nothing" critical). Suppress
autofocus on touch devices (`useTouchDevice()`); keep it for desktop. Also:
any add-action should confirm via toast (`src/stores/toast.ts` +
`ToastViewport.vue`) so failures can never be silent.

### deleteAll scope is not backup scope

`dataManagement.ts` now has two table lists: `backupTables` (export/import
format) and `allTables` (full wipe = backup tables + progressions +
progressionSessions). When adding a table to the Dexie schema, decide which
list(s) it joins — a table missing from `allTables` survives Settings →
Delete All Data. Also: `deleteAllData()` in `src/db/index.ts` passes
`preserveOnboarding: false`; the repository default preserves it.

### Timers must compute from timestamps, not tick counts

The rest timer (`useRestTimer.ts`) computes `elapsed = now - startedAt`
(+ paused duration). Interval ticks get throttled when the screen sleeps
under wake-lock fallback, so accumulating ticks drifts. Any new timer should
follow this pattern.

### Misc

- Calendar week start: `CalendarRoot` needs `:week-starts-on="1"` to match the
  date-fns Monday convention used by the Home week strip.
- Chromium strips implicit table ARIA roles when a row is `display: flex` —
  role-based columnheader queries silently pass/fail wrong; scope queries to
  the dialog and match text.
- Per-route titles: `RouteMeta.titleKey` is typed as
  `keyof MessageSchema['nav']['pageTitles']` (not `string`) so vue-i18n `t()`
  overloads and typos fail at compile time.
