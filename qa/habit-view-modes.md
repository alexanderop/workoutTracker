# QA: Habit page view modes - 2026-07-26

## Verdict: SHIP

**Re-verified after fixes — 2026-07-26, second pass.** The first pass returned
SHIP WITH CAVEATS on one failing criterion and one thin one. Both were fixed and
re-measured on the same harness at the same viewport; all six criteria now pass
on observed behaviour. The original findings and the fixes are recorded below —
the first-pass sections are left intact as the record of what was wrong.

| # | Criterion | First pass | After fix |
|---|-----------|-----------|-----------|
| 1 | Default unchanged | PASS | PASS |
| 2 | Survives cold start | PASS | PASS |
| 3 | No dead-end modes | PASS | PASS |
| 4 | `grid` fits 7 habits | PASS (caveat: 40px names) | **PASS** — 100px names, none truncated, 62px headroom |
| 5 | `rows` today unambiguous | **FAIL** | **PASS** — 0/7 overflowing, 0 collisions |
| 6 | Switching instant and lossless | PASS | PASS |

### Fix 1 — Acceptance 5, the illegible week header

`HABIT_ROW_GRID_COLUMNS` widened `5.5rem → 7rem` (9.14px → 13px per column) and
the weekday format changed `short → narrow`, so a column carries one character
over a two-digit date. Narrow weekdays repeat (T/T, S/S); the date underneath
disambiguates them, which a bare letter would not.

Re-measured (`repro/tc10-refix.mjs`), evidence `30-rows-header-fixed.png`:

```
  "M20" column=13px needs=13px fits      overflowing:          0/7
  "T21" column=13px needs=13px fits      neighbour collisions: 0
  ...                                    columns marked today: 1
* "S26" column=13px needs=13px fits
```

Regression test added, and verified to fail against the unfixed layout — it
reported all seven columns (`Mon20`…`Sun26`) overflowing. The original spec
asserted the header *existed* and shared the row grid, both of which were true
while every label overflowed; the new assertion measures
`scrollWidth > clientWidth` per column.

### Fix 2 — Acceptance 4, the 4-character tile name

The name moved off the row it shared with the 32px check control and 14px icon
onto its own row, giving it the full tile width: **40px → 100px**, and none of
the seven seeded names truncate at all (including `No Phone After 9`). The
`Meditate` / `Medication` collision the first pass called out is gone.

That restructure initially cost 34px of height and made grid mode scroll at 7
habits, breaking criterion 4. Reclaimed by taking the tile heatmap from 5 weeks
to 6: the cells are square and sized by tile-width ÷ columns, so *more* columns
makes the block shorter — 23px per tile row — and buys a week more history
rather than costing one. Final headroom below the last tile row: **62px** at
390×844. Evidence: `31-grid-names-fixed.png`.

A `habit-tile-name` measurement assertion now guards the name width in the
integration tier.

## Route

**Frontend.** Every criterion is a claim about what the user sees and can do on
`/habits` -- which layout renders, whether it survives a restart, whether a
mode is a dead end, whether 7 habits fit a phone, whether a header is readable,
whether a switch flashes. The one non-visual part (the new `habitViewMode`
`DbUserSetting`) has no separate service contract; it is observable only as
"the page reopens in the mode I picked", so it was verified through the UI with
IndexedDB reads as corroboration rather than as a separate backend pass.

**Environment**

- Branch `claude/habit-page-visibility-filter-j60loi`, commits `74687dd..01e5b5b`,
  clean tree.
- `CI=1 pnpm dev` -> Vite 8.0.16 on `http://localhost:5173`. `CI=1` matters: it
  drops `vite-plugin-vue-devtools`, whose floating panel is fixed to the bottom
  centre of the viewport and drew over the detail sheet's Edit/Archive row in
  the first screenshot pass. See Observations -- it is dev-server noise, not a
  product defect, and every screenshot in this report was retaken without it.
