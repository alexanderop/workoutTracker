---
name: shadcn-vue-docs
description: Fetch and answer questions about shadcn-vue components and documentation. Use when asked about shadcn-vue usage, component APIs, installation, theming, or any Vue shadcn question. Triggers include "how do I use shadcn", "shadcn component", "shadcn-vue docs", "what shadcn components are available", or any question about vue-shadcn library usage and configuration.
---

# shadcn-vue Documentation Skill

Fetch official shadcn-vue documentation to answer user questions accurately.

## Workflow

1. **Fetch the documentation index** from `https://www.shadcn-vue.com/llms.txt`
2. **Identify relevant pages** based on the user's question
3. **Fetch specific documentation pages** to get detailed information
4. **Provide accurate answers** with code examples from the official docs

## Documentation Structure

The llms.txt file contains URLs for all documentation pages:

### Core Documentation
- Introduction: `https://shadcn-vue.com/docs`
- CLI: `https://shadcn-vue.com/docs/cli`
- components.json: `https://shadcn-vue.com/docs/components-json`
- Theming: `https://shadcn-vue.com/docs/theming`

### Installation Guides
Pattern: `https://shadcn-vue.com/docs/installation/{framework}`
- Frameworks: vite, nuxt, astro, laravel, manual

### Components (47 total)
Pattern: `https://shadcn-vue.com/docs/components/{component-name}`

Common components:
- Form elements: form, field, input, textarea, checkbox, radio-group, select, switch, slider
- Layout: card, dialog, sheet, drawer, tabs, accordion, collapsible
- Feedback: alert, alert-dialog, toast, sonner, progress
- Navigation: breadcrumb, command, context-menu, dropdown-menu, menubar, navigation-menu
- Data display: avatar, badge, table, data-table, calendar, carousel
- Overlay: dialog, popover, tooltip, hover-card

### Dark Mode
Pattern: `https://shadcn-vue.com/docs/dark-mode/{framework}`
- Frameworks: vite, nuxt, vitepress, astro

### Forms
- Overview: `https://shadcn-vue.com/docs/forms`
- VeeValidate: `https://shadcn-vue.com/docs/forms/vee-validate`
- TanStack Form: `https://shadcn-vue.com/docs/forms/tanstack-form`

## Instructions

### For component questions
1. Fetch the component page: `https://shadcn-vue.com/docs/components/{component-name}`
2. Extract usage examples, props, and installation commands
3. Provide Vue 3 code examples using `<script setup>` syntax

### For installation questions
1. Fetch the relevant installation guide
2. Provide step-by-step instructions for the user's framework

### For theming questions
1. Fetch `https://shadcn-vue.com/docs/theming`
2. Explain CSS variables and customization options

### For "what components exist" questions
1. List all available components from the index
2. Group by category for easy browsing

## Example Prompts for WebFetch

When fetching docs, use prompts like:
- "Extract the complete usage example, props/API documentation, and installation command for this component"
- "Get the full installation steps and configuration options"
- "Extract all code examples and explain the component's purpose"
