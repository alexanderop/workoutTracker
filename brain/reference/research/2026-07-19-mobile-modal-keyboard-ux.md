---
type: Research
title: Mobile modal & bottom-sheet UX with the on-screen keyboard
description: Why fixed bottom sheets get hidden behind the mobile keyboard (vh/dvh, interactive-widget, visualViewport) and the combined fix applied to MobileDialogContent.
resource: brain/reference/research/2026-07-19-mobile-modal-keyboard-ux.md
tags: [research, mobile, dialogs, bottom-sheet, keyboard, visualViewport, dvh, reka-ui]
timestamp: 2026-07-19T11:45:00Z
---

## Research: Mobile modal & bottom-sheet UX with the on-screen keyboard

**Date:** 2026-07-19
**Status:** Complete

## Problem Statement

On mobile browsers, opening the "Log food" dialog (and other input-heavy
dialogs) pops the on-screen keyboard, which covers the bottom sheet: only the
title/description remain visible, the form and the submit button are hidden.
Root causes found in this codebase:

- `MobileDialogContent.vue` pins the sheet with `fixed bottom-0` and has no
  intrinsic max-height or scroll structure; each caller improvises.
- Height caps use `vh` (`max-h-[90vh]` on FoodLogDialog), and **no viewport
  unit — not even `dvh` — reflects the keyboard** under default browser
  behavior.
- The viewport meta has no `interactive-widget` setting, so Android Chrome
  108+ only shrinks the *visual* viewport for the keyboard, leaving
  `position: fixed` elements behind it.
- reka-ui `DialogContent` auto-focuses the first tabbable element on open, so
  dialogs whose first field is a text input raise the keyboard mid-open
  animation.
- Inputs render below 16px (`text-sm`), which triggers iOS Safari's
  zoom-on-focus and wrecks fixed layouts.

## Key Findings

### Two viewports, and which knobs affect what

- Mobile browsers have a **layout viewport** (anchors `position: fixed`,
  drives `vh/svh/lvh/dvh`) and a **visual viewport** (what is actually
  visible). By default — iOS Safari always, Android Chrome since 108,
  Firefox Android since 132 — the keyboard shrinks **only the visual
  viewport**. `fixed; bottom: 0` and `100dvh` do not react at all.
- `dvh` is **URL-bar-aware, never keyboard-aware** (except on Android with
  `interactive-widget=resizes-content`). Still prefer `dvh` over `vh` — it
  fixes the collapsed-URL-bar overflow — just don't expect it to solve the
  keyboard.

### `interactive-widget=resizes-content` (viewport meta)

- Restores pre-Chrome-108 behavior: the keyboard resizes the layout viewport,
  so fixed bottom bars, `dvh`, and everything else reflow above the keyboard.
- Support: Chrome/Edge Android 108+, Firefox Android 132+. **Silently ignored
  by iOS Safari** (WebKit bug 259770 open) and all iOS browsers. Works in
  installed PWAs on Android.
- Harmless to always ship; it makes Android correct with zero JS.

### `visualViewport` API (the iOS path)

- Keyboard inset = `max(0, window.innerHeight − vv.height − vv.offsetTop)`.
- Must listen to **both** `resize` and `scroll` events on `visualViewport` —
  on iOS the browser *pans* the layout viewport (changing `offsetTop`)
  instead of resizing it.
- With `resizes-content` active on Android, `innerHeight` shrinks in step, so
  the formula naturally yields ~0 there — the meta + JS combo does **not**
  double-compensate (a documented pitfall when using height deltas instead).
- Gotchas: values settle late on iOS (post-animation), pinch-zoom also
  changes `height` (gate on `scale === 1`), keyboard-type switches re-fire
  `resize` (never cache), and iOS 26.0 shipped an `offsetTop`-doesn't-reset
  regression (WebKit bug 297779, partially fixed in 26.1).
- The `VirtualKeyboard` API / `env(keyboard-inset-height)` is Chromium-only
  and conflicts with `resizes-content`; not usable cross-platform. Skipped.

### Sheet structure for form dialogs (consensus: vaul, shadcn, radix threads)

