# Key Learning: shadcn/ui Component Usage

## Problem
Dark mode toggle was not working. The switch component toggled visually but didn't update the theme.

## Root Cause
When debugging the Switch component, I modified it to add custom event handlers and props (`v-model:checked` instead of the correct `v-model`). This violated the principle of not modifying shadcn/ui wrapper components.

## The Real Issue
The underlying component library **reka-ui** uses:
- `v-model` (binding to `modelValue` prop)
- `@update:modelValue` event

But I was trying to use:
- `v-model:checked` (non-existent prop)
- `@update:checked` event (non-existent event)

## Solution
1. **Never modify shadcn/ui components** - they are wrappers around underlying libraries
2. **Read the underlying library's documentation** - in this case, reka-ui's Switch component
3. **Use the correct API** - for reka-ui Switch:
   ```vue
   <Switch v-model="isDark" />
   ```
   NOT:
   ```vue
   <Switch v-model:checked="isDark" />
   ```

## Key Takeaway
When using shadcn/ui components, always:
- Check the underlying library's documentation (shadcn/ui wraps various libraries like reka-ui, radix-ui, etc.)
- Use components as-is without modifications
- Understand that shadcn components are just thin wrappers that forward props and events correctly
- If something doesn't work, the issue is likely in how you're using the component, not the component itself

## Reference
- **Component**: Switch
- **Library**: reka-ui
- **Correct Usage**: `v-model` instead of `v-model:checked`
