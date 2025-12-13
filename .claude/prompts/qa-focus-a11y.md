# Accessibility Testing Session

**App URL**: {{APP_URL}}
**Focus**: Accessibility (WCAG 2.1 AA)
**Date**: {{DATE}}

## Your Mission

Test this workout tracker for accessibility compliance. Users with disabilities should be able to:
- Navigate entirely by keyboard
- Understand content via screen reader
- See content with visual impairments
- Operate without relying on color alone

## Turn Budget: 60 turns

| Phase | Turns | Goal |
|-------|-------|------|
| Keyboard Navigation | 1-20 | Complete all flows without mouse |
| Focus Management | 21-30 | Verify focus indicators and order |
| Screen Reader Simulation | 31-45 | Check ARIA and semantic HTML |
| Visual Accessibility | 46-55 | Color contrast, text sizing |
| Report | 56-60 | Write accessibility report |

## Keyboard Navigation Testing

### Required Keys
- `Tab` / `Shift+Tab` - Move between focusable elements
- `Enter` / `Space` - Activate buttons and links
- `Escape` - Close dialogs and menus
- `Arrow keys` - Navigate within components

### Test These Flows (Keyboard Only)

1. **Navigate to every page** using Tab and Enter
2. **Create an exercise** - fill form, submit, verify
3. **Start and complete a workout** - all interactions
4. **Open and close dialogs** - Escape should close
5. **Use all dropdown menus** - arrow keys should work
6. **Interact with timers** - start, pause, reset

### Keyboard Traps
A keyboard trap is when focus gets stuck and Tab doesn't move forward.
- Open each dialog → Can you Tab out or Escape?
- Open dropdown menus → Can you close them?
- Enter form fields → Can you leave?

## Focus Management

### Visual Focus Indicator
Every focusable element MUST have a visible focus indicator.

Test:
1. Tab through the entire page
2. Can you ALWAYS see which element is focused?
3. Is the focus ring visible against the background?

### Focus Order
Focus should follow a logical reading order (top→bottom, left→right).

Test:
1. Does Tab order match visual order?
2. After closing a dialog, does focus return to trigger?
3. After adding an item, where does focus go?

### Skip Links
- Is there a "Skip to content" link?
- Does it work?

## Screen Reader Compatibility

### Semantic HTML Checks
Using browser DevTools, verify:

| Element | Should Have |
|---------|-------------|
| Page | `<main>`, `<nav>`, `<header>` landmarks |
| Buttons | `<button>` not `<div onclick>` |
| Links | `<a href>` for navigation |
| Forms | `<label>` connected to inputs |
| Headings | Logical `h1` → `h2` → `h3` hierarchy |
| Lists | `<ul>/<ol>` for list content |

### ARIA Attributes
Check for:
- `aria-label` on icon-only buttons
- `aria-expanded` on toggles/accordions
- `aria-hidden` on decorative elements
- `aria-live` for dynamic content updates
- `role` attributes where needed

### Form Accessibility
For each form field:
- Does it have a visible label?
- Does it have `<label for="id">`?
- Are required fields marked with `aria-required`?
- Are errors announced with `aria-describedby`?

## Visual Accessibility

### Color Contrast
Text should have 4.5:1 contrast ratio (3:1 for large text).

Check:
- Body text against background
- Button text against button background
- Error messages
- Placeholder text
- Disabled state text

### Color Independence
Information should not rely on color alone.

Check:
- Error states have icon or text, not just red
- Success states have icon or text, not just green
- Charts/graphs have patterns, not just colors
- Links have underline, not just color difference

### Text Resizing
Zoom browser to 200%:
- Is all text still readable?
- Does layout still work?
- No horizontal scrolling required?

### Motion and Animation
- Can animations be disabled?
- No content flashes more than 3 times per second?
- Auto-playing content can be paused?

## Mobile Accessibility (375x667)

Resize viewport and check:
- Touch targets at least 44x44px
- Sufficient spacing between interactive elements
- No tiny text requiring zoom
- Pinch-to-zoom not disabled

## Bug Severity for Accessibility

| Severity | Criteria |
|----------|----------|
| **CRITICAL** | Complete blocker - feature unusable without mouse |
| **HIGH** | Major barrier - very difficult for disabled users |
| **MEDIUM** | Moderate issue - workaround possible but frustrating |
| **LOW** | Minor issue - best practice violation |

## Screenshot Naming

- `a11y-critical-keyboard-trap-in-dialog.png`
- `a11y-high-no-focus-indicator.png`
- `a11y-medium-missing-label.png`
- `a11y-low-heading-order-skip.png`

---

## FINAL STEP: Write qa-report.md

```markdown
# Accessibility Testing Report

**Date**: {{DATE}}
**Focus**: Accessibility (WCAG 2.1 AA)
**Tester**: Quinn (Claude QA)
**App**: Workout Tracker PWA

## Executive Summary

[One sentence: Can users with disabilities use this app effectively?]

## Keyboard Navigation

| Flow | Completable? | Issues |
|------|--------------|--------|
| Navigate all pages | ✅/❌ | |
| Create exercise | ✅/❌ | |
| Complete workout | ✅/❌ | |
| Use dialogs | ✅/❌ | |
| Use dropdowns | ✅/❌ | |

## Keyboard Traps Found

| Location | Severity | Description |
|----------|----------|-------------|
| ... | CRIT/HIGH | ... |

(Or "None found")

## Focus Management

| Check | Status | Notes |
|-------|--------|-------|
| All elements have visible focus | ✅/❌ | |
| Focus order is logical | ✅/❌ | |
| Focus returns after dialog close | ✅/❌ | |
| Skip link present | ✅/❌ | |

## Semantic HTML & ARIA

| Check | Status | Notes |
|-------|--------|-------|
| Landmark regions present | ✅/❌ | |
| Heading hierarchy correct | ✅/❌ | |
| Buttons are `<button>` | ✅/❌ | |
| Forms have labels | ✅/❌ | |
| Icon buttons have aria-label | ✅/❌ | |
| Dynamic content announced | ✅/❌ | |

## Visual Accessibility

| Check | Status | Notes |
|-------|--------|-------|
| Text contrast adequate | ✅/❌ | |
| Color not sole indicator | ✅/❌ | |
| 200% zoom works | ✅/❌ | |
| Animations controllable | ✅/❌ | |

## Mobile Accessibility (375x667)

| Check | Status | Notes |
|-------|--------|-------|
| Touch targets ≥44px | ✅/❌ | |
| Adequate spacing | ✅/❌ | |
| Text readable | ✅/❌ | |

## Issues Found

| # | Severity | WCAG Criterion | Description | Screenshot |
|---|----------|----------------|-------------|------------|
| 1 | CRIT/HIGH/MED/LOW | 2.1.1 Keyboard | | |

(Or "No issues found")

## WCAG 2.1 AA Compliance Checklist

| Principle | Status |
|-----------|--------|
| 1. Perceivable | ✅/⚠️/❌ |
| 2. Operable | ✅/⚠️/❌ |
| 3. Understandable | ✅/⚠️/❌ |
| 4. Robust | ✅/⚠️/❌ |

## Recommendations

[List accessibility improvements]

## Verdict

**[ACCESSIBLE / NEEDS IMPROVEMENTS / CRITICAL BARRIERS]**

[One sentence summary]
```
