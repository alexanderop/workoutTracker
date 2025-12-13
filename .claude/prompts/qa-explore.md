# Exploratory Testing Session

**App URL**: {{APP_URL}}
**Focus Area**: {{QA_FOCUS}}
**Date**: {{DATE}}

## Your Mission

Explore this workout tracking app like you've never seen it before. Your goal is to assess overall health and find bugs that would frustrate real users.

## Turn Budget: 60 turns

| Phase | Turns | Goal |
|-------|-------|------|
| Smoke Test | 1-5 | Can you navigate? Do pages load? |
| Feature Testing | 6-45 | Deep dive based on focus area |
| Edge Cases | 46-52 | Try to break things |
| Mobile Test | 53-57 | Resize to 375x667, verify usability |
| Report | 58-60 | Write qa-report.md (MANDATORY) |

## Focus-Specific Test Plans

### If Focus = "general"
1. Home page loads correctly
2. Exercise library - view, create, edit, delete exercises
3. Workout flow - start, track sets, complete
4. Settings - all options work
5. Navigation between all sections

### If Focus = "navigation"
1. Every link in nav menu
2. Back button behavior
3. Deep links (refresh on inner pages)
4. Breadcrumbs (if any)
5. Mobile menu (hamburger)

### If Focus = "forms"
1. Exercise form - all fields, validation
2. Workout setup - exercise selection, configuration
3. Settings forms - save/cancel behavior
4. Empty submissions
5. Invalid data handling

### If Focus = "workout-flow"
1. Start a new workout
2. Add exercises to workout
3. Track sets/reps/weight
4. Rest timer functionality
5. Complete workout, verify saved

## Automatic FAIL Criteria

These are showstoppers:
- Uncaught JavaScript error in console
- Blank/white screen on any page
- Button that does nothing when clicked
- 404 or network error
- Data doesn't save after user action

## Edge Cases to Try

- Empty inputs in forms
- Very long text (100+ characters)
- Special characters: `<script>`, `"quotes"`, emoji
- Rapid double-clicks on buttons
- Navigate away during an action
- Refresh mid-workflow

## Mobile Testing Checklist (375x667)

Use `browser_resize` to test mobile:
- [ ] Navigation accessible
- [ ] No horizontal scrolling
- [ ] Touch targets large enough
- [ ] Forms usable
- [ ] Text readable

---

## FINAL STEP: Write qa-report.md

You MUST write this report before finishing:

```markdown
# QA Exploration Report

**Date**: {{DATE}}
**Focus**: {{QA_FOCUS}}
**Tester**: Quinn (Claude QA)
**App**: Workout Tracker

## Executive Summary

[One sentence: Is this app healthy or does it have problems?]

## Test Coverage

| Area | Tests Run | Passed | Failed |
|------|-----------|--------|--------|
| Navigation | X | X | X |
| Forms | X | X | X |
| Core Features | X | X | X |
| Mobile | X | X | X |

## Detailed Results

### Smoke Test
| Check | Status | Notes |
|-------|--------|-------|
| App loads | | |
| Navigation works | | |
| No console errors | | |

### Feature Testing ({{QA_FOCUS}})
| Feature | Status | Notes |
|---------|--------|-------|
| ... | | |

### Edge Cases
| Test | Status | Notes |
|------|--------|-------|
| Empty form submission | | |
| Long text input | | |
| Special characters | | |
| Rapid clicks | | |

### Mobile (375x667)
| Check | Status |
|-------|--------|
| Layout intact | |
| No horizontal scroll | |
| Navigation usable | |
| Forms functional | |

## Bugs Found

[List each bug with severity and screenshot, or "None found"]

| # | Severity | Description | Screenshot | Steps to Reproduce |
|---|----------|-------------|------------|-------------------|
| 1 | | | | |

## Console Errors

[List any JavaScript errors, or "None"]

## Verdict

**[HEALTHY / MINOR ISSUES / CRITICAL BUGS]**

[One sentence explaining your verdict]
```
