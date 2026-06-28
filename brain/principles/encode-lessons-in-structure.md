---
type: Principle
title: Encode lessons in structure
description: Turn repeated mistakes into docs, tests, lint rules, helpers, or brain routing.
resource: brain/principles/encode-lessons-in-structure.md
tags: [principles, learning, agents]
timestamp: 2026-06-28T08:05:00Z
---

## Encode Lessons in Structure

If a correction or failure is likely to recur, capture it where future work will
hit it naturally.

Routing:

- One-off gotcha: add or update a [lesson](../lessons/index.md).
- Domain convention: update the matching [domain map](../domains/index.md) and
  canonical `brain/reference/` file.
- Repeated code smell: add a test, lint rule, helper, or architecture check.
- Outdated memory: delete it or replace it with a link to the current source.

This note adapts the Brainmaxxing principle of the same name to this repo and
the OKF-style brain structure.
