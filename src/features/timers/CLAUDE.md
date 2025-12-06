# Timers Feature

Provides standalone timer execution UI for CrossFit-style timed blocks.

## Purpose

This feature handles running timed workout blocks (AMRAP, EMOM, Tabata, For Time) outside the main workout flow. It provides the `StandaloneTimerRunner` for executing any timed block with play/pause/reset controls.

## Public API (`index.ts`)

### Components
- `StandaloneTimerRunner` - Full-screen timer execution UI with controls
- `TimerPresetSelector` - Rest timer preset picker with custom duration support

## Key Concepts

### StandaloneTimerRunner
Orchestrates timed block execution:
- Renders the appropriate timer view based on `block.kind`
- Provides unified controls (play/pause, reset, exit)
- Handles completion state and "do again" flow
- Emits `exit` and `complete` events

Supported block kinds:
- `amrap` → `WorkoutAmrapView`
- `emom` → `WorkoutEmomView`
- `tabata` → `WorkoutTabataView`
- `fortime` → `WorkoutForTimeView`

### Timer View Interface
All timer views expose the same interface via template ref:
```typescript
type TimerViewExposed = {
  toggle: () => void        // Play/pause
  reset: () => void         // Reset to start
  complete: () => unknown   // Mark as done
  isRunning: { value: boolean }
  formattedTime: { value: string }
}
```

### TimerPresetSelector
Rest timer configuration with:
- Preset buttons (30s, 60s, 90s, 120s, 180s)
- Custom duration input form
- Expandable/collapsible custom form section

## Internal Components

Located in `components/` but not exported:
- `TimerCustomForm` - Number input for custom duration
- `TimerPresetButton` - Individual preset button
- `TimerPresetList` - Grid of preset buttons

## Related Code

- Timer composables: `src/composables/useRestTimer.ts`, `useTimerState.ts`
- Timer views: `src/components/timers/` (AMRAP, EMOM, Tabata, ForTime views)
- Block types: `src/types/blocks.ts` (AmrapBlock, EmomBlock, etc.)

## Common Tasks

### Add a new timer preset
Edit `TimerPresetList.vue` - add to the presets array

### Customize timer controls
Edit `StandaloneTimerRunner.vue` - modify the controls section

### Add a new timed block type
1. Add type to `src/types/blocks.ts`
2. Create view in `src/components/timers/`
3. Add case to `StandaloneTimerRunner.vue` template
