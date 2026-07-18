# Product Requirements Document: Habit Grid Dashboard

## Document Info

| Field | Value |
| --- | --- |
| Feature | Habit Grid Dashboard |
| Author | Product / Codex |
| Created | 2026-07-18 |
| Last updated | 2026-07-18 |
| Status | Draft for review |
| Primary persona | Casual Carl |
| Secondary personas | Serious Sarah, Functional Fiona, Home Workout Henry |

## Executive Summary

Redesign the Habits feature around a single, visual dashboard in which each habit is represented by a compact history grid and can be completed from the card in one tap. The feature should borrow HabitKit's grid-first hierarchy and sense of accumulated progress while retaining Workout Tracker's restrained shadcn-vue styling, semantic colors, offline behavior, quantity habits, and workout auto-linking.

The redesign consolidates the current separate **Today** and **Manage** presentations. History becomes permanently visible, while statistics, past-date editing, configuration, and archiving move into a focused habit detail sheet. A compact Home summary keeps habits visible without competing with the app's primary workout action.

## Product Context

Habit tracking supports the product vision by helping users maintain the behaviors surrounding consistent training: completing workouts, mobility, recovery, hydration, cardio, sleep, and similar routines.

The design is primarily for **Casual Carl**, who should be able to open Habits, understand his recent consistency, and log today without navigating or reading instructions. It also supports:

- **Serious Sarah**, who values accurate history, streaks, and quantity targets.
- **Functional Fiona**, who may connect a habit to completed workouts.
- **Home Workout Henry**, who needs an instant, offline interaction that survives interruptions.

## Problem Statement

### Current State

The existing feature has strong underlying capabilities but splits each active habit across two sections:

- **Today** provides the fast completion control.
- **Manage habits** provides configuration, statistics, and a collapsible history grid.

This creates duplicate cards, gives the page a settings-like feel, and hides the most motivating visual—the growing completion grid—behind an expansion control. Habit identity is limited to an emoji and name, so a list of habits is visually repetitive.

### Desired State

The Habits page should feel like a living record of consistency:

- One card per active habit.
- The recent history grid is always visible.
- Today's action is large and immediate.
- Each habit has a recognizable accent color.
- Tapping a habit's details opens history and management without cluttering the dashboard.
- All interactions remain instant and fully offline.

### Impact if Unchanged

The feature remains functional but feels administrative rather than motivating. Users must scan duplicate information and deliberately open details to see the visual payoff of maintaining a habit.

## Design Principles

1. **The grid is the habit.** Recent consistency is the dominant visual element on every card.
2. **Today is one tap away.** A binary habit can be completed or reverted directly from its dashboard card.
3. **History is visible; management is secondary.** Editing, archiving, and detailed statistics should not compete with today's action.
4. **Accumulation should feel rewarding.** Every completion adds a clear tile with restrained motion and color.
5. **Local-first means immediate.** No loading spinners, network dependencies, or delayed confirmation.
6. **Workout Tracker remains visually coherent.** Use existing typography, spacing, cards, sheets, semantic tokens, and dark-mode behavior.
7. **No nested interactive controls.** The visual card may contain distinct actions, but its DOM and keyboard behavior must remain valid and predictable.

## Goals

1. Make today's binary habit completion possible with one tap from the Habits page.
2. Make recent consistency understandable without expanding or navigating.
3. Give each habit a distinct but theme-safe visual identity.
4. Make correcting a past completion fast and reversible.
5. Preserve all existing habit behavior and history.
6. Make automatic workout completion visible and trustworthy without requiring an extra logging step.

## Success Criteria

Because the app is private and local-first, the first release must not add remote analytics. Validate success through automated interaction tests and lightweight usability sessions.

