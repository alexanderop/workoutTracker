---
name: vitest-docs
description: |
  ALWAYS USE THIS SKILL for ANY question about Vitest. This includes questions about:
  - Configuration (vitest.config.ts, workspaces, environments)
  - CLI options and flags (--browser, --environment, --project)
  - APIs (describe, it, expect, vi.fn, vi.mock, vi.spyOn)
  - Browser mode, jsdom, happy-dom setup
  - Coverage, snapshots, mocking, test filtering
  - How to do X in Vitest, can Vitest do Y, Vitest best practices

  Trigger phrases: "vitest", "in vitest", "vitest config", "vitest cli", "vi.fn", "vi.mock",
  "test environment", "browser testing vitest", "how do I test", "can I configure vitest"

  DO NOT answer Vitest questions from memory. ALWAYS fetch the official docs first.
proactive: true
---

# Vitest Documentation

Fast documentation lookup for the Vitest testing framework using the official llms.txt index.

## Quick Lookup

Fetch documentation from `https://vitest.dev/llms.txt` to get the full documentation index, then fetch specific pages as needed.

## Documentation Structure

The Vitest docs at vitest.dev cover:

- **Guide**: Getting started, features, CLI, filtering, mocking, snapshots, coverage, browser mode
- **API**: Test functions, assertions (expect), vi utilities, mocking
- **Config**: All configuration options for vitest.config.ts
- **Advanced**: Custom pools, reporters, extending matchers

## Lookup Workflow

**CRITICAL: Never answer Vitest questions from training data. Always fetch docs first.**

1. Fetch the specific documentation page from the common URLs below (skip llms.txt if you know the topic)
2. If unsure which page, fetch `https://vitest.dev/llms.txt` to find the right URL
3. Extract and present the relevant information with code examples from the docs

## Common Documentation URLs

| Topic | URL |
|-------|-----|
| Configuration | https://vitest.dev/config/ |
| CLI Options | https://vitest.dev/guide/cli |
| Mocking | https://vitest.dev/guide/mocking |
| Snapshot Testing | https://vitest.dev/guide/snapshot |
| Coverage | https://vitest.dev/guide/coverage |
| Browser Mode | https://vitest.dev/guide/browser/ |
| Test API | https://vitest.dev/api/ |
| Expect API | https://vitest.dev/api/expect |
| Vi Utilities | https://vitest.dev/api/vi |
| Mock Functions | https://vitest.dev/api/mock |

## Example Queries

**User asks about mocking:**
1. Fetch https://vitest.dev/guide/mocking
2. Present mocking patterns, vi.fn(), vi.mock(), vi.spyOn()

**User asks about configuration:**
1. Fetch https://vitest.dev/config/
2. Present relevant config options

**User asks about browser testing:**
1. Fetch https://vitest.dev/guide/browser/
2. Present browser mode setup and providers
