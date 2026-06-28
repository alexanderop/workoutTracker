---
type: Principle
title: Offline first, no spinner by default
description: Treat browser-local data and instant interaction as the default system behavior.
resource: brain/principles/offline-first-no-spinner.md
tags: [principles, local-first, pwa]
timestamp: 2026-06-28T08:05:00Z
---

## Offline First, No Spinner by Default

This is a local-first PWA. Inputs should update immediately and persist through
Dexie without blocking the user on a network round trip.

Design implications:

- Do not introduce required accounts or backend dependencies.
- Prefer optimistic local changes with durable persistence.
- If sync arrives later, it must be additive and conflict-aware.
- Show recovery states for local persistence errors, not generic loading spinners
  for normal interactions.

Related docs: [database domain](../domains/database.md) and
[AGENTS.md](../../AGENTS.md).