- Playwright 1.61.1 driving `/opt/pw-browsers/chromium-1228/chrome-linux64/chrome`,
  **persistent context** (`launchPersistentContext`) so "cold start" is a real
  browser-process restart against surviving IndexedDB.
- Viewport 390x844, `deviceScaleFactor: 2`, `isMobile`, `hasTouch`.
- 7 seeded habits written straight into the app's own IndexedDB (5 binary,
  2 quantity -- `Calories Logged` 2200 kcal, `Drink Water` 3 L), each with ~10
  weeks of deterministic history and **no** entry for today, plus a completed
  `onboarding` record. Repro scripts: `qa/evidence/habit-view-modes/repro/`
  (`node repro/tc0N.mjs`).
- System date during the run: Sun 26 Jul 2026. TC-05b re-runs `rows` with the
  page clock pinned to Wed 22 Jul 2026 so "today" is an interior column.

---

## TC-01: Nothing changes for a user who never touches the toggle (Acceptance 1) - PASS

Steps:

1. Seeded 7 habits with **no** `habitViewMode` row in `settings`.
2. Opened `http://localhost:5173/habits`.
3. Read the rendered layout, the first card's text, and its heatmap label.
4. Ticked `Morning Walk`; filled the card's inline stepper for
   `Calories Logged` with `900` and pressed Enter.
5. Tapped the card body (`Show details for Morning Walk`).
6. Re-seeded with zero habits and reloaded to check the empty state.

Expected: large cards, check control, 16-week heatmap, streak visible without
tapping; the only differences from today are the title-row toggle and details
opening in a sheet instead of expanding inline.

Actual:

- Stored `habitViewMode`: `null` -> layout rendered is `cards`
  (`habit-tile-grid` count 0, `habit-row-date-header` count 0, 7 habit roots).
- First card text: `"Morning Walk\n2 day streak"` -- streak visible without
  tapping.
- Heatmap `aria-label`:
  `"Morning Walk: 42 completed days in the last 112 days"` -- 112 days = the
  unchanged 16-week window.
- Tick wrote an entry (`qa-habit-0` entry count 42 -> 43); the control's
  accessible name flipped to `Mark Morning Walk incomplete`.
- Inline card stepper still present (`#habit-quantity-card-qa-habit-1`) and
  wrote `{"date":1785024000000,"value":900}`.
- Card body opened `habit-detail-sheet` (count 1) -- a sheet, not an inline
  expand.
- Empty profile: `habit-view-mode-toggle` count **0** (no toggle with no
  habits), empty state intact:
  `"Build consistency one day at a time … No habits yet. Add one to start building your routine"`.
- Toggle group `aria-label` `"Habit layout"`; items `Grid view` /
  `Compact list view` / `Card view`, with `Card view` `data-state="on"`.
- `pageerror` list empty; no `[error]` console lines; no failed requests.

Evidence: `qa/evidence/habit-view-modes/01-cards-default.png`,
`01b-cards-default-scrolled.png`, `02-cards-detail-sheet.png`,
`13-empty-state.png`

## TC-02: The mode survives a cold start (Acceptance 2) - PASS

Steps:

1. Session 1 (fresh profile dir): seeded 7 habits, opened `/habits`, confirmed
   `cards`, clicked `habit-view-mode-grid`.
2. Closed the browser **process**.
3. Session 2: relaunched against the same persistent profile, opened `/habits`.

Expected: `/habits` reopens in `grid` after a full app restart, not just a
route change.

Actual:

- After the click, `settings` held
  `{ key: 'habitViewMode', value: 'grid' }` and `habit-tile-grid` rendered.
- Session 2, before any interaction: stored value still
  `{ key: 'habitViewMode', value: 'grid' }`; `habit-tile-grid` count **1**;
  7 habit roots; the grid toggle item read `data-state="on"`.
- No errors in either session.

