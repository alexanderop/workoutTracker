---
type: Reference
title: "NumericInput Feature Roadmap"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/feature-roadmap-numeric-input.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## NumericInput Feature Roadmap

> Expert analysis conducted: 2025-12-22

## Executive Summary

The NumericInputModal has a solid foundation but lacks **memory, learning, and contextual awareness**. To compete with Strong, Hevy, and JEFIT, focus on intelligent personalization.

**Positioning**: "Strong remembers your lifts. **Your App predicts your next PR.**"

---

## Quick Wins (1-2 Weeks)

### 1. Auto-Copy Previous Set

**Impact**: Massive time savings - users notice immediately

```ts
// Add to NumericInputModal logic
const lastSetValue = getLastSetValue(exerciseId, fieldType)
if (lastSetValue) {
  presets.unshift({
    value: lastSetValue,
    label: 'Last Time',
    highlight: true,
  })
}
```

### 2. Plate Calculator Display

**Impact**: Removes mental burden, increases perceived professionalism

```vue
<!-- Add below value display in modal -->
<div class="text-sm text-muted-foreground">
  Load: 20kg + 10kg + 5kg (each side)
</div>
```

### 3. PR Detection Toast

**Impact**: Dopamine = retention

```ts
if (isNewPR(weight, reps, exerciseId)) {
  showToast('New PR! Previous best: 95kg x 8')
}
```

---

## Short-Term (1 Month)

### 4. Exercise-Specific Preset Steps

- Squat/Deadlift: 5kg increments
- Accessories: 2.5kg increments
- Micro-load option: 0.5kg

### 5. Combined Set Entry Modal

Replace 3 modals with 1 unified entry form (weight + reps + RIR together).

### 6. Volume Tracking

Show session total volume in real-time header.

---

## Medium-Term (2-3 Months)

### 7. Smart Suggestions

"Last time: 100kg x 8. Try 102.5kg today?"

Based on:

- Previous session performance
- RIR trend analysis
- Progressive overload algorithm

### 8. Set Type Tags

- Warm-up / Working / Drop / AMRAP categorization
- Warm-up presets auto-adjust (-20%, -10% of working weight)

### 9. Preset Analytics

Track which presets are most used to inform algorithm adjustments.

---

## Long-Term (6+ Months)

### 10. Voice Logging

"One hundred by eight at two" → Auto-fills 100kg x 8 @ RIR 2

**Market Gap**: None of the competitors have robust voice logging.

### 11. AI Training Coach

"Based on your progress, I recommend increasing volume by 10% this week."

---

## Competitive Gap Analysis

| Feature                    | Strong | Hevy | Your App        |
| -------------------------- | ------ | ---- | --------------- |
| Auto-copy previous set     | Yes    | Yes  | **No**          |
| Plate calculator           | Yes    | Yes  | **No**          |
| PR detection               | Yes    | Yes  | **No**          |
| Progressive overload hints | No     | Yes  | **No**          |
| Smart/predictive presets   | No     | No   | **Opportunity** |
| Voice logging              | No     | No   | **Opportunity** |

---

## UX Considerations

### Instant-Apply Trade-off

Current: Tap preset = instant apply + close

**Risk**: Accidental taps in gym (sweaty hands, gloves)

**Alternative**: Unified confirm pattern - tap preset selects, requires confirm button (like keypad). Creates single mental model.

### Key Metrics to Track

- Modal abandonment rate
- Keypad usage % (high = preset range too narrow)
- Average time to complete set (target: <10s)
- Preset selection accuracy

---

## Data Opportunities

Track user input patterns to improve presets:

- If user always picks +5kg above suggestion → Adjust algorithm
- If user frequently uses keypad → Expand preset range
- Time-of-day performance (morning workouts often use less weight)

---

## Implementation Priority

| Priority | Feature                 | Effort  | Impact |
| -------- | ----------------------- | ------- | ------ |
| P0       | Auto-copy previous set  | 1 day   | High   |
| P0       | PR detection toast      | 1 day   | High   |
| P1       | Plate calculator        | 2 days  | Medium |
| P1       | Exercise-specific steps | 1 day   | Medium |
| P2       | Combined set modal      | 1 week  | High   |
| P2       | Smart suggestions       | 2 weeks | High   |
| P3       | Voice logging           | 1 month | Medium |