| Criterion | Target |
| --- | --- |
| Complete a binary habit from page load | 1 tap |
| Revert today's binary completion | 1 tap |
| Open a habit's detailed history | 1 tap |
| Correct a past binary completion | At most 3 taps from dashboard |
| Identify whether today is complete | Unambiguous without opening details |
| Dashboard response after completion | Visual response within 100 ms under normal local operation |
| Offline feature coverage | All creation, completion, history, editing, and archive flows work offline |
| Existing data retention | 100%; no habit or entry history is discarded |

## Non-Goals for This Release

- Reminders and push notifications.
- Home-screen widgets.
- Sharing cards or social features.
- Accounts, cloud storage, or multi-device sync.
- Gamification currencies, levels, achievements, or confetti.
- Negative habits such as “days without smoking” with inverse completion semantics.
- Arbitrary custom colors or a full color picker.
- Changes to streak calculation rules.
- Native OS widgets or background integrations outside the installed PWA.

## Information Architecture

The primary navigation remains unchanged. The Habits route contains:

1. Page header.
2. Active habit dashboard.
3. Empty state when no active habits exist.
4. Access to archived habits through a secondary page action.
5. Create/edit sheet.
6. Habit detail sheet with history and actions.

The separate **Today** and **Manage habits** sections are removed.

## Role of Habits in a Workout Tracker

The habit feature measures **consistency**, while workout blocks, exercise history, benchmarks, and timers retain detailed performance data. It must not become a second workout logger.

Examples:

- A `Sport` or `Complete a workout` habit answers, “Did I train today?”
- Workout history answers, “What did I do, how much, and how did I perform?”
- A `Run` habit may track frequency, while cardio blocks retain time, distance, and intensity.

When a behavior already has a detailed feature, the habit should link to or complete from that behavior instead of asking the user to enter the same information twice.

## Dashboard Specification

### Page Header

- Left: page title **Habits** using the existing `text-page-title` style.
- Right: primary **Add habit** button with Plus icon.
- When archived habits exist, expose **Archived habits** from a compact overflow menu or secondary text action. It must not be visually equal to Add habit.
- Use the existing `container mx-auto max-w-lg`, page padding, and `space-y-section` rhythm.

### Habit Card: Shared Layout

Each active habit appears once, ordered by `orderIndex`.

```text
┌──────────────────────────────────────────┐
│ [icon]  Strength workout          [ ✓ ]  │
│         Train consistently               │
│         🔥 4 day streak · Daily           │
│                                          │
│ ▫ ▪ ▪ ▫ ▪ ▪ ▪ ▫ ▪ ▪ ▫ ▪ ▪ ▪ ▫ ▪      │
│ ▪ ▪ ▫ ▪ ▪ ▪ ▫ ▫ ▪ ▪ ▪ ▪ ▫ ▪ ▪ ●      │
│             recent 16 weeks              │
└──────────────────────────────────────────┘
```

Card requirements:

- Full-width `bg-card` surface with existing border and radius conventions.
- Padding: approximately 12–16 px; vertical spacing should keep cards dense enough for mid-workout scanning.
- Header row contains icon, name/metadata, and today's control.
- Icon uses an emoji or existing fallback and must not be placed inside an additional colored square unless visual testing shows it improves scanning.
- Name is one line with truncation.
- Optional description is one line with truncation. If absent, do not reserve empty space.
- Metadata shows the most useful current state, not configuration jargon:
  - Daily: `4 day streak · Daily`
  - Weekly: `2 of 3 this week · 3× weekly`
  - No active streak: `Daily` or `0 of 3 this week · 3× weekly`
- The history grid sits directly below the header and spans the available card width.
- A subtle affordance such as a chevron or the habit name/details control opens the detail sheet. Do not add edit and archive icons to every card.

### Compact History Grid