A separate check confirms the write is a real user choice and not incidental:
re-tapping the already-active mode leaves the stored value at `null` (the
`ToggleGroup` deselect emits `''` and `handleChange` no-ops), and the page keeps
its 7 roots rather than emptying. Selecting via keyboard (`ArrowLeft` + `Enter`
from the focused `Card view` item) persisted `rows`.

Evidence: `qa/evidence/habit-view-modes/03-cold-start-grid.png`

## TC-03: Every mode can complete the core loop without switching (Acceptance 3) - PASS

Ran the identical five-step loop twice, once seeded into `grid` and once into
`rows`, never touching the toggle during the run.

Steps (per mode):

1. Clicked `Mark Morning Walk complete`.
2. Opened `Show details for Calories Logged`, filled the sheet stepper with
   `1750`, pressed Enter.
3. In the same sheet, clicked the history cell for today-minus-3-days.
4. Clicked `Edit Calories Logged`, renamed to `Calories Tracked`, saved.
5. Opened `Show details for Stretch`, clicked `Archive Stretch`, confirmed.

Expected: all five complete from the dense mode itself; none requires `cards`.

Actual (identical in both modes):

| Step | Result |
|---|---|
| tick binary | entry written `{"habitId":"qa-habit-0","date":1785024000000,"value":1}` |
| exact quantity | `{"habitId":"qa-habit-1","date":1785024000000,"value":1750}`; sheet header read `1750 / 2200 kcal` |
| retro-toggle | `Jul 23: complete` -> `aria-pressed true -> false`, DB row for that day deleted (`[]`) |
| edit | form prefilled `Calories Logged`; after save `habit-today-Calories Tracked` present |
| archive | confirm dialog `Archive "Stretch"? Your history is kept…`; `habit-today-Stretch` count 0, roots 7 -> 6, `ARCHIVED (1)` section rendered below the habits |

The layout container (`habit-tile-grid` / `habit-row-date-header`) was still
present at the end of each run -- nothing forced a mode change. Zero page errors
and zero console errors across both runs.

Additionally, the plan's claimed fix for the pre-existing compact-row gap holds:
in `rows`, tapping a quantity habit's check control jumps it to target --
`Calories Logged` wrote `2200` (label became `2200 / 2200 kcal`), `Drink Water`
wrote `3` (`3 / 3 L`). The sheet's stepper uses its own scoped id
(`habit-quantity-sheet-qa-habit-2`), so it does not collide with a card's.

Evidence: `qa/evidence/habit-view-modes/grid-a-ticked.png` …
`grid-e-archived.png`, `rows-a-ticked.png` … `rows-e-archived.png`,
`16-rows-quantity-logged.png`

## TC-04: `grid` fits 7 habits without scrolling (Acceptance 4) - PASS (with caveat)

> **Superseded — first-pass evidence.** The 40px name column recorded below was
> fixed (see *Fix 2* above): names now measure 100px and none of the seven
> truncate. Kept as the record of what was measured before the fix.

Steps:

