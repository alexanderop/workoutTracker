---
type: Principle
title: Preserve long-now data
description: Schema and import/export changes must keep old workout data readable.
resource: brain/principles/preserve-long-now-data.md
tags: [principles, dexie, data]
timestamp: 2026-06-28T08:05:00Z
---

## Preserve Long-Now Data

The user's workout history should remain readable after schema changes, feature
changes, and app upgrades.

When changing persisted shapes:

- Update Dexie schema and repository converters together.
- Default new optional fields during database-to-domain conversion.
- Keep import/export validation in sync.
- Add tests that load older shapes when backward compatibility is at risk.

Related docs:

- [Database domain](../domains/database.md)
- [Workout block model](../reference/workout-block-model.md)
- [TIL: adding fields to block types](../reference/TIL-adding-fields-to-block-types.md)