- Show the most recent 16 Monday–Sunday weeks, including the current week.
- Oldest week is on the left; newest week is on the right.
- Days run from Monday at the top to Sunday at the bottom.
- Completed day: solid habit accent.
- Incomplete past/current day: muted surface.
- Future day: transparent or visually absent.
- Today: a contrast-safe ring, independent of completion state.
- Quantity entry below target: accent at approximately 30–40% visual emphasis.
- Quantity entry at or above target: solid accent.
- Dashboard tiles are informative, not individually interactive. Past editing belongs in the detail calendar, preventing tiny touch targets and accidental edits.
- Tile size may flex to fill available width, but the visual gap and shape must remain consistent. Minimum visible size is 8 px; target size is 10–12 px.
- No horizontal scrolling on the dashboard card at supported mobile widths.

### Binary Habit Today's Control

- A minimum 44×44 px button at the top-right of the card.
- Incomplete: outlined circle or rounded square using muted border and the habit accent as a restrained hover/focus cue.
- Complete: filled habit accent with a contrast-safe Check icon.
- Accessible name:
  - Incomplete: `Mark {habit name} complete for today`.
  - Complete: `Mark {habit name} incomplete for today`.
- Tapping immediately toggles today's entry.
- Tapping again is the undo mechanism; do not show a confirmation dialog.

### Quantity Habit Today's Control

Quantity habits must remain accurate without overwhelming the dashboard.

- Show the current value and target in the header: `3 / 8 glasses`.
- Below or beside it, provide compact decrement and increment buttons with minimum 44 px touch targets.
- The current numeric value is not a free-text field on the dashboard.
- Increment/decrement uses the configured step of `1` in this release.
- Value may not go below zero.
- Reaching the target fills today's grid tile; exceeding the target remains complete.
- Tapping the value summary opens the detail sheet, where an exact value can be entered through the existing NumberField pattern.
- If width is insufficient, the stepper moves to a dedicated row above the grid rather than compressing touch targets.

### Card Opening Behavior

Do not make the entire card a button because the card contains today's controls. Instead:

- The title/details region is a semantic button that opens the detail sheet.
- A chevron may reinforce the affordance.
- The grid itself may also open details only if it can do so without creating nested or ambiguous controls.
- Keyboard focus order is: details, today's completion/decrement/increment, then the next card.

### Completion Feedback

- Update the control, today's tile, streak/progress label, and relevant statistics as one coherent state change.
- Use a 150–220 ms scale/color transition. No confetti or blocking toast.
- Respect `prefers-reduced-motion`; state must remain clear without animation.
- Persist to IndexedDB immediately.
- If persistence fails, revert the visual state and show a concise error toast. Never leave the UI displaying unpersisted success.

## Home Dashboard Summary

HabitKit's official guidance emphasizes that visibility keeps goals top of mind. Workout Tracker already surfaces up to four habits on Home; preserve that useful entry point but make it denser than the full Habits page.

```text
Habits                                      View all ›
┌──────────────────────────────────────────┐
│ 🏋️  Complete a workout   ▪ ▪ ▫ ▪ ▪ ▫ ●  [✓] │
│ 💧  Drink water          ▪ ▫ ▪ ▪ ▪ ▪ ●  [ ] │
│ 🧘  Mobility             ▫ ▪ ▫ ▪ ▪ ▫ ●  [ ] │
└──────────────────────────────────────────┘
```

- Show at most four habits in stable `orderIndex` order. Completing a habit must not move the row under the user's finger.
- Each row shows icon, truncated name, a seven-day history strip, and today's control.
- Binary habits retain one-tap completion.
- Quantity habits show a compact value summary; exact adjustment may navigate to Habits if the Home width cannot support accessible controls.
- **View all** opens the full grid-first dashboard.
- Do not render a textual loading state or spinner for the local IndexedDB read. Keep the section hidden until the fast local read completes, or preserve a non-animated layout placeholder if visual testing shows unacceptable layout shift.
- The Home summary uses the same appearance and mutation source as the full dashboard so states cannot disagree.

## Habit Detail Sheet

Open a near-full-height mobile sheet/dialog from the dashboard. Use `MobileDialogContent` conventions and a discriminated union for detail substate if the sheet can show summary, calendar, or edit modes.