```text
container: fixed inset-x-0, lifted above keyboard, flex flex-col,
           max-height: calc(100dvh − keyboard inset)
header:    flex-none (never scrolls away)
body:      flex-1 min-h-0 overflow-y-auto overscroll-contain (+ scroll-padding)
footer:    flex-none (CTA never scrolls away), safe-area padding
```

- The body must be the **only** scroll container so the browser's native
  scroll-to-focused-input has a well-defined scroller.
- `overscroll-behavior: contain` prevents scroll chaining that drags the page
  (and on iOS, the sheet) around.
- Because the sheet is `fixed` to the layout viewport, `bottom:
  var(--keyboard-inset)` places its bottom edge exactly at the visual
  viewport's bottom edge — same math as the popular `top + translateY(-100%)`
  trick, but it composes with Tailwind classes.

### Autofocus

- **Do not auto-open the keyboard when a sheet opens.** The keyboard
  animation races the open animation (radix-ui/primitives#2323, vaul#605);
  on iOS async programmatic focus can't raise the keyboard anyway.
- reka-ui `DialogContent` emits `openAutoFocus`; `event.preventDefault()`
  skips the FocusScope autofocus. Prevent on touch devices only, then focus
  the content container itself (`FocusScope` has `tabindex="-1"`) with
  `preventScroll` for a11y.

### iOS zoom-on-focus

- Any focusable input with computed font-size < 16px makes iOS Safari zoom
  the page and not zoom back. Fix with ≥16px input fonts on mobile
  (`text-base sm:text-sm`), **not** `maximum-scale=1` (breaks Android pinch
  zoom, WCAG 1.4.4 issue).

### Drawer libraries

- vaul / vaul-vue handle the keyboard via `repositionInputs` +
  `visualViewport`, but both are unmaintained and the iOS bug cluster
  (jumping, off-screen, stuck positions: vaul #216/#294/#503/#529/#619) is
  unresolved. Reka UI ≥2.10 ships its own Drawer (Alpha) without documented
  keyboard handling. Conclusion: keep our own `MobileDialogContent` and own
  the keyboard logic in a small composable.

## Codebase Patterns

Full inventory (2026-07-19): 21 `MobileDialogContent` consumers, 2
`SheetContent` bottom sheets, 3 plain `DialogContent` uses.

- Two divergent height idioms existed: `h-[100dvh] sm:max-h-[85vh]` + flex
  column + inner `overflow-y-auto` (ExercisePicker, AddBlockDialog, all
  Configure* dialogs — the good pattern) vs `max-h-[NNvh] overflow-y-auto` on
  the whole content (FoodLogDialog 90vh, WorkoutCalendarSheet 85vh,
  SourceSelector 80vh — header scrolls away, CTA scrolls away).
- Input-heavy dialogs with **no height cap and no scroll region** (worst
  keyboard risk): WorkoutEditExerciseDialog, NutritionGoalsDialog,
  HabitForm, FoodLogDialog, WorkoutSaveTemplateDialog, WorkoutFinishDialog.
- No `visualViewport` / `interactive-widget` / keyboard infrastructure
  existed; only `.safe-area-top/bottom` env() utilities in `src/style.css`.
- Composable conventions to mirror: `useTouchDevice` (VueUse
  `useMediaQuery`), `useScreenWakeLock` (VueUse `useEventListener`).

## Recommended Approach (implemented)

1. **Viewport meta** (`index.html`): add `interactive-widget=resizes-content`
   → Android correct with zero JS; ignored on iOS.
2. **`useKeyboardInset` composable** (called once in `App.vue`): listens to
   `visualViewport` `resize` + `scroll` via VueUse `useEventListener`,
   computes `max(0, innerHeight − vv.height − vv.offsetTop)` (0 when
   `scale !== 1`), writes `--keyboard-inset` px var on `:root`. This is the
   iOS path and a no-op (~0) on Android thanks to step 1.
3. **`MobileDialogContent`** becomes a proper sheet shell: `flex flex-col`,
   `bottom-[var(--keyboard-inset,0px)]`, intrinsic
   `max-h-[calc(100dvh-var(--keyboard-inset,0px))]`, `overflow-hidden`, and
   `@open-auto-focus` prevented on touch devices (container focused
   instead). Desktop (`sm:`) behavior unchanged.
4. **Dialog bodies**: header / `flex-1 min-h-0 overflow-y-auto
   overscroll-contain` body / pinned footer CTA — shipped for
   FoodLogDialog, WorkoutEditExerciseDialog, NutritionGoalsDialog,
   HabitForm, WorkoutFinishDialog, and ExerciseSelectorDialog (benchmarks
   feature, not in the original inventory above). `WorkoutSaveTemplateDialog`
   was left untouched (still a plain `space-y-2 py-4` block, no scroll
   region). `WorkoutCalendarSheet` and `SourceSelector` only got the `dvh`
   normalization in item 6 below, not the body restructure — `SourceSelector`
   still uses plain `DialogContent` with a nested `ScrollArea`, and
   `WorkoutCalendarSheet`'s `SheetContent` is still one scrolling block.
5. **Inputs ≥16px on mobile**: `text-base md:text-sm` on `NativeSelect` and
   `NumberFieldInput` to kill iOS zoom-on-focus. `Input` already shipped
   `text-base md:text-sm` before this work (untouched by it). There is no
   `Textarea` component in this codebase.
6. Normalize remaining `vh` caps in sheets to `dvh` (done for
   `WorkoutCalendarSheet` and `SourceSelector`; the `sm:max-h-[…vh]`
   desktop-only breakpoints in ExercisePicker/AddBlockDialog/Configure*
   dialogs are the pre-existing "good pattern" from Codebase Patterns above,
   not stray leftovers).

Pitfalls deliberately avoided: no `maximum-scale=1`; no
`env(keyboard-inset-height)` (Chromium-only, conflicts with
`resizes-content`); no vaul dependency; inset formula uses visualViewport
absolutes so meta + JS never double-compensate.

## Sources

- [Chrome: viewport resize behavior](https://developer.chrome.com/blog/viewport-resize-behavior) — Chrome 108 change, `interactive-widget` values.
- [web.dev: The large, small, and dynamic viewport units](https://web.dev/blog/viewport-units) — svh/lvh/dvh; keyboard is not UA UI.
- [HTMHell: interactive-widget deep dive](https://www.htmhell.dev/adventcalendar/2024/4/) — per-value effects on units and `position: fixed`; Firefox 132.
- [MDN: VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) — API reference, events.
- [Bram.us: VirtualKeyboard API](https://www.bram.us/2021/09/13/prevent-items-from-being-hidden-underneath-the-virtual-keyboard-by-means-of-the-virtualkeyboard-api/) — `env(keyboard-inset-height)`, Chromium-only.
- [WebKit bug 259770](https://bugs.webkit.org/show_bug.cgi?id=259770) — iOS does not support `interactive-widget`.
- [saricden: fixed elements + iOS keyboard](https://saricden.com/how-to-make-fixed-elements-respect-the-virtual-keyboard-on-ios) — visualViewport positioning trick; scroll listener requirement.
- [radix-ui/primitives#2323](https://github.com/radix-ui/primitives/issues/2323) — dialog hidden by keyboard with autofocused input.
- [shadcn-vue discussion #832](https://github.com/unovue/shadcn-vue/discussions/832) — `@open-auto-focus.prevent` pattern in Vue.
- [vaul API docs](https://vaul.emilkowal.ski/api) + issues #216/#294/#503/#529/#547/#619 — `repositionInputs` behavior and iOS bug cluster.
- [unovue/vaul-vue](https://github.com/unovue/vaul-vue) — superseded by Reka UI Drawer (reka-ui#2515).
- [CSS-Tricks: 16px prevents iOS form zoom](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/) — zoom-on-focus rule.
- [Apple forums 800125](https://developer.apple.com/forums/thread/800125) / [WebKit bug 297779](https://bugs.webkit.org/show_bug.cgi?id=297779) — iOS 26 `visualViewport.offsetTop` regression.
- [Emil Kowalski: Building a drawer component](https://emilkowal.ski/ui/building-a-drawer-component) — sheet structure + keyboard handling rationale.
