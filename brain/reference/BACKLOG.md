---
type: Reference
title: "Project Backlog"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/BACKLOG.md
tags: [reference]
timestamp: 2026-07-13T00:00:00Z
---
## Project Backlog

Feature ideas and improvements to tackle next.

## High Priority

- [x] **Progress charts/stats** ✅ Done — `ExerciseProgressView.vue` with PR cards and history chart
- [x] **Exercise history** ✅ Done — `WorkoutPreviousHistory.vue` shows last used weights in active workout

## Medium Priority

- [x] **Workout calendar** ✅ Done — `WeekStrip.vue` + `WorkoutCalendarSheet.vue` on home screen
- [x] **Personal records (PRs)** ✅ Done — tracked in exercise progress and benchmark attempt history
- [ ] **Rest day reminders** - Push notifications for workout reminders

## Low Priority

- [ ] **Social/export** - Share workouts or export data to CSV
- [ ] **More languages** - Expand i18n translations beyond current languages

## Technical Improvements

- [ ] **Testing** - Increase integration test coverage
- [ ] **Performance** - Add virtual scrolling for long exercise lists
- [ ] **Offline sync** - Improve offline-first sync behavior

## Quick Wins

- [ ] **Exercise history preview** - Show last used weight in exercise picker
- [x] **Last workout summary** ✅ Done — `RecentWorkoutsSection.vue` on `TheHomeView.vue`
- [ ] **PR badges** - Show on workout summary when PR is hit

---

_Last updated: December 2024. Audited against codebase 2026-07-13 (see git history / CHANGELOG.md for what has shipped since)._
