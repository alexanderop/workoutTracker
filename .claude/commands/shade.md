---
description: List all available shadcn UI components in the project
allowed-tools: Bash(ls:*)
model: haiku
---

# Available shadcn/ui Components

Here are the shadcn UI components currently installed in this project:

<available_components>
!`ls -1 src/components/ui/`
</available_components>

When building UI features, use these components from `@/components/ui/<component>`.
Check the component's `index.ts` file for available exports.
