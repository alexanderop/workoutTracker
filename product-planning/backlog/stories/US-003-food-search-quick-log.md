# US-003: Food Search with Favorites, Time Picks & Quick Add

## Story ID: US-003

### Title

Food search with favorites, time-based picks, recents, and one-tap logging

### User Story

As **Casual Carl** (quick, simple logging without setup overhead),
I want **to find a food by typing its name and to see my favorites, my usual
foods for this time of day, and my latest foods the moment I open Add Food**,
So that **logging a meal takes one tap instead of scrolling a dropdown and
filling out a form**.

### Context

Reference: MacroFactor-style food search screen (screenshot in PR/session).
Today the Add Food dialog offers a plain `<select>` of library foods or manual
entry/barcode scan. This story replaces the selection experience with a search
surface plus suggestion sections. Scope decisions made with the PO:

- Search is **local-library only** (offline-first; barcode scan stays the
  online path for new foods).
- `+` on a row **logs instantly** with the food's default serving — no basket,
  no portion editor first.
- No undo toast: the entry appears in the day timeline where it can already be
  deleted.
- Favorites are toggled via a **star on the food row**; no separate library
  management screen.
- Time-based picks rank by **time-window frequency** (±90 minutes around the
  current time of day, across diary history).

### Acceptance Criteria

#### Search

- [ ] **Given** the Add Food surface is open and the library contains foods,
      **When** the user types in the search field,
      **Then** the list filters live to foods whose name or brand contains the
      query (case-insensitive substring), with no network request.
- [ ] **Given** a query that matches no library food,
      **When** the results are empty,
      **Then** an empty state offers "Create ‹query›" which opens the existing
      new-food form with the name prefilled.
- [ ] **Given** the search field is empty,
      **Then** the suggestion sections (Favorites, time picks, Latest) are
      shown instead of search results.
- [ ] **Given** any food row (search result or suggestion),
      **Then** it shows name, brand (when present), and calories + protein /
      fat / carbs for its default serving, plus the serving label
      (e.g. "1 serving (180 g)" or "100 g").

#### Favorites

- [ ] **Given** at least one food has `favorite = true`,
      **When** the surface opens with an empty query,
      **Then** a "Favorites" section appears first, listing favorited foods.
- [ ] **Given** any food row,
      **When** the user taps its star toggle,
      **Then** the food's favorite flag flips immediately and the Favorites
      section updates without reopening the surface.
- [ ] **Given** no food is favorited,
      **Then** the Favorites section is not rendered (no empty shell).

#### Time-based picks

- [ ] **Given** diary history contains entries logged within ±90 minutes of
      the current time of day (on any past date),
      **When** the surface opens with an empty query,
      **Then** a picks section titled with the current time (e.g. "22:00
      Picks") lists up to 5 foods ranked by how often they were logged in that
      window, most frequent first.
- [ ] **Given** no diary history falls within the ±90-minute window,
      **Then** the picks section is not rendered.
- [ ] **Given** a food is deleted/archived from the library,
      **Then** it no longer appears in picks (or any suggestion section).

#### Latest (recents)

- [ ] **Given** diary entries exist,
      **When** the surface opens with an empty query,
      **Then** a "Latest" section lists the most recently logged distinct
      foods, newest first, up to 10, without duplicating a food already shown
      in the same visit's list position (a food may appear in both Favorites
      and Latest).
- [ ] **Given** no diary entries exist yet,
      **Then** the Latest section is not rendered.

#### One-tap quick add

- [ ] **Given** any food row,
      **When** the user taps its `+` button,
      **Then** a diary entry is created immediately for the selected day using
      the food's default serving grams (fallback: last-logged grams for that
      food, then 100 g) and the meal derived from the current time
      (`mealForHour`), with a food snapshot as today.
- [ ] **Given** a quick add succeeded,
      **Then** the day's totals and timeline reflect the new entry without a
      page reload, and the surface stays open so more foods can be added.
- [ ] **Given** a quick add fails to persist,
      **Then** a visible error is shown (`role="alert"` or toast) and no
      phantom entry appears in the timeline.
- [ ] **Given** the user taps `+` twice on the same food,
      **Then** two separate diary entries are created (repeat logging is
      intentional).

#### Offline & platform

- [ ] **Given** the device is fully offline,
      **Then** search, suggestions, favoriting, and quick add all work
      identically (no spinners, no blocked input).
- [ ] **Given** a screen-reader or keyboard user,
      **Then** the star and `+` controls have distinct accessible names
      including the food name (e.g. "Log Feta", "Favorite Feta"), and the
      search field is labelled.

### Definition of Done

- [ ] Code complete and reviewed
- [ ] Unit tests for pick-ranking and search filtering
- [ ] Integration tests (Vitest browser mode + page object) for search, star
      toggle, and quick add
- [ ] i18n strings added for `en` and `de`
- [ ] Accessibility requirements met
- [ ] Works offline

### Technical Notes

- `DbFood.favorite` and `DbFood.lastUsedAt` already exist in the schema;
  `DbNutritionDiaryEntry.loggedAt` + `localDate` support the time-window
  ranking. **No schema change expected** — if one becomes necessary, a Dexie
  converter update is required per project convention.
- Quick add must also bump the food's `lastUsedAt`.
- Pick ranking runs over local diary entries only; keep it lazy/memoized so
  opening the surface stays instant on large diaries.
- Reuse the existing new-food form and barcode scan flow inside the same
  surface; this story changes food *selection*, not food *creation*.
- Feature code lives in `src/features/nutrition/`; all DB access via
  `src/db` repositories.

### Design/UX Notes

- Section order (empty query): Favorites → time picks → Latest, mirroring the
  reference screenshot.
- Rows use the compact "763 kcal · 26P 36F 74C · 1 serving" macro line.
- Mobile-first: search field reachable near the thumb; list scrolls, header
  stays put.

### Story Points

5

### Epic

E5: Nutrition Tracking

### Dependencies

- Existing food log day view and dialog (shipped in #218)

### Open Questions

- None — scope decisions resolved with PO on 2026-07-23 (see Context).

---
*Created: 2026-07-23*
*Last Updated: 2026-07-23*