1. Seeded 7 habits with `habitViewMode = 'grid'`, opened `/habits`.
2. Read `document.documentElement.scrollHeight` vs `clientHeight`.
3. Measured every check control's bounding box.
4. Measured each tile name span's rendered width and computed the longest
   prefix that fits it (canvas text metrics against the span's computed font).

Expected: three rows inside the viewport with no scrolling, every check a
distinct tap target, truncated names still telling the habits apart.

Actual:

- `scrollHeight 844 === clientHeight 844` -- the page **does not scroll**. The
  tile grid occupies `y 76..674`; the sticky nav starts at `y 773`, so there is
  ~99px of clearance.
- Seven check controls, all `32x32`, at x = 25 / 147 / 269 and y = 85 / 287 /
  489 -- 122px apart horizontally and 202px vertically. Distinct and
  non-adjacent; no mis-tap risk.
- Name spans render **40px wide** in every tile. All seven visible strings are
  distinct: `Morn…`, `Calo…`, `Drin…`, `Rea…`, `Medi…`, `Stretch`, `No P…`.

The criterion's bar ("must not collapse two different habits to the same
visible string in the common case -- `Morning …` vs `Calories …`") is met on
this set, so this is a PASS. Two caveats sit under it:

1. **The truncation is much harsher than the plan describes.** The plan's
   decision reads "3 columns inside the page's `max-w-lg` container leaves
   ~10rem per tile, so 'Morning Walk' becomes 'Morning …'". Measured, the tile
   is ~114px wide and the name column is what survives after `p-2` (16px), the
   32px check control, `gap-1.5` (6px), and the 14px `AppIcon` plus its gap --
   40px, i.e. about four characters. `Morning Walk` renders `Morn…`, not
   `Morning …`.
2. **Four characters collapse plausible habit pairs.** Re-seeded with a
   realistic fitness set, `Meditate` and `Medication` both render `Medi…` --
   6 distinct strings for 7 habits. Under the plan's stated whole-first-word
   truncation both would have read in full. (`Stretching` -> `Stret…` vs
   `Strength Training` -> `Stre…` survives, but only just.) Tile accent colour
   and icon still tell them apart; the name alone does not.

Evidence: `qa/evidence/habit-view-modes/04-grid-7-habits.png`,
`05-grid-truncation-adversarial.png`

## TC-05: `rows` makes today unambiguous (Acceptance 5) - FAIL (superseded — now PASS)

> **Superseded — first-pass evidence.** The overflow recorded below was fixed
> (see *Fix 1* above): 0/7 columns overflow and 0 neighbours collide. Kept as
> the record of the failure, since it is what the new regression assertion was
> written against.

Steps:

1. Seeded 7 habits with `habitViewMode = 'rows'`, opened `/habits`.
2. Measured the horizontal centre of each of the 7 header cells and of every
   heatmap cell in all 7 rows, then took the maximum drift.
3. Compared each header cell's rendered width against the `scrollWidth` its
   weekday and day-of-month text actually needs.
4. Located the cell carrying `habit-today-ring` and the header cell rendered
   bold.
5. Re-ran with `context.clock.install(new Date('2026-07-22T10:30:00'))` so
   today is Wednesday -- an interior column, not the last one.

Expected: the header aligns column-for-column with the heatmap cells beneath
it, and today's column is visually distinct at a glance without counting across
from the edge.

Actual -- **the geometry is right and the rendering is not**:

- Alignment is exact. Header text `This week | Mon 20 Tue 21 Wed 22 Thu 23 Fri
  24 Sat 25 Sun 26`; all 7 rows carry 7 cells; **max header/cell centre drift
  1.00px** on 9.14px cells. `HABIT_ROW_GRID_COLUMNS` does its job.
- Today is distinct. Sun 26: header cell `font-weight 700` at
  `oklch(0.145 0 0)` against `400` at `oklch(0.52 0 0)` for the rest, and the
  cell below carries `habit-today-ring`
  (`box-shadow: … 0 0 0 3px oklch(0.62 0.18 145)`). Ringed cell index `6` ==
  bold header index `6`. Mid-week re-run: ringed index `2` == bold index `2`,
  with Thu-Sun correctly `future`.
- **The weekday row is illegible.** Every header column renders **9.14px** wide
  while its weekday label needs 12-21px:

  | cell | column width | weekday text needs | overflow |
  |---|---|---|---|
  | Mon 20 | 9.14 | 19 | 2.1x |
  | Tue 21 | 9.14 | 17 | 1.9x |
  | Wed 22 | 9.14 | 21 | 2.3x |
  | Thu 23 | 9.14 | 17 | 1.9x |
  | Fri 24 | 9.14 | 12 | 1.3x |
  | Sat 25 | 9.14 | 15 | 1.6x |
  | Sun 26 | 9.16 | 18 | 2.0x |

  All seven overflow their cell and paint over their neighbours. On screen the
  row reads `MonTueWedThuFriSatSun` with glyphs superimposed -- the interior
  weekdays cannot be read at all. Mid-week it is worse: today's **bold `Wed`**
  is itself overpainted by `Tue` on the left and `Thu` on the right
  (`10-rows-header-midweek-crop.png`). The day-of-month row needs 11px in the
  same 9.14px cell, but the ~1.9px overflow stays legible.

This is a defect against the criterion's own words -- a header that does not
read column-for-column is a header you cannot use to name a column -- and
against the plan's Contracts, which list "the `rows` date-header day
abbreviations" as deliberate new i18n keys in both locales. The mode is not
broken (the numeric row and the ring still identify today), so this is a
caveat rather than a blocker, but it should not ship as-is.

Reproduce: `node qa/evidence/habit-view-modes/repro/tc05.mjs` (today = Sunday)
and `repro/tc05b.mjs` (clock pinned to a Wednesday), with `CI=1 pnpm dev`
running.

Evidence: `qa/evidence/habit-view-modes/06-rows-mode.png`,
`08-rows-header-alignment.png`, `09-rows-midweek.png`,
`10-rows-header-midweek-crop.png`

## TC-06: Switching modes is instant and lossless (Acceptance 6) - PASS

Steps:

1. Opened `/habits` in `grid` with 7 habits.
2. Installed a `requestAnimationFrame` sampler recording, per frame: habit-root
   count, which layout container exists, spinner-ish elements
   (`[role=progressbar]`, `.animate-spin`, `[aria-busy=true]`,
   `[data-loading]`) and `[role=status]` nodes.
3. Wrapped `IDBObjectStore.prototype` / `IDBIndex.prototype`
   `get` / `getAll` / `openCursor` and `window.fetch` with counters.
4. Cycled grid -> rows -> cards -> grid, sampling ~46 frames per switch.

Expected: no spinner, no refetch, no flash of empty state. Scroll reset is
acceptable; a visible reload is not.

Actual:

| switch | frames | min habit count | zero-habit frame | IDB reads | fetches | time to new layout |
|---|---|---|---|---|---|---|
| -> rows | 48 | 7 | no | 0 / 0 / 0 | 0 | 87.2 ms (4 frames) |
| -> cards | 47 | 7 | no | 0 / 0 / 0 | 0 | 61.7 ms (2 frames) |
| -> grid | 45 | 7 | no | 0 / 0 / 0 | 0 | 40.0 ms (2 frames) |

- **No refetch**: zero IndexedDB reads and zero `fetch` calls across all three
  switches. The data was already in memory, exactly as local-first ideal 1
  requires.
- **No flash of empty state**: the habit-root count never left 7 on any sampled
  frame.
- **No spinner**: the sampler's `[role=progressbar]` and `[role=status]` hits
  were triaged by dumping the matching nodes -- the only `[role=status]` is the
  app's permanently-mounted, empty toast viewport
  (`pointer-events-none fixed inset-x-0 bottom-24 …`, text `""`), and the only
  `[role=progressbar]` hits are the two quantity `Progress` bars that `cards`
  mode legitimately renders (`aria-valuenow` `0%`). `.animate-spin` count 0 in
  every mode. No loading indicator is involved in a switch.

Evidence: `qa/evidence/habit-view-modes/11-switch-rows.png`,
`11-switch-cards.png`, `11-switch-grid.png`

## TC-07: Home screen habits card is unaffected - PASS

Steps: after switching `/habits` into `rows`, navigated to `/`.

Expected: the home card keeps its current appearance; the date header is opt-in
via a prop defaulting to off (plan, Open Non-Blocking Notes).

Actual: `habit-row-date-header` count **0** on `/`, 4 habit rows rendered as
before. No errors.

Evidence: `qa/evidence/habit-view-modes/12-home-card-unchanged.png`

---

## Observations

**Environmental, not product defects**

- *Vue DevTools overlays the detail sheet in dev.* The first screenshot pass
  showed the shell's bottom-centre area drawing a floating pill over the
  `HabitDetailSheet` Edit/Archive row. Triaged with Playwright's actionability
  log, which named the interceptor: `<div class="vue-devtools__panel">` inside
  `#__vue-devtools-container__` -- the `vite-plugin-vue-devtools` panel, which
  `vite.config.ts` already comments as overlaying "the bottom of small
  viewports" and disables under `CI`. Re-ran with `CI=1 pnpm dev`: a
  `document.elementFromPoint` hit test at the centre, left edge, and bottom-left
  of both `Edit Morning Walk` and `Archive Morning Walk` returns the button
  itself in all six probes. Nothing in the app covers the sheet.
- *One transient `[Vue error] Cannot destructure property 'size' of
  'useLucideProps(...)'`* appeared on the very first page load after restarting
  Vite with a changed config, while the log read `Re-optimizing dependencies
  because vite config has changed`. It did not reproduce on any subsequent run
  (TC-01 re-run and all later cases: `pageerrors []`, `consoleErrors []`). Vite
  dep-optimizer race, not feature code.
- *`[WakeLock] Video fallback play failed: NotSupportedError`* warnings appear
  in the Vite server log during headless runs. Pre-existing, unrelated to
  habits, and warnings rather than errors.

**Design gaps — both since fixed on this branch, listed for the record**

- The `grid` tile name column is 40px / ~4 characters, against the plan's
  stated whole-first-word truncation. Cheapest fixes: drop the `AppIcon` from
  the tile's name line (it duplicates information the accent colour already
  carries) or move the check control below the name, either of which roughly
  doubles the name column.
