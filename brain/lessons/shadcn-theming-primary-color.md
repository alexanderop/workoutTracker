---
type: Lesson
title: Changing primary color in shadcn-vue
description: Theme color changes must update light, dark, sidebar, and Tailwind token mappings.
resource: brain/lessons/shadcn-theming-primary-color.md
tags: [lesson, shadcn-vue, theming, oklch]
timestamp: 2026-06-28T08:05:00Z
---

## Changing Primary Color in shadcn-vue

This lesson was migrated from `.claude/memory`.

When using shadcn-vue with CSS variables enabled, the primary color is defined by
CSS variables in `src/style.css`. Update light and dark variants, and keep the
sidebar primary tokens consistent when the sidebar uses the same brand color.

Use OKLCH tokens, not hex or HSL. See the canonical theming map:
[UI and theming](../domains/ui-and-theming.md).
