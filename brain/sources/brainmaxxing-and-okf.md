---
type: Reference
title: Brainmaxxing and OKF adaptation
description: How the reference Brainmaxxing repo was adapted into this project's agent brain.
resource: brain/sources/brainmaxxing-and-okf.md
tags: [brain, brainmaxxing, okf, agents]
timestamp: 2026-06-28T08:05:00Z
---

## Brainmaxxing and OKF Adaptation

This repo brain was seeded after inspecting
[poteto/brainmaxxing](https://github.com/poteto/brainmaxxing) in `/tmp`.

## What Brainmaxxing Contributed

Brainmaxxing is intentionally small:

- `brain/index.md` is the entry point.
- `brain/principles.md` routes to individual principle files.
- `brain/plans/index.md` gives agents a place for long-running plans.
- Claude-facing instructions tell agents to read the brain first, write down
  durable learnings, and prune stale notes.

The useful pattern is not the exact starter content. The useful pattern is a
single repo-local memory root with indexes and one concept per file.

## What OKF Changes

The pasted Open Knowledge Format reference adds a portability layer:

- Every concept file has YAML frontmatter.
- `type`, `title`, `description`, `resource`, `tags`, and `timestamp` are
  queryable without reading the whole body.
- Normal markdown links define the graph, so the brain works outside Obsidian or
  one specific agent runtime.
- Index files support progressive disclosure for agents with limited context.
- `log.md` records meaningful knowledge-structure changes.

## Project Adaptation

This workout tracker keeps canonical technical detail in `brain/reference/` and
uses `brain/` as the routing and memory layer above it. Domain notes point
agents to the right references, source files, gotchas, and verification
commands.

The rule of thumb: `brain/` decides what to read and remember;
`brain/reference/` remains the deeper reference.
