# Memory Command

This command helps you reference key learnings and insights saved in the `/memory` folder.

## Usage

Use `@.claude/commands/memory` or the shorthand `/memory` to reference important learnings and patterns from your project.

## Current Memories

**shadcn-components-usage.md**
- Key learning about not modifying shadcn/ui components
- Importance of checking underlying library documentation (reka-ui)
- Correct API usage for Switch component: `v-model` not `v-model:checked`

## How to Add New Memories

When you discover important patterns or learnings:

1. Save them to `/memory/{topic-name}.md`
2. Use a clear structure:
   - Problem
   - Root Cause
   - Solution
   - Key Takeaway
   - Reference (component, library, etc.)

## Example Memory Structure

```markdown
# Key Learning: [Topic]

## Problem
What went wrong?

## Root Cause
Why did it fail?

## Solution
How to fix it?

## Key Takeaway
General principle to remember

## Reference
- Component: ...
- Library: ...
```

## Why Keep Memories?

- Avoid repeating the same mistakes
- Build institutional knowledge
- Create a searchable reference for the team
- Document patterns and best practices specific to your project
