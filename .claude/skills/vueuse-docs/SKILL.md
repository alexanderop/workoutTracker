---
name: vueuse-docs
description: Answer questions about VueUse composables. Use when asked about VueUse functions, usage patterns, or finding the right composable for a task. Triggers include "vueuse", "useStorage", "useFetch", "useEventListener", or any question about VueUse library usage and composable discovery.
---

# VueUse Documentation Skill

Fetch official VueUse documentation to answer user questions accurately.

## Workflow

1. **Fetch the documentation index** from `https://vueuse.org/llms.txt`
2. **Identify relevant composables** based on the user's question
3. **Fetch specific function documentation** to get detailed information
4. **Provide accurate answers** with code examples from the official docs

## Documentation Structure

The llms.txt file contains URLs organized by category:

### Categories
- **State**: `useStorage`, `useLocalStorage`, `useSessionStorage`, `useRefHistory`
- **Browser**: `useClipboard`, `useFullscreen`, `useMediaQuery`, `usePermission`
- **Sensors**: `useMouse`, `useScroll`, `useWindowSize`, `useElementSize`
- **Network**: `useFetch`, `useEventSource`, `useWebSocket`
- **Animation**: `useTransition`, `useInterval`, `useTimeout`
- **Component**: `useVModel`, `useTemplateRefsList`
- **Watch**: `watchDebounced`, `watchThrottled`, `watchPausable`
- **Utilities**: `useDebounceFn`, `useThrottleFn`, `useToggle`

### URL Patterns
- Core functions: `https://vueuse.org/core/{functionName}/`
- Shared utilities: `https://vueuse.org/shared/{functionName}/`
- Add-ons: `https://vueuse.org/{addon-name}/{functionName}/`

## Instructions

### For "what composable should I use" questions
1. Fetch `https://vueuse.org/llms.txt` first
2. Search for functions matching the user's need
3. Fetch the specific function docs for the best matches
4. Compare options and recommend the best fit

### For specific function questions
1. Fetch the function page: `https://vueuse.org/core/{functionName}/`
2. Extract usage examples, options, and return values
3. Provide Vue 3 code examples using `<script setup>` syntax

### For "does VueUse have X" questions
1. Fetch the llms.txt index
2. Search for matching functionality
3. If found, fetch and explain; if not, say so clearly

## Response Format

```typescript
import { useFunctionName } from '@vueuse/core'

// Minimal working example
const result = useFunctionName(options)
```

Full docs: [link to vueuse.org]

## Rules

- ALWAYS fetch llms.txt first - never answer from memory alone
- Keep examples minimal and practical
- If multiple composables could work, briefly explain the trade-offs
- If no matching composable exists, say so clearly
- Use `<script setup>` syntax in all examples
