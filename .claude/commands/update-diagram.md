---
description: Update component architecture diagram in CLAUDE.md
allowed-tools: Glob, Grep, Read, Edit
model: sonnet
---

# Update Component Architecture Diagram

Analyze the Vue component structure and update the mermaid diagram in CLAUDE.md.

## Instructions

1. **Scan the component structure**:
   - Find all `.vue` files in `src/components/` and `src/views/`
   - Identify parent-child relationships by analyzing imports and template usage

2. **Analyze relationships**:
   - Look for `import` statements that import other components
   - Check `<template>` sections for component usage
   - Group components by their parent view/feature

3. **Update the diagram**:
   - Read `CLAUDE.md` and find the `### Component Hierarchy` section
   - Generate an updated mermaid flowchart reflecting the current architecture
   - Replace the existing diagram with the new one

4. **Preserve the format**:
   - Keep the same mermaid flowchart style (TD direction, subgraphs)
   - Maintain readable node labels with component names
   - Group related components in subgraphs by feature

## Output

After updating, show a summary of:
- New components added
- Removed components
- Changed relationships
