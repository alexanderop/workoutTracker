---
type: Reference
title: "Dependency Update Notes"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/dependency-updates.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Dependency Update Notes

Project-specific notes for refreshing packages.

## Pnpm catalogs

Dependencies are pinned through `pnpm-workspace.yaml` catalogs. Prefer updating
catalog versions and regenerating `pnpm-lock.yaml` instead of replacing
`catalog:*` entries in `package.json`.

`pnpm update --latest --recursive` updates catalog versions, but it may also
rewrite `pnpm-workspace.yaml` formatting and comments.

## PWA build checks

`vite-plugin-pwa` fails production builds when Workbox reports assets over the
default precache size limit. Build-only reports such as `stats.html` should not
be precached; exclude them with `workbox.globIgnores` rather than increasing
`maximumFileSizeToCacheInBytes`.

The plugin also peers on `workbox-build`, so keep it declared in the build
catalog alongside `workbox-window`.

## Icons

`lucide-vue-next` is deprecated. Use `@lucide/vue` for Vue 3 icon imports.

## Lint majors

Major `eslint-plugin-unicorn` updates can add broad preference rules that imply
large mechanical renames or style churn. Keep project conventions encoded in
`eslint.config.ts` before doing source-wide rewrites.