### Summary State

```text
┌──────────────────────────────────────────┐
│ [icon] Reading                       [×] │
│ Read for at least 15 minutes              │
│                                          │
│  Current streak   Best streak   30 days  │
│       4               12           73%   │
│                                          │
│ Recent activity                          │
│ [larger 16-week grid]                    │
│                                          │
│ [ Open calendar ]                        │
│                                          │
│ Edit habit                    Archive    │
└──────────────────────────────────────────┘
```

Requirements:

- Header shows icon, name, optional description, and close control.
- Show the existing current streak, longest streak, and 30-day completion rate.
- For weekly habits, also show `completed / target this week` prominently.
- Show a larger recent-history grid.
- Provide **Open calendar**, **Edit habit**, and **Archive habit** actions.
- Archive uses the existing confirmation dialog and preserves all entries.
- Do not include Share, Reminder, or Widget actions.

### Calendar State

- Display one calendar month at a time, starting with the current month.
- Monday is the first day of the week, matching existing statistics.
- Previous and next month controls have accessible names and 44 px touch targets.
- Future dates are disabled.
- Completed day uses the habit accent and a contrast-safe completion indicator.
- Incomplete day uses the normal calendar surface.
- Today has an independent ring.
- Binary habit: tapping a non-future date toggles complete/incomplete immediately.
- Quantity habit: tapping a date opens an inline or nested NumberField editor for the exact value. It must not silently replace a partial historical value with the full target.
- Changing a historical day updates the calendar, recent grid, streaks, weekly progress, and dashboard after the sheet closes.
- Month navigation never requires network access.

## Create and Edit Habit Sheet

Creation and editing use the same mobile-first form.

### Field Order

1. Name — required.
2. Description — optional, maximum 120 characters.
3. Icon — preset emoji grid plus the existing short emoji input.
4. Accent color — fixed accessible palette.
5. Goal schedule — Daily or weekly target of 1–7 days.
6. Tracking type — Complete/incomplete or quantity.
7. Quantity target and unit — only for quantity habits.
8. Automatically complete after a finished workout — existing switch, presented as an integration rather than generic configuration.

### Defaults

- Tracking type: binary.
- Schedule: daily.
- Icon: none until selected; dashboard uses the existing fallback.
- Accent: primary-purple compatible default.
- Description: empty.
- Auto-link: off.

### Icon Picker

- Preserve the fast preset picker.
- Selected icon has a clear border and selected state.
- Each preset requires an accessible label, not only the emoji glyph.
- Do not require a separate picker screen for the initial release.

### Accent Picker

- Offer 6–8 named, theme-aware accents such as Purple, Blue, Cyan, Green, Amber, Rose, and Pink.
- Store a stable semantic identifier, never a raw hex, RGB, or OKLCH string in user data.
- Define light and dark CSS token values for every accent.
- Selected color uses both a visible outline/check and `aria-pressed`; selection must not rely on color alone.
- Each accent must meet WCAG contrast requirements for its check icon and focus treatment.

### Validation and Save

- Retain existing name, weekly target, quantity target, and unit validation.
- Save remains disabled until required inputs are valid.
- Errors appear adjacent to their fields and are announced accessibly.
- Save closes the sheet and returns to the dashboard with the created/updated card visible.
- Cancel discards unsaved form changes. No confirmation is required unless the form has changed substantially and accidental dismissal is demonstrated during testing.

### Workout Auto-Link UX

The official HabitKit automation guide frames automation as a way to reduce forgotten logs and let users focus on doing the behavior. The existing completed-workout auto-link should therefore be a first-class advantage of this app:

- Label the option clearly: `Complete this habit when I finish a workout`.
- Add supporting text: `Workout Tracker will mark today complete automatically.`
- Only binary habits may enable this option, matching existing domain behavior. If the user changes an auto-linked habit to quantity, turn the option off and explain why inline.
- For a likely workout habit created from a suggested preset, enable auto-link by default. For a habit created from scratch, leave it off.
- After an automatic completion, show the normal completed state plus a subtle detail-sheet annotation: `Completed from workout at {time}`.
- Automatic completions remain reversible from the habit control or calendar.
- Finishing another workout on the same day must not duplicate entries or produce repeated success messages.

## Empty and Archived States

### No Habits

Show a compact, motivating empty state:

- Title: `Build consistency one day at a time`.
- Body: `Track workouts, recovery, hydration, or any routine you want to repeat.`
- Primary action: `Add your first habit`.
- Avoid illustrations that add bundle weight without improving comprehension.

### All Habits Archived

Use the same empty state plus a secondary **View archived habits** action.

### Archived Habits

- Archived habits remain in a separate sheet or section reached from the page header.
- Each row shows icon, name, and archived date when available.
- The only primary row action is **Restore**.
- Restoring places the habit at the end of the active order and preserves history, accent, and description.

## Reordering

The repository already supports habit ordering, but reordering is secondary to the grid redesign.

- If included in this release, expose a dedicated **Reorder habits** mode from the page overflow menu.
- Use drag handles and provide accessible move-up/move-down alternatives.
- Do not overload normal card swipes or long-press gestures.
- If not included, preserve the current `orderIndex` and defer the UI without blocking the dashboard redesign.

## Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-01 | Replace Today/Manage sections with one grid-first card per active habit. | Must |
| FR-02 | Display a 16-week compact completion grid on every active habit card. | Must |
| FR-03 | Toggle today's binary completion from the card in one tap. | Must |
| FR-04 | Log quantity progress from the card without opening a modal. | Must |
| FR-05 | Open a focused detail sheet containing statistics and larger history. | Must |
| FR-06 | Edit past binary and quantity values from a monthly calendar. | Must |
| FR-07 | Add an optional description and a fixed accent choice to each habit. | Must |
| FR-08 | Preserve daily/weekly schedules, quantity targets, archive, and workout auto-link behavior. | Must |
| FR-09 | Update all affected views immediately after any entry mutation. | Must |
| FR-10 | Support light/dark themes without per-component `dark:` classes. | Must |
| FR-11 | Restore archived habits with all history and appearance intact. | Must |
| FR-12 | Reorder active habits in a dedicated mode. | Could |
| FR-13 | Keep a compact Home summary with seven-day context and today's action. | Should |
| FR-14 | Clearly communicate and safely apply automatic completion from finished workouts. | Must |

## Non-Functional Requirements

### Performance

- No network calls are required for any habit flow.
- No spinner is shown for local reads or writes.
- Page interaction is available as soon as local data is loaded.
- Build grids through pure derived functions and avoid repeated date/stat calculations per render where computed data can be shared.
- Large entry collections should not trigger deep reactive tracking unnecessarily.

### Offline and Data Ownership

- Every flow works in airplane mode after app installation.
- Data remains stored through the `src/db` repository boundary.
- Export/import includes new habit appearance fields.
- Existing exports remain importable.

### Accessibility

- All touch targets are at least 44×44 px.
- All actions are keyboard reachable with visible focus.
- Completion, partial progress, future days, and today are not communicated by color alone.
- Dashboard grids expose an accessible summary rather than 112 individual non-actionable cells, for example: `Reading: 18 completed days in the last 16 weeks; today incomplete.`
- Interactive calendar dates expose date, value, target, and state in their accessible names.
- NumberField inputs use an associated `Label` and `id`; do not place `aria-label` on the NumberField wrapper.
- Screen-reader announcements for a mutation are concise: `{habit} marked complete for today` or `{habit} set to {value} {unit}`.

### Security and Privacy

- Do not transmit habit names, descriptions, history, or usage analytics.
- Do not introduce third-party scripts or SDKs.

### Internationalization

