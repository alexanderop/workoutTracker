# Numeric Input Modal — True Wheel Rework

## Research
- [[numeric-input-modal-ui.research]] — as-is behavior of the modal, its call sites, and the wheel/keypad disconnect

## Context
- The fullscreen numeric entry modal (screenshot trigger: bodyweight "WEIGHT" screen) shows a preset list that neither follows keypad input nor looks/behaves like a wheel, has dead space beside 200px-capped rows, and mixes two commit models (preset tap = instant apply + close; keypad = confirm button).
- The modal is shared by all five input types (weight, reps, RIR, duration, distance) and ~7 call sites including mid-workout set logging — see [[numeric-input-modal-ui.research#Component chain and call sites]].
- Project tie-breaker applies: changes must make logging a set faster, or at least not slower.

## Decisions
- Improve the **shared** modal, not a weight-only fork — grounds: user decision in interview; regressions are guarded by the existing integration suite ([[numeric-input-modal-ui.research#Testing patterns]]).
- Target experience is a **true wheel**: CSS scroll-snap to steps, fixed center selection band, edge fades, full-width rows; scrolling itself selects the value — grounds: user decision in interview.
- The wheel is driven by the live editing value (`internalValue`), not the external `modelValue`: typing regenerates/re-centers the list and highlights the **nearest step** without overwriting typed decimals — grounds: [[numeric-input-modal-ui.research#Wheel/keypad disconnect]] (default-accepted; user deferred).
- **Confirm commits all**: wheel scrolling and keypad both edit `internalValue`; the check button is the single commit path, Cancel always discards. Preset instant-apply-and-close is removed — grounds: [[numeric-input-modal-ui.research#Two commit models in one modal]] (default-accepted; user deferred — see Open Non-Blocking Notes).
- Modal titles go through i18n (`t()`) like the rest of the modal — grounds: [[numeric-input-modal-ui.research#i18n gap in titles]] (no research — obvious defect fix).

## Contracts
- `NumericInputModal` public API is unchanged: `v-model` (number), `v-model:open`, props `type/unit/equipment`. No caller file needs edits — grounds: [[numeric-input-modal-ui.research#Component chain and call sites]].
- Wheel settle detection uses a debounced `scroll` handler computing the row nearest the container's vertical center — **no `scrollend` dependency** (avoids unverified cross-browser support claims); CSS `scroll-snap-type: y mandatory` + `scroll-snap-align: center` provide the snap. `(no research — chosen in interview phase as the dependency-free option)`
- Off-step values: typed value stays authoritative in the display; the wheel centers on the nearest step with a "nearest" (not "selected") visual state. Scrolling the wheel afterwards replaces the value with the snapped step.
- Regeneration: list rebuilds around `internalValue` on open and whenever the value leaves the currently generated range; keep per-type step/range configs in `useNumericInput.ts` untouched.
- Smooth programmatic scrolling respects `prefers-reduced-motion`; listbox/option roles and `aria-selected` semantics are preserved.

## Acceptance
- Typing `115.3` on the keypad visibly re-centers the wheel so `115` sits in the center band, while the display still reads `115.3` — the screenshot's stale-wheel state is impossible.
- The wheel reads as a wheel at a glance: fixed center band, rows snap into it, edge fade above/below, rows span the sheet width (no dead side gutters).
- Flick-scrolling settles on a step and the big display updates live; releasing never closes the modal; check commits, Cancel discards, for both input paths.
- Behavior is identical across all five types (set logging reps/weight included); no call-site regressions in the integration suite.
- German locale shows translated modal titles.

## Open Non-Blocking Notes
- Commit-model unification (confirm-commits-all) was default-accepted, not user-chosen; it costs one extra tap vs today's preset flow. If dogfooding shows set logging got slower, the fallback is "tap centered row = instant apply" — an isolated change in `NumericInputModal`.
- Keypad-adjacent quick-adjust chips (±step) were discussed as an alternative and dropped; could be revisited for barbell workflows.

## Tasks

- **Wave 1 — tracer (single slice):**
  - True-wheel rework: presets regenerate from `internalValue`, nearest-step centering, scroll-snap + center band + fades + full-width rows, debounced settle-updates-model, remove instant-apply/close; update `numeric-input-modal.spec.ts` + `NumericInputModalPO` for the new interaction · owns `src/components/ui/numeric-input/NumericInputModal.vue`, `NumericPresetList.vue`, `src/__tests__/integration/numeric-input-modal.spec.ts`, `src/__tests__/helpers/pages/NumericInputModalPO.ts` · depends: none
- **Wave 2 — parallel:**
  - i18n titles: replace the hardcoded title record with `t()` keys, add `en`/`de` messages, spec asserting DE title · owns title block of `NumericInputModal.vue`, `src/i18n/messages/{en,de}/common.ts` · depends: Wave 1 (same file)
  - Call-site spec sweep: update `weight-tracking-mobile.spec.ts`, `rir-zero-value.spec.ts`, `cardio-mobile-config.spec.ts`, `SetRowPO.ts` for confirm-commits-all · owns those test files · depends: Wave 1 contract

**Verification**
1. `pnpm type-check && pnpm lint && pnpm test`
2. Manual: `pnpm dev` on a phone-sized viewport — reproduce the screenshot flow (open weight modal, type 115.3) and confirm the wheel re-centers.
