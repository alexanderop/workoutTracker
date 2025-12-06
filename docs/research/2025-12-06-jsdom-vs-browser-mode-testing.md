# jsdom vs Browser Mode Testing: NumberField Input Handling

## Problem Summary

Integration tests that passed in jsdom mode failed when running in browser mode (Playwright/Chromium). The tests involved filling NumberField inputs (weight, reps, RIR) and clicking a "Complete Set" button that becomes enabled only when all inputs have values.

**Failure count:** 19 tests failed in browser mode, 0 in jsdom mode.

## Root Cause

### 1. CSS `disabled` Attribute Enforcement

**jsdom behavior:** Does not enforce CSS styles or the `disabled` attribute on buttons. A disabled button can still be clicked, and clicks are processed normally.

**Browser mode behavior:** Enforces CSS styles including `pointer-events: none` on disabled buttons. Clicks on disabled buttons are blocked by the browser.

### 2. NumberField (reka-ui) Input Event Handling

**jsdom behavior:** `user.type()` from Testing Library triggers Vue's reactivity system correctly. After typing `100` into a NumberField, the Vue model updates and the component re-renders.

**Browser mode behavior:** `user.type()` does not reliably trigger Vue model updates for reka-ui NumberField components. The DOM value changes, but the Vue reactive state does not update, leaving dependent computed properties (like button disabled state) unchanged.

## Technical Details

### Why user.type() Fails in Browser Mode

reka-ui's NumberField uses internal state management that intercepts and processes keyboard events. In browser mode:

1. `user.type()` dispatches keyboard events (keydown, keypress, keyup, input)
2. NumberField's internal handler receives these events
3. However, the Vue `modelValue` binding doesn't update synchronously
4. The button's `:disabled` computed property never re-evaluates
5. The button stays disabled, and `user.click()` fails

### Why Direct DOM Manipulation Works in Browser Mode

Setting the input value directly and dispatching events bypasses NumberField's keyboard handling:

```typescript
// Get the native setter to bypass React/Vue interception
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  'value',
)?.set

// Set value using native setter
nativeInputValueSetter.call(input, value)

// Dispatch events to trigger Vue reactivity
input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }))
input.dispatchEvent(new Event('change', { bubbles: true }))
```

This approach:
1. Sets the DOM value directly
2. Triggers input/change events that reka-ui NumberField listens to
3. Causes Vue model updates
4. Re-evaluates computed properties

### Why Direct DOM Manipulation Fails in jsdom

jsdom's synthetic event handling doesn't fully replicate browser behavior. The InputEvent dispatched manually doesn't trigger the same code paths as real user input, causing Vue's reactivity to not update.

## Solution Pattern

Create a helper that detects the environment and uses the appropriate strategy:

```typescript
async fillStrengthSetAndWaitForButton(
  inputs: { weight: Element; reps: Element; rir: Element },
  values: { weight: string; reps: string; rir: string },
  completeButton: Element,
): Promise<void> {
  if (this.isJsdomMode()) {
    // jsdom: user.type() works, skip button wait (disabled not enforced)
    await this.ctx.user.type(inputs.weight, values.weight)
    await this.ctx.user.type(inputs.reps, values.reps)
    await this.ctx.user.type(inputs.rir, values.rir)
    return
  }

  // Browser: direct DOM manipulation + wait for button
  this.setInputValueDirectly(inputs.weight, values.weight)
  this.setInputValueDirectly(inputs.reps, values.reps)
  this.setInputValueDirectly(inputs.rir, values.rir)
  await flushPromises()
  await waitFor(() => {
    if (completeButton.hasAttribute('disabled')) {
      throw new Error('Button still disabled')
    }
  })
}
```

### Environment Detection

```typescript
isJsdomMode(): boolean {
  return navigator.userAgent.toLowerCase().includes('jsdom')
}
```

## Key Learnings

1. **jsdom is not a real browser** - It doesn't enforce CSS, disabled states, or complex event handling. Tests that pass in jsdom may fail in real browsers.

2. **Component library internals matter** - reka-ui (and similar libraries like Radix) have internal state management that doesn't always play well with Testing Library's `user.type()` in browser mode.

3. **Native DOM APIs are more reliable in browser mode** - Using `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set` bypasses framework interception and works more reliably.

4. **Test both environments** - Running integration tests in both jsdom (fast) and browser mode (accurate) catches environment-specific issues.

5. **Browser mode reveals real user experience** - CSS disabled states, pointer-events, animations, and overlays all affect real user interactions. Browser mode tests catch these issues.

## Related Issues

- **Dialog overlay blocking clicks** - After closing a dialog, the overlay with `pointer-events: none` stays in DOM during animation. jsdom ignores this; browser mode blocks clicks. Solution: `waitForDialogClose()` that waits for overlay removal.

## Files Changed

- `src/__tests__/helpers/pages/CommonPO.ts` - Added `fillStrengthSetAndWaitForButton()` helper
- Various integration test files - Updated to use the new helper

## References

- [Testing Library user-event](https://testing-library.com/docs/user-event/intro)
- [Vitest Browser Mode](https://vitest.dev/guide/browser/)
- [reka-ui NumberField](https://reka-ui.com/components/number-field)