- All visible and accessible text is added to both English and German message files.
- Layout supports longer German labels without shrinking touch targets.
- Dates use the user's locale while calculations retain the app's Monday-first convention.

## Data Model Changes

Extend `DbHabit` with:

```ts
export type HabitAccent =
  | 'purple'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'amber'
  | 'rose'
  | 'pink'

export type DbHabit = {
  // existing fields
  description: string | null
  accent: HabitAccent
}
```

Compatibility requirements:

- Existing habits normalize to `description: null` and `accent: 'purple'`.
- Never infer or store raw color values.
- Update import validation, export types, test factories, and every construction site.
- Update the canonical conversion/defaulting path for older stored data. If habits do not yet have a converter, add one at the repository boundary rather than scattering optional fallbacks through components.
- Preserve all `DbHabitEntry` records unchanged.
- A Dexie version/index change is only required if storage inspection shows it is necessary; these fields must not be indexed merely for this UI.

## State Model

Exclusive UI states should use discriminated unions rather than multiple booleans. Suggested route-local model:

```ts
type HabitOverlayState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'detail'; habitId: string; view: 'summary' | 'calendar' }
  | { type: 'edit'; habitId: string }
  | { type: 'archive-confirmation'; habitId: string }
  | { type: 'archived-list' }
  | { type: 'reorder' }
```

The exact component split may differ, but invalid combinations such as create and archive dialogs being open simultaneously must be structurally impossible.

## Edge Cases

- **Midnight while page is open:** today's marker and action must roll over to the new local day without a reload.
- **DST boundary:** continue using calendar-aware local start-of-day calculations.
- **Future dates:** visible where needed for calendar shape but never editable.
- **No history:** show an empty muted grid; do not hide it.
- **Very old history:** calendar navigation can reach it without loading from a server.
- **Long names/descriptions/units:** truncate on cards; show full content in detail; prevent controls from shrinking.
- **Quantity partial entry:** visually distinct from both zero and complete.
- **Quantity target changed:** historical raw values remain unchanged; completeness is evaluated against the current target, matching existing semantics.
- **Weekly goal already met:** allow additional completions; display progress as `4 of 3` or `4 completed · goal 3`, never clamp stored history.
- **Workout auto-link:** completing a workout updates the associated habit card and grid when the Habits view is next shown.
- **Automatic-completion override:** manually reverting an auto-linked completion is allowed and must not be recreated until another qualifying workout completion event occurs.
- **Archive from details:** close details after successful archive and remove the card without page reload.
- **Persistence failure:** revert local state and announce failure; no spinner or indefinite disabled state.

## Acceptance Criteria

### AC-01: Grid-first dashboard

**Given** at least one active habit exists  
**When** Casual Carl opens the Habits page  
**Then** each active habit appears exactly once  
**And** each card shows its name, icon, recent grid, schedule/progress context, and today's control  
**And** there are no separate Today and Manage sections.

### AC-02: Binary one-tap completion

**Given** a binary habit is incomplete today  
**When** the user presses its completion control  
**Then** today's entry is stored locally  
**And** the check control, today's grid tile, and streak/progress update without navigation  
**And** pressing the control again removes today's completion without confirmation.

### AC-03: Quantity progress

**Given** a quantity habit has a target of 8 glasses and a current value of 3  
**When** the user presses increment  
**Then** the value becomes 4 and is persisted locally  
**And** the card announces `4 of 8 glasses`  
**And** today's tile remains partial until the target is reached.

### AC-04: Detailed history

**Given** a habit has recent entries  
**When** Serious Sarah opens its details  
**Then** she sees current streak, longest streak, 30-day completion rate, and recent history  
**And** she can open a monthly calendar without leaving the Habits route.

### AC-05: Correct past binary completion

**Given** a past non-future date is incomplete  
**When** the user taps that date in the detail calendar  
**Then** it becomes complete and is persisted  
**And** dependent grids and statistics update immediately  
**And** tapping it again reverts the completion.

