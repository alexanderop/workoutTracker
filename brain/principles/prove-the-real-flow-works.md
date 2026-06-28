---
type: Principle
title: Prove the real flow works
description: Verify changes with evidence that covers the actual behavior changed.
resource: brain/principles/prove-the-real-flow-works.md
tags: [principles, verification, testing]
timestamp: 2026-06-28T08:05:00Z
---

## Prove the Real Flow Works

After a change, ask what evidence would prove the changed behavior works in the
real app. Type-checking and unit-level tests are useful, but they are not always
enough for a mobile-first workout flow.

Default gate before committing:

```bash
pnpm type-check && pnpm lint && pnpm test
```

For UI behavior, prefer Vitest browser-mode integration tests or an actual
browser smoke test of the affected route.

Related docs:

- [Testing domain](../domains/testing.md)
- [Vitest browser troubleshooting](../reference/vitest-browser-troubleshooting.md)