- The `rows` weekday abbreviations do not fit a 9.14px column at any of the
  seven values. The column width is fixed by `HABIT_ROW_GRID_COLUMNS`'
  `5.5rem` heatmap track, which the cells legitimately need; the header row is
  the thing that has to change -- a single-letter weekday (`M T W T F S S`),
  a rotated label, or dropping the weekday row and keeping only the aligned
  day-of-month numbers, which already read cleanly.

**Tap targets (informational; the a11y tier is CI's job)**

- `grid` check controls are `32x32`; the view-mode toggle items are `~41x32`.
  Both are below the 44px commonly recommended for a phone-first app used
  mid-workout. They are unambiguous (122px / 202px apart in the grid), so this
  is not an Acceptance 4 failure, but it is worth a look when CI's a11y and
  visual tiers report.

**Supporting automated evidence** (re-run on this tree, not inherited from the
plan; these corroborate the manual pass and are not the verdict)

| Command | Result |
|---|---|
| `pnpm exec vitest run --project=unit src/__tests__/unit/habits` | 9 files, **110 passed** |
| `pnpm exec vitest run --project=default src/__tests__/integration/habit-tracking.spec.ts` | **37 passed**, no type errors |
| `pnpm exec vitest run --project=default src/__tests__/integration/settings-preferences.spec.ts src/__tests__/stores/settings.spec.ts src/__tests__/features/settings/validation.spec.ts src/__tests__/db/dataManagement.spec.ts src/__tests__/integration/data-export-import-roundtrip.spec.ts` | 5 files, **102 passed** |
| `pnpm exec vitest run --project=default src/__tests__/integration/quick-add-sheet.spec.ts src/__tests__/integration/home-recent-workouts-view-all-link.spec.ts` | **8 passed** |
| `pnpm exec vitest run --project=arch src/__tests__/architecture/backupCoverage.test.ts` | **3 passed** |

Note that the green integration tier is exactly why TC-05 needed pixels: the
habit-tracking suite asserts the header exists and that `HABIT_ROW_GRID_COLUMNS`
is shared, which is true -- the failure is that the text inside those correct
columns does not fit them. The `a11y` and `visual` tiers were not run locally,
per the plan's Test Scope; CI runs them on the PR and the `rows` header is
precisely the kind of thing the visual tier should catch.
