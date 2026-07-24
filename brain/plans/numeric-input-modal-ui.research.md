---
slug: numeric-input-modal-ui
git_commit: 3d77b4b
branch: claude/ui-improvement-discussion-dmf48f
date: 2026-07-24
---

# Research: Numeric input modal (weight picker) UI

**Research value: high** — grounds the blast-radius decision (the modal is shared
by five input types and ~7 call sites, not just bodyweight) and pins the
wheel/keypad disconnect the screenshot shows to specific code.

## Summary

The screen in question is `NumericInputModal`, a fullscreen dialog used on touch
devices for all numeric entry in the app. It composes three parts vertically:
a scrollable preset list ("wheel"), a value display row with a confirm button,
and a custom 12-key keypad. It is not weight-specific: one `type` prop selects a
preset config for `weight | reps | rir | duration | distance`, and it is opened
from bodyweight entry, active-workout set rows, benchmark forms, cardio block
config, and habit forms. Any UI change to the modal ripples across all of those.

The modal keeps an `internalValue` that only commits to the caller on confirm —
except preset taps, which commit and close instantly. The preset list is
generated once from the *external* value (±range around the last saved value),
not from `internalValue`, so typing on the keypad neither regenerates nor
re-centers the list; a typed off-step value (e.g. 115.3 against a 2.5-step list)
matches no preset, so nothing is highlighted and the list stays centered on the
old value — exactly the state visible in the screenshot (list shows 77.5–95 kg
while the display reads 115.3 kg).

The OS keyboard is never involved (custom keypad, no native input), so the
2026-07-19 mobile-keyboard research and `--keyboard-inset` infrastructure do not
apply to this dialog.

## Findings

### Component chain and call sites

`WeightEntryForm` (`src/features/weight/components/WeightEntryForm.vue:82-133`)
renders a tap-target button on touch devices that opens `NumericInputModal`
with `type="weight"`; desktop gets an inline `NumberField` instead, gated by
`useTouchDevice`. The modal itself lives in
`src/components/ui/numeric-input/NumericInputModal.vue` and composes
`NumericPresetList`, `NumericValueDisplay`, and `NumericKeypad` from the same
directory. Other callers (grep, exhaustive): `WorkoutActiveStrengthView.vue`
(set logging — weight/reps/RIR), `BenchmarkDetailView.vue`,
`CreateBenchmarkView.vue`, `ConfigureCardioDialog.vue` (duration/distance),
`HabitForm.vue`. Preset behavior per type is a static config table in
`useNumericInput.ts:45-81` (weight: step 2.5, range ±40, max 999, decimals
allowed).

### Wheel/keypad disconnect

`presets` is computed from the external `modelValue`, not the editing
`internalValue` (`NumericInputModal.vue:52-55`), so keypad input never
regenerates the list. `NumericPresetList` watches its model and calls
`scrollIntoView` on the element with `data-selected="true"`
(`NumericPresetList.vue:32-44`), but selection is strict equality
(`value === modelValue`, line 60-64), so an off-step typed value (115.3) selects
nothing — no highlight, no scroll, list remains centered on the last saved
value. The list itself is a plain `ScrollArea` of 48px-tall buttons (up to 33
items for weight: ±40 at step 2.5) with no scroll-snap, no center indicator, and
no gradient/fade affordance — visually a list, not a wheel.

### Two commit models in one modal

A preset tap applies the value and closes immediately
(`NumericInputModal.vue:73-77`), while keypad edits stay internal until the
check button fires `handleConfirm` (`:68-71`). Cancel discards internal edits.
So the confirm button is only required for one of the two input paths.

### Keypad editing model

`NumericKeypad` keeps a string representation for decimal editing with a
"fresh start" calculator mode: the first digit after opening replaces the whole
value instead of appending (`NumericKeypad.vue:33-71`). Decimal separator is
locale-aware via `useNumberLocale`; backspace exits fresh-start mode. Max 2
decimals, max clamp from config.

### Layout and visual state

The dialog is fullscreen (`h-[100dvh] w-screen`, `NumericInputModal.vue:89`)
with a Cancel/title header, flex-1 preset area, a value row (3xl bold value,
56px round confirm button, optional `BarbellPlateHint` for barbell weight
entry — `NumericValueDisplay.vue:41-77`), and the keypad in a bottom section.
Preset buttons are `max-w-[200px]` centered, so on a phone ~40% of the row
width is dead space either side.

### i18n gap in titles

The modal title is a hardcoded English record (`Weight`, `Reps`, `RIR`,
`Duration`, `Distance`) in `NumericInputModal.vue:57-66`, while the Cancel
button in the same file goes through `t('common.buttons.cancel')`. A German
locale exists (`src/i18n/messages/de/`).

### Testing patterns

The area is well covered by browser-mode integration tests:
`src/__tests__/integration/numeric-input-modal.spec.ts`,
`numeric-keypad.spec.ts`, `weight-tracking-mobile.spec.ts`,
`locale-decimal-input.spec.ts`, `rir-zero-value.spec.ts`,
`cardio-mobile-config.spec.ts`, with page objects
`NumericInputModalPO.ts` / `SetRowPO.ts` and a `mockTouchDevice.ts` helper.
Unit specs: `useNumericInput.spec.ts`, `NumericInputModal.spec.ts`.

## External sources

None fetched — no external library/API is involved; the modal is custom code on
shadcn-vue/reka-ui primitives already in the repo.

## Code references

- `src/components/ui/numeric-input/NumericInputModal.vue` — modal shell, commit logic, hardcoded titles
- `src/components/ui/numeric-input/NumericPresetList.vue` — scroll list, selection/scroll behavior
- `src/components/ui/numeric-input/NumericValueDisplay.vue` — value row, confirm button, barbell hint
- `src/components/ui/numeric-input/NumericKeypad.vue` — keypad, fresh-start editing
- `src/components/ui/numeric-input/useNumericInput.ts:45-81` — per-type preset configs
- `src/features/weight/components/WeightEntryForm.vue` — bodyweight caller (screenshot context)
- `src/__tests__/integration/` — specs listed under Testing patterns (exhaustive for this area)
- `brain/reference/research/2026-07-19-mobile-modal-keyboard-ux.md` — adjacent note; not applicable (no OS keyboard here)

## Coverage ledger

| Surface | Status | Note / grounding / default |
|---------|--------|----------------------------|
| Contracts (interface / data / API) | resolved-by-evidence | Component chain and call sites; props/models stay `modelValue` + `open` + `type` |
| Lifecycle & state transitions | open-needs-user | Two commit models in one modal — unify preset-tap vs confirm? default: keep instant-apply for presets |
| Failure modes & error/retry | resolved-by-evidence | Clamping/decimal rules in `useNumericInput.ts`; no network involved |
| Permission & ownership boundaries | open-needs-user | Blast radius: change shared modal (all 5 types) or weight-only? default: shared |
| Source-of-truth / conflict resolution | open-needs-user | Which value drives the wheel: external `modelValue` vs live `internalValue`? default: internalValue |
| Experience quality bar | open-needs-user | What "improved" means: wheel affordance, sync-on-type, space use, speed of logging |
| External / version facts & deprecation | n/a-derived | No external library/API touched |

## Open questions

None beyond the ledger's open rows.
