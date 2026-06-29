---
type: Reference
title: "How This Project Was Built"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/BUILD_HISTORY.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## How This Project Was Built

A step-by-step guide based on git history.

## Phase 1: Project Setup

1. **Initial commit** - Created Vue 3 project
2. **Dependencies & config** - Set up build tools, TypeScript, Vite
3. **Dark mode** - Implemented theme toggle with tests
4. **Styling** - Applied purple/violet color theme

## Phase 2: Core Workout Features

5. **Active workout view** - Built main workout UI with routing
6. **Exercises list** - Added popular exercises + custom exercise creation
7. **Component organization** - Renamed components to follow Vue naming conventions
8. **UI polish** - Improved spacing, animations, visual hierarchy

## Phase 3: Workout Logic

9. **Exercise editing** - Added set management functionality
10. **Set completion** - Implemented workout tracking with timer integration
11. **Drag-and-drop** - Added exercise reordering
12. **Rest timer** - Built composable for rest periods between sets

## Phase 4: Persistence

13. **IndexedDB storage** - Added Dexie-backed workout persistence
14. **Resume functionality** - Workouts survive app restarts
15. **Workout summary** - Added completion view with celebration animations

## Phase 5: Settings & Units

16. **Unit conversion** - Implemented kg/lb and cm/in toggle
17. **Settings UI** - Built settings page with sections and icons

## Phase 6: PWA & CI/CD

18. **PWA support** - Added offline capability and installability
19. **GitHub Actions** - Set up CI for lint, type-check, build, test

## Phase 7: Templates

20. **Template creation** - Built template management views
21. **Save as template** - Added ability to save completed workouts

## Phase 8: CrossFit/Timed Workouts

22. **Block architecture** - Unified strength and timed blocks
23. **Timed blocks** - Added AMRAP, EMOM, Tabata, For Time modes
24. **Timer components** - Split into individual timed block views

## Phase 9: UX Improvements

25. **Wake lock** - Keeps screen awake during workouts (with video fallback)
26. **Standalone timer** - Quick access timer from home screen
27. **Muscle filtering** - Filter exercises by muscle group

## Phase 10: Internationalization

28. **vue-i18n setup** - Added multi-language support
29. **Translations** - Extracted all UI strings

## Phase 11: Touch Gestures

30. **Swipe-to-reveal** - Added swipe gestures for block actions on mobile

## Phase 12+: Additional Features (post-history)

Implemented after this history was written:

- Benchmarks (custom timed WODs with attempt tracking and split comparison)
- Progressions (kettlebell swing/strength progressions with session tracking)
- Weight tracking (bodyweight log with chart and stats)
- Exercise progress view (PR cards + history chart per exercise)
- Log past workout (log a workout retroactively by date)
- Onboarding (first-run carousel)
- Cardio block type (sixth block kind alongside strength/AMRAP/EMOM/Tabata/ForTime)
- Architecture tests (ArchUnitTS, feature boundary enforcement)
- Full i18n (English + German, 12 translation domains)

---

## Tech Stack Summary

- **Framework**: Vue 3 + TypeScript
- **Build**: Vite
- **State**: VueUse `createGlobalState` singletons (stores) + plain-ref singleton (active workout) — no Pinia
- **Database**: Dexie (IndexedDB)
- **UI**: shadcn-vue components (built on reka-ui)
- **Testing**: Vitest browser mode (Playwright/Chromium)
- **i18n**: vue-i18n
- **PWA**: vite-plugin-pwa