### AC-06: Correct past quantity value

**Given** a quantity habit has a partial historical value  
**When** the user selects that date  
**Then** the exact stored value is shown in a labeled NumberField  
**And** saving a new value preserves that exact value rather than replacing it with the target.

### AC-07: Appearance customization

**Given** the create or edit form is open  
**When** the user selects an icon and named accent  
**Then** selection is visible without relying on color alone  
**And** saving applies the appearance consistently to the card, grid, detail sheet, and calendar in light and dark themes.

### AC-08: Existing-data compatibility

**Given** a user has habits created before this release  
**When** the upgraded app loads them  
**Then** every habit and entry remains available  
**And** each old habit receives the documented default description and accent  
**And** export followed by import preserves the normalized data.

### AC-09: Offline operation

**Given** the device has no network connection  
**When** the user creates, completes, edits, or archives a habit  
**Then** the operation behaves the same as online  
**And** no spinner or network error appears.

### AC-10: Accessible interaction

**Given** the page is operated with keyboard or screen reader  
**When** the user moves through habit actions  
**Then** every action has a descriptive accessible name and visible focus  
**And** completion state is programmatically exposed  
**And** non-interactive dashboard grid cells do not create 112 focus stops per habit.

### AC-11: Automatic workout completion

**Given** a binary habit is linked to completed workouts and is incomplete today  
**When** Functional Fiona finishes a workout  
**Then** today's habit entry is created exactly once  
**And** Home and Habits show it as complete without another user action  
**And** habit details explain that it was completed from the workout  
**And** the user can still revert it.

### AC-12: Home visibility

**Given** active habits exist  
**When** Home Workout Henry opens the Home page  
**Then** up to four habits appear in stable order with seven-day context  
**And** binary habits can be completed in one tap  
**And** no spinner or textual loading state is shown for the local read.

## Suggested Implementation Slices

### Slice 1 — Visual card foundation (5 points)

- Add description/accent fields and backward-compatible normalization.
- Build the unified habit card and permanent compact grid.
- Keep existing completion behavior wired to the new card.

### Slice 2 — Dashboard completion controls (5 points)

- Binary control, quantity stepper, state feedback, and error rollback.
- Remove Today/Manage duplication.
- Add accessibility announcements and update the compact Home summary.

### Slice 3 — Detail and calendar (8 points)

- Detail summary sheet.
- Monthly calendar navigation.
- Binary past-date toggle and exact quantity editing.

### Slice 4 — Create/edit appearance (5 points)

- Description input, accessible icon presets, accent picker, and card preview if useful.
- Update import/export validation and i18n.

### Slice 5 — Polish and verification (3 points)

- Empty/archived states, responsive layout, dark theme, reduced motion, midnight rollover.
- Browser-mode integration tests and mobile browser smoke test.

Reordering is a separate 3-point optional slice.

## Verification Plan

- Pure tests for compact-grid state, including partial quantities, future dates, DST, and week boundaries.
- Composable tests for optimistic/persisted mutations and rollback.
- Browser-mode integration tests covering AC-01 through AC-10.
- Import/export compatibility tests using pre-feature habit fixtures.
- Manual mobile checks at narrow and `max-w-lg` widths in light and dark themes.
- Keyboard-only and screen-reader-oriented checks for action names, focus order, announcements, and calendar dates.
- Run `pnpm type-check && pnpm lint && pnpm test` before delivery.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Sixteen-week grid becomes illegible on narrow screens | Medium | High | Use responsive tile sizing, preserve gaps, and validate on the narrowest supported viewport. |
| Quantity controls make cards too tall | Medium | Medium | Move the stepper to a dedicated compact row and test with long translated units. |
| Accent colors fail in one theme | Medium | High | Use paired light/dark semantic tokens and automated/manual contrast checks. |
| New fields break old imports or records | Medium | High | Normalize centrally and add old-data fixtures before UI work. |
| Card becomes an accessibility trap due to nested actions | Medium | High | Use separate semantic controls; keep the card container non-interactive. |
| Statistics recompute excessively for many habits | Low | Medium | Derive view models once per habit and keep grid/stat functions pure. |
| Detail/calendar scope delays the useful dashboard | Medium | Medium | Ship in slices; the unified card provides value independently. |

