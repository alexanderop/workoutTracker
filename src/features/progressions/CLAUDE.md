# Progressions Feature

Kettlebell swing progression tracker with automatic advancement through reps → time → weight.

## Progression Logic

1. Start: X kg, 10 reps, 10 min EMOM
2. Each completed session: +2 reps (until 20)
3. At 20 reps: +2 min per session (until 20 min)
4. At 20 reps & 20 min: next kettlebell, reset to 10 reps & 10 min
5. User confirms completion after each session

## Key Files

| File | Purpose |
|------|---------|
| `lib/progressionLogic.ts` | Pure functions: `calculateNextLevel`, `getCurrentLevel`, `getProgressionPhase` |
| `composables/useProgressions.ts` | List all progressions |
| `composables/useProgression.ts` | Single progression detail + session history |
| `composables/useProgressionForm.ts` | Create progression form state |
| `composables/useProgressionSession.ts` | Active EMOM session with timer |

## Database

Tables: `progressions`, `progressionSessions` (Dexie v5)

Repository: `getProgressionsRepository()` from `@/db`

## Usage

```ts
// List progressions
const { state, reload } = useProgressions()

// Single progression
const { progression, level, progress, sessions } = useProgression(id)

// Create form
const { name, selectedWeights, toggleWeight, save } = useProgressionForm()

// Active session
const { level, currentMinute, startTimer, completeSession } = useProgressionSession(id)
```
