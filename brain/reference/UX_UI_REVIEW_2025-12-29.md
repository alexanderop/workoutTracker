---
type: Reference
title: "UX/UI Improvement Report — Workout Tracker (Mobile)"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/UX_UI_REVIEW_2025-12-29.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## UX/UI Improvement Report — Workout Tracker (Mobile)

**Date:** December 29, 2025
**Reviewer:** Claude (UX/UI Specialist mode)
**Device:** Mobile viewport (390x844)

---

## High Priority Issues

### 1. Language Inconsistency

- **Location:** Throughout app
- **Problem:** Mixed German/English
  - "No exercises yet" (English) on Log Past Workout page
  - "Workout Plan" header is English, buttons are German
  - "For Time" in timer selection vs German descriptions
- **Fix:** Full localization audit — check all `t()` calls and hardcoded strings

### 2. Missing Active Workout Indicator

- **Location:** Global (all pages)
- **Problem:** When navigating away from an active workout, there's no indicator that a workout is in progress
- **Risk:** Users may forget they have an active workout running
- **Fix:** Add persistent banner/FAB showing active workout status with timer, visible on all pages

### 3. Save Button Enabled on Empty State

- **Location:** `src/views/LogPastWorkoutView.vue` (likely)
- **Problem:** "Workout speichern" button appears enabled with no exercises added
- **Fix:** Add `:disabled="exercises.length === 0"` or computed property

---

## Medium Priority Issues

### 4. Filter Chips Truncation

- **Location:** Exercises page filter chips
- **Problem:** Chips cut off ("Sch..." for Schultern, "Maschi..." for Maschine)
- **Fix Options:**
  - Add horizontal scroll fade indicator
  - Use 2-row layout for better visibility
  - Use consistent abbreviations

### 5. Exercise Card Information Density

- **Location:** Exercise list items
- **Problem:** Cards show only name + muscle group
- **Fix:** Consider adding equipment icon/badge, last performed date, PR indicator

### 6. Empty States Could Be More Actionable

- **Location:** Templates page, Benchmarks page
- **Problem:** Empty states are passive
- **Fix:** Add illustrations, benefit statements, sample items to copy

### 7. Weight Input UX

- **Location:** Weight tracking page
- **Problem:** Stepper buttons (+/-) slow for large adjustments
- **Fix:** Allow direct keyboard input, add quick preset buttons

### 8. Calendar Week View Navigation

- **Location:** Home page calendar
- **Problem:** No obvious way to navigate to different weeks
- **Fix:** Add swipe gesture or arrow navigation

---

## Low Priority / Polish Items

### 9. Timer Cards Visual Hierarchy

- **Location:** Quick Timer page
- **Problem:** All timer types have equal visual weight
- **Fix:** Highlight most-used or add "recently used" section

### 10. Bottom Navigation Icon Clarity

- **Location:** Global navigation
- **Problem:** "Übungen" icon not immediately recognizable as exercises
- **Fix:** Consider dumbbell icon

### 11. Set Logging Table Contrast

- **Location:** Active workout set logging
- **Problem:** Empty rows use "—" with low contrast
- **Fix:** Use "0" or empty with placeholder styling

### 12. Workout History Card

- **Location:** Home page recent workouts
- **Problem:** "1 min" duration lacks context
- **Fix:** Add exercise count or primary muscles as secondary info

### 13. Settings Page Organization

- **Location:** Settings page
- **Problem:** "Erweiterte Diagnose" mixed with main settings
- **Fix:** Move to separate "About/Debug" section

---

## What's Working Well

- Dark theme — consistent, easy on eyes
- Clear action cards on home page
- Filter system with chips for muscle groups + equipment
- Timer variety (AMRAP, EMOM, Tabata, For Time)
- Set logging UI with RIR tracking
- Bottom navigation — appropriate item count
- Data export/import in settings

---

## Priority Matrix

| Priority | Issues                 | Suggested Sprint |
| -------- | ---------------------- | ---------------- |
| High     | #1, #2, #3             | Next             |
| Medium   | #4, #5, #6, #7, #8     | Backlog          |
| Low      | #9, #10, #11, #12, #13 | Nice-to-have     |

---

## Screenshots Reference

Screenshots were taken during review but not saved. Key screens reviewed:

- Home/Start page
- Log Past Workout (empty + modal)
- Workouts (Templates + Benchmarks tabs)
- Exercises list with filters
- Weight tracking
- Settings (scrolled full page)
- Active workout logging UI
- Quick Timer selection
