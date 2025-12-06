# Timer Audio TDD Implementation

## 1. Primary Request and Intent
User wants to add audio notifications to timer workouts so users can hear phase/round transitions even when not looking at the app. Implementation must:
- Follow TDD with Red-Green-Refactor cycle
- Use integration tests only (per project rules)
- Add a settings toggle to enable/disable sounds (default: enabled)
- Wire all 4 timer types (Tabata, EMOM, AMRAP, For Time) to play appropriate beeps

## 2. Key Technical Concepts
- **TDD Red-Green-Refactor**: Write failing tests first, implement to pass, then refactor
- **Web Audio API mocking**: Using `vi.fn()` mocks for `AudioContext`, `OscillatorNode`, `GainNode`
- **Vue 3.5 patterns**: `defineProps` destructure, composables, `watch` for reactive state
- **Timer composable callbacks**: `onPhaseChange`, `onRoundChange`, `onMinuteChange`, `onComplete`
- **Audio frequencies**: 880Hz (work), 440Hz (rest), 660Hz (round), ascending sequence (complete)

## 3. Files and Code Sections

### `src/views/TheSettingsView.vue`
- **Why important**: Added the timer sounds toggle UI
- **Changes made**: Added `Volume2` icon import, `handleTimerSoundChange` handler, and toggle UI in Screen section
- **Code snippet**:
```vue
<!-- Timer Sounds Toggle -->
<div class="flex items-center justify-between gap-4">
  <div class="flex items-start gap-3 min-w-0">
    <Volume2 class="size-5 text-muted-foreground mt-0.5 shrink-0" />
    <div class="min-w-0">
      <Label class="text-base cursor-pointer" for="timer-sound-toggle">{{
        t('settings.labels.timerSounds')
      }}</Label>
      <p class="text-sm text-muted-foreground">
        {{ t('settings.labels.playAudioCues') }}
      </p>
    </div>
  </div>
  <Switch
    id="timer-sound-toggle"
    :model-value="settingsStore.timerSoundEnabled"
    data-testid="timer-sound-toggle"
    class="shrink-0"
    @update:model-value="handleTimerSoundChange"
  />
</div>
```

### `src/components/timers/WorkoutTabataView.vue`
- **Why important**: First timer wired to audio - serves as pattern for others
- **Changes made**: Added `useTimerAudio` import, audio callbacks for phase/round/complete, and initial work beep on start
- **Code snippet**:
```typescript
const audio = useTimerAudio()

function handleComplete() {
  audio.playComplete()
  onComplete?.()
}

function handlePhaseChange(phase: 'work' | 'rest') {
  if (phase === 'work') {
    audio.playWorkBeep()
    return
  }
  audio.playRestBeep()
}

function handleRoundChange() {
  audio.playRoundBeep()
}

const timer = useTabataTimer({
  onComplete: handleComplete,
  onPhaseChange: handlePhaseChange,
  onRoundChange: handleRoundChange,
})

// Play work beep when timer first starts
watch(timer.isRunning, (isRunning, wasRunning) => {
  emit('update:isRunning', isRunning)
  if (isRunning && !wasRunning) {
    audio.playWorkBeep()
  }
})
```

### `src/__tests__/helpers/audioMock.ts`
- **Why important**: Provides reusable Web Audio API mocks for all timer audio tests
- **Changes made**: Created new file with mock setup, getters, and clear function

### `src/__tests__/setup.ts`
- **Why important**: Global test setup - audio mock must be initialized here
- **Changes made**: Added `setupAudioContextMock()` call at import time

### `src/__tests__/integration/timer-audio-playback.spec.ts`
- **Why important**: Integration tests for timer audio - validates full user flow
- **Changes made**: Created with Tabata tests (all pass), started EMOM tests
- **Key helpers**: `startShortTabata()`, `startShortEmom()`, `goToTimersPage()`

### `src/i18n/messages/en/settings.ts` and `de/settings.ts`
- **Why important**: i18n translations for settings toggle
- **Changes made**: Added `timerSounds` and `playAudioCues` labels

## 4. Problem Solving
- **AudioContext mock not being called**: Resolved by adding `setupAudioContextMock()` to `setup.ts` so it runs before any tests
- **Timer not actually starting**: Fixed by adding code to click the play button in test helpers (timer starts in idle state)
- **Type assertion hook blocking**: Used eslint-disable pattern already in codebase for Web Audio API mocks

## 5. Pending Tasks
Based on the TDD plan, these cycles remain:
1. **Cycle 3 GREEN**: Wire `WorkoutEmomView.vue` to audio (use `onMinuteChange` → `playRoundBeep()`, `onComplete` → `playComplete()`)
2. **Cycle 4 RED + GREEN**: Add AMRAP audio tests, wire `WorkoutAmrapView.vue` (only `onComplete` → `playComplete()`)
3. **Cycle 5 RED + GREEN**: Add For Time audio tests, wire `WorkoutForTimeView.vue` (only `onComplete` → `playComplete()`)

## 6. Current Work
Was in the middle of **Cycle 3 RED phase** - EMOM audio tests. Added:
- `startShortEmom()` helper function to `timer-audio-playback.spec.ts`
- Basic EMOM test describe block with one test

The test run was interrupted.

## 7. Next Step
**Wire EMOM view to audio (Cycle 3 GREEN)**:

Edit `src/components/timers/WorkoutEmomView.vue` following the Tabata pattern:
```typescript
import { useTimerAudio } from '@/composables/timers/useTimerAudio'

const audio = useTimerAudio()

function handleComplete() {
  audio.playComplete()
  onComplete?.()
}

function handleMinuteChange() {
  audio.playRoundBeep()
}

const timer = useEmomTimer({
  onComplete: handleComplete,
  onMinuteChange: handleMinuteChange,
})
```

Then continue with AMRAP and ForTime views (simpler - only need `playComplete()` on completion).

## Audio Behavior Summary

| Timer | Start | Phase Change | Round/Minute | Complete |
|-------|-------|--------------|--------------|----------|
| Tabata | `playWorkBeep()` | work→`playWorkBeep()` / rest→`playRestBeep()` | `playRoundBeep()` | `playComplete()` |
| EMOM | - | - | `playRoundBeep()` | `playComplete()` |
| AMRAP | - | - | - | `playComplete()` |
| For Time | - | - | - | `playComplete()` |

## Related Files
- Plan file: `/Users/alex/.claude/plans/fluttering-marinating-pretzel.md`
- Existing audio composable: `src/composables/timers/useTimerAudio.ts`
- Settings store: `src/stores/settings.ts` (already has `timerSoundEnabled`)