## Open Product Decisions

These decisions are non-blocking and have recommended defaults:

| Decision | Recommended default |
| --- | --- |
| Compact grid length | 16 weeks |
| Habit accents | Seven fixed named colors |
| Dashboard grid interactivity | Read-only; edit dates in details |
| Archived access | Secondary header overflow action |
| Reordering | Defer unless it fits the release comfortably |
| Description | Optional, 120-character maximum |
| Quantity dashboard step | Fixed at 1 for this release |

## Competitive Reference

Reference product: [Habit Tracker – HabitKit](https://play.google.com/store/apps/details?id=com.roehl.habitkit&hl=en).

Borrow:

- Grid-first cards.
- Strong per-habit identity.
- One-tap daily completion.
- Direct calendar correction.
- Visual icon/color configuration.

Do not copy:

- HabitKit branding, exact colors, type, spacing, or card composition.
- Sharing, reminders, or widgets in this release.
- Decorative neon/glow effects that conflict with Workout Tracker's design system.

## Official Blog Research Findings

The official HabitKit blog supports several UX decisions in this PRD:

1. **Consistency should be visible at a glance.** The marathon case study describes the week-column/weekday-row grid as a fast way to understand overall training consistency. This supports making the grid permanently visible rather than hiding it in statistics.
2. **Habits complement specialist fitness tracking.** The author used a broad `Sport` habit with the description `Weightlifting, running or similar` while using running tools for detailed metrics. Workout Tracker should similarly retain detailed workout data in its workout features and use habits as the consistency layer.
3. **Flexible weekly frequency matters.** The marathon habit used a six-times-per-week goal rather than demanding a perfect daily streak. The current daily/weekly schedule model is valuable and should remain prominent in card metadata.
4. **Automation reduces logging burden and forgotten entries.** HabitKit's Shortcuts guide explicitly positions automatic completion as a way to focus on doing rather than remembering to track. This validates elevating completed-workout auto-linking in the form and making its result transparent.
5. **Visibility outside the full tracker matters.** HabitKit's widget guide argues for keeping goals front and center and enabling completion from the glance surface. Native widgets remain out of scope, but Workout Tracker's existing Home summary should preserve one-tap completion and show a small amount of visual history.
6. **Different behaviors need different tracking shapes.** The productivity guide mixes binary daily actions, countable sessions, weekly actions, and reflection. Binary, quantity, and weekly goals should therefore remain clear choices instead of forcing every habit into a daily checkbox.
7. **Reflection notes are a credible future extension.** The guide suggests recording insights during weekly reviews. Per-entry notes could serve recovery, pain, mobility, or review habits, but should be explored separately because it changes `DbHabitEntry` and calendar behavior.

Sources:

- [From Couch to Marathon](https://www.habitkit.app/blog/marathon-habit-tracking)
- [HabitKit and iOS Shortcuts](https://www.habitkit.app/blog/ios-shortcuts-habit-tracker)
- [HabitKit iOS Home Screen Widgets](https://www.habitkit.app/blog/ios-home-screen-widgets-habit-tracker)
- [Five Habits to Boost Productivity](https://www.habitkit.app/blog/five-habits-productivity-2025)

## Future Opportunities Informed by Research

These are not part of the first release:

- Optional note attached to a day's habit entry.
- PWA shortcuts or platform automation hooks beyond finished-workout auto-linking.
- Native/widget-like glance surfaces where supported.
- Suggested starter habits for workout, mobility, hydration, sleep, and weekly review.
- More automation sources only when they can remain local, understandable, and reversible.
